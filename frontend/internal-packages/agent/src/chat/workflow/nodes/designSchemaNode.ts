import { AIMessage, HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { invokeDesignAgent } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'
import { withTimelineItemSync } from '../utils/withTimelineItemSync'

/**
 * Design Schema Node - DB Design & DDL Execution
 * Performed by dbAgent
 */
export async function designSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  const schemaText = convertSchemaToText(state.schemaData)

  // Remove reasoning field from AIMessages to avoid API issues
  // This prevents the "reasoning without required following item" error
  const messages = state.messages.map((msg) => {
    if (msg instanceof AIMessage) {
      // Create a new AIMessage without the reasoning field
      // Clone the message but exclude reasoning if it exists
      const { content, additional_kwargs, response_metadata } = msg
      const cleanedKwargs = { ...additional_kwargs }

      // Remove reasoning from additional_kwargs if it exists
      if ('reasoning' in cleanedKwargs) {
        delete cleanedKwargs['reasoning']
      }

      return new AIMessage({
        content,
        additional_kwargs: cleanedKwargs,
        response_metadata,
      })
    }
    return msg
  })

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    designSessionId: state.designSessionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    // Create a human message for error feedback to avoid reasoning API issues
    // Using HumanMessage prevents the "reasoning without required following item" error
    const errorFeedbackMessage = new HumanMessage({
      content: `The previous attempt failed with the following error: ${invokeResult.error.message}. Please try a different approach to resolve the issue.`,
    })

    // Return state with error feedback as HumanMessage for self-recovery
    return {
      ...state,
      messages: [errorFeedbackMessage],
      error: invokeResult.error,
    }
  }

  const { response, reasoning } = invokeResult.value

  // Log reasoning summary if available
  if (reasoning?.summary && reasoning.summary.length > 0) {
    for (const summaryItem of reasoning.summary) {
      await logAssistantMessage(
        state,
        repositories,
        summaryItem.text,
        assistantRole,
      )
    }
  }

  // Apply timeline sync to the message and clear retry flags
  const syncedMessage = await withTimelineItemSync(response, {
    designSessionId: state.designSessionId,
    organizationId: state.organizationId || '',
    userId: state.userId,
    repositories,
    assistantRole,
  })

  return {
    ...state,
    messages: [syncedMessage],
    latestVersionNumber: state.latestVersionNumber + 1,
  }
}
