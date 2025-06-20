import { schemaSchema } from '@liam-hq/db-structure'
import * as v from 'valibot'
import type { WorkflowState } from '../types'

/**
 * Valibot schema for WorkflowMode
 */
const workflowModeSchema = v.optional(v.picklist(['Ask', 'Build']))

/**
 * Valibot schema for AgentName
 */
const agentNameSchema = v.optional(
  v.picklist(['databaseSchemaAskAgent', 'databaseSchemaBuildAgent']),
)

/**
 * Valibot schema for WorkflowState
 */
const workflowStateSchema = v.object({
  mode: workflowModeSchema,
  userInput: v.string(),
  generatedAnswer: v.optional(v.string()),
  finalResponse: v.optional(v.string()),
  history: v.array(v.string()),
  schemaData: v.optional(schemaSchema),
  projectId: v.optional(v.string()),
  error: v.optional(v.string()),
  schemaText: v.optional(v.string()),
  formattedChatHistory: v.optional(v.string()),
  agentName: agentNameSchema,
  buildingSchemaId: v.string(),
  latestVersionNumber: v.optional(v.number()),
  organizationId: v.optional(v.string()),
  userId: v.optional(v.string()),
})

/**
 * Schema for validating LangGraph result
 */
const langGraphResultSchema = v.object({
  mode: v.optional(v.unknown()),
  userInput: v.unknown(),
  generatedAnswer: v.optional(v.unknown()),
  finalResponse: v.optional(v.unknown()),
  history: v.optional(v.unknown()),
  schemaData: v.optional(v.unknown()),
  projectId: v.optional(v.unknown()),
  error: v.optional(v.unknown()),
  schemaText: v.optional(v.unknown()),
  formattedChatHistory: v.optional(v.unknown()),
  agentName: v.optional(v.unknown()),
  buildingSchemaId: v.optional(v.unknown()),
  latestVersionNumber: v.optional(v.unknown()),
  organizationId: v.optional(v.unknown()),
  userId: v.optional(v.unknown()),
})

/**
 * Merge workflow states with proper fallbacks
 */
export const mergeStates = (
  baseState: WorkflowState,
  updates: Partial<WorkflowState>,
): WorkflowState => {
  return {
    ...baseState,
    ...updates,
    // Ensure arrays are properly handled
    history: updates.history || baseState.history || [],
  }
}

/**
 * Prepare final state for streaming
 */
export const prepareFinalState = (
  currentState: WorkflowState,
  initialState: WorkflowState,
): WorkflowState => {
  return {
    mode: currentState.mode || initialState.mode,
    userInput: currentState.userInput || initialState.userInput,
    history: currentState.history || initialState.history || [],
    schemaData: currentState.schemaData || initialState.schemaData,
    projectId: currentState.projectId || initialState.projectId,
    generatedAnswer: currentState.generatedAnswer,
    finalResponse: currentState.finalResponse,
    error: currentState.error,
    // Include processed fields
    schemaText: currentState.schemaText,
    formattedChatHistory: currentState.formattedChatHistory,
    agentName: currentState.agentName,
    // Include schema update fields
    buildingSchemaId:
      currentState.buildingSchemaId || initialState.buildingSchemaId,
    latestVersionNumber:
      currentState.latestVersionNumber || initialState.latestVersionNumber,
    organizationId: currentState.organizationId || initialState.organizationId,
    userId: currentState.userId || initialState.userId,
  }
}

/**
 * Create error state with proper fallbacks
 */
export const createErrorState = (
  baseState: WorkflowState,
  errorMessage: string,
): WorkflowState => {
  return {
    ...baseState,
    error: errorMessage,
  }
}

/**
 * Create fallback final state when generator fails
 */
export const createFallbackFinalState = (
  finalState: WorkflowState,
): WorkflowState => {
  const response = finalState.generatedAnswer || 'No response generated'

  return {
    ...finalState,
    finalResponse: response,
    history: [
      ...finalState.history,
      `User: ${finalState.userInput}`,
      `Assistant: ${response}`,
    ],
  }
}

/**
 * Convert WorkflowState to LangGraph compatible format
 */
export const toLangGraphState = (state: WorkflowState) => {
  return {
    mode: state.mode,
    userInput: state.userInput,
    generatedAnswer: state.generatedAnswer,
    finalResponse: state.finalResponse,
    history: state.history || [],
    schemaData: state.schemaData,
    projectId: state.projectId,
    error: state.error,
    schemaText: state.schemaText,
    formattedChatHistory: state.formattedChatHistory,
    agentName: state.agentName,
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    organizationId: state.organizationId,
    userId: state.userId,
  }
}

/**
 * Helper function to safely parse string values
 */
const parseOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  return undefined
}

/**
 * Helper function to safely parse string arrays
 */
const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value
  }
  return []
}

/**
 * Helper function to safely parse WorkflowMode
 */
const parseWorkflowMode = (value: unknown): WorkflowState['mode'] => {
  if (value === 'Ask' || value === 'Build') return value
  return undefined
}

/**
 * Helper function to safely parse AgentName
 */
const parseAgentName = (value: unknown): WorkflowState['agentName'] => {
  if (
    value === 'databaseSchemaAskAgent' ||
    value === 'databaseSchemaBuildAgent'
  ) {
    return value
  }
  return undefined
}

/**
 * Helper function to safely parse Schema
 */
const parseSchema = (value: unknown): WorkflowState['schemaData'] => {
  if (!value || typeof value !== 'object') return undefined

  try {
    const parseResult = v.safeParse(schemaSchema, value)
    return parseResult.success ? parseResult.output : undefined
  } catch {
    return undefined
  }
}

/**
 * Convert LangGraph result back to WorkflowState without type casting
 */
export const fromLangGraphResult = (
  result: Record<string, unknown>,
): WorkflowState => {
  // First validate the basic structure
  const parseResult = v.safeParse(langGraphResultSchema, result)
  if (!parseResult.success) {
    throw new Error(
      `Invalid LangGraph result structure: ${parseResult.issues.map((issue) => issue.message).join(', ')}`,
    )
  }

  const validatedResult = parseResult.output

  // Extract userInput (required field)
  const userInput =
    typeof validatedResult.userInput === 'string'
      ? validatedResult.userInput
      : ''

  // Build the WorkflowState with proper type validation
  const workflowState: WorkflowState = {
    mode: parseWorkflowMode(validatedResult.mode),
    userInput,
    generatedAnswer: parseOptionalString(validatedResult.generatedAnswer),
    finalResponse: parseOptionalString(validatedResult.finalResponse),
    history: parseStringArray(validatedResult.history),
    schemaData: parseSchema(validatedResult.schemaData),
    projectId: parseOptionalString(validatedResult.projectId),
    error: parseOptionalString(validatedResult.error),
    schemaText: parseOptionalString(validatedResult.schemaText),
    formattedChatHistory: parseOptionalString(
      validatedResult.formattedChatHistory,
    ),
    agentName: parseAgentName(validatedResult.agentName),
    // Schema update fields - buildingSchemaId is required, provide fallback
    buildingSchemaId:
      parseOptionalString(validatedResult.buildingSchemaId) || '',
    latestVersionNumber:
      typeof validatedResult.latestVersionNumber === 'number'
        ? validatedResult.latestVersionNumber
        : undefined,
    organizationId: parseOptionalString(validatedResult.organizationId),
    userId: parseOptionalString(validatedResult.userId),
  }

  // Final validation to ensure the result matches WorkflowState schema
  const finalParseResult = v.safeParse(workflowStateSchema, workflowState)
  if (!finalParseResult.success) {
    throw new Error(
      `Failed to create valid WorkflowState: ${finalParseResult.issues.map((issue) => issue.message).join(', ')}`,
    )
  }

  return finalParseResult.output
}
