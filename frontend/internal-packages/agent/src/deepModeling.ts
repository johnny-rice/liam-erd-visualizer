import { END, START, StateGraph } from '@langchain/langgraph'
import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { WORKFLOW_ERROR_MESSAGES } from './chat/workflow/constants'
import {
  analyzeRequirementsNode,
  createProgressMessageNode,
  designSchemaNode,
  executeDdlNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  reviewDeliverablesNode,
  saveUserMessageNode,
  validateSchemaNode,
} from './chat/workflow/nodes'
import {
  createAnnotations,
  DEFAULT_RECURSION_LIMIT,
} from './chat/workflow/shared/langGraphUtils'
import type { WorkflowState } from './chat/workflow/types'
import type { Repositories } from './repositories'
import type { NodeLogger } from './utils/nodeLogger'

export interface DeepModelingParams {
  userInput: string
  schemaData: Schema
  history: [string, string][]
  organizationId?: string
  buildingSchemaId: string
  latestVersionNumber: number
  repositories: Repositories
  designSessionId: string
  userId: string
  logger: NodeLogger
  recursionLimit?: number
}

export type DeepModelingResult = Result<
  {
    text: string
  },
  Error
>

/**
 * Format chat history array into a string
 * @param history - Array of formatted chat history strings
 * @returns Formatted chat history string or default message if empty
 */
const formatChatHistory = (history: string[]): string => {
  return history.length > 0 ? history.join('\n') : 'No previous conversation.'
}

/**
 * Retry policy configuration for all nodes
 */
const RETRY_POLICY = {
  maxAttempts: 3,
}

/**
 * Create and configure the LangGraph workflow
 */
const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('saveUserMessage', saveUserMessageNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('createProgressMessage', createProgressMessageNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('executeDDL', executeDdlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('reviewDeliverables', reviewDeliverablesNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('finalizeArtifacts', finalizeArtifactsNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'saveUserMessage')
    .addEdge('createProgressMessage', 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edge for saveUserMessage - skip to finalizeArtifacts if error
    .addConditionalEdges('saveUserMessage', (state) => {
      return state.error ? 'finalizeArtifacts' : 'createProgressMessage'
    })

    // Conditional edge for designSchema - skip to finalizeArtifacts if error
    .addConditionalEdges('designSchema', (state) => {
      return state.error ? 'finalizeArtifacts' : 'executeDDL'
    })

    // Conditional edge for executeDDL - retry with designSchema if DDL execution fails
    .addConditionalEdges('executeDDL', (state) => {
      if (state.shouldRetryWithDesignSchema) {
        return 'designSchema'
      }
      if (state.ddlExecutionFailed) {
        return 'finalizeArtifacts'
      }
      return 'generateUsecase'
    })

    // Conditional edges for validation results
    .addConditionalEdges('validateSchema', (state) => {
      // success → reviewDeliverables
      // dml error or test fail → designSchema
      return state.error ? 'designSchema' : 'reviewDeliverables'
    })

    // Conditional edges for review results
    .addConditionalEdges('reviewDeliverables', (state) => {
      // OK → finalizeArtifacts
      // NG or issues found → analyzeRequirements
      return state.error ? 'analyzeRequirements' : 'finalizeArtifacts'
    })

  return graph.compile()
}

/**
 * Execute Deep Modeling workflow
 */
export const deepModeling = async (
  params: DeepModelingParams,
): Promise<DeepModelingResult> => {
  const {
    userInput,
    schemaData,
    history,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
    repositories,
    designSessionId,
    userId,
    logger,
    recursionLimit = DEFAULT_RECURSION_LIMIT,
  } = params

  // Convert history format with role prefix
  const historyArray = history.map(([role, content]) => {
    const prefix = role === 'assistant' ? 'Assistant' : 'User'
    return `${prefix}: ${content}`
  })

  // Create workflow state
  const workflowState: WorkflowState = {
    userInput: userInput,
    formattedHistory: formatChatHistory(historyArray),
    schemaData,
    organizationId,
    buildingSchemaId,
    latestVersionNumber,
    repositories,
    designSessionId,
    userId,
    logger,
    retryCount: {},
  }

  try {
    const compiled = createGraph()
    const result = await compiled.invoke(workflowState, {
      recursionLimit,
    })

    if (result.error) {
      return err(new Error(result.error))
    }

    return ok({
      text: result.finalResponse || result.generatedAnswer || '',
    })
  } catch (error) {
    logger.error(WORKFLOW_ERROR_MESSAGES.LANGGRAPH_FAILED, { error })

    const errorMessage =
      error instanceof Error
        ? error.message
        : WORKFLOW_ERROR_MESSAGES.EXECUTION_FAILED
    const errorState = { ...workflowState, error: errorMessage }
    const finalizedResult = await finalizeArtifactsNode(errorState)

    return err(new Error(finalizedResult.error || errorMessage))
  }
}
