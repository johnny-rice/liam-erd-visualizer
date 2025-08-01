import { logger, task } from '@trigger.dev/sdk'
import {
  processRepositoryAnalysis,
  type RepositoryAnalysisPayload,
} from '../functions/processRepositoryAnalysis'

export const analyzeRepositoryTask = task({
  id: 'analyze-repository',
  run: async (payload: RepositoryAnalysisPayload) => {
    logger.log('Executing repository analysis task:', { payload })

    const result = await processRepositoryAnalysis(payload)

    if (result.isErr()) {
      throw result.error
    }

    const { processedFiles, errors } = result.value

    logger.log('Repository analysis completed:', {
      processedFiles: processedFiles,
      errorCount: errors.length, // TODO: fix this
    })

    if (errors.length > 0) {
      logger.warn('Repository analysis completed with errors:', {
        errors: errors,
      })
    }

    return result
  },
})
