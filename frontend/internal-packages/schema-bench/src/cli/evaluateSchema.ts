import { evaluateSchema } from '../workspace/evaluation/evaluation.ts'
import type { EvaluationConfig } from '../workspace/types'
import {
  getWorkspacePath,
  handleCliError,
  handleUnexpectedError,
} from './utils/index.ts'

// Right now, the script processes process.argv directly and lives in this package since it's still rough and only meant for internal (Liam team) use.
// In the future, once things are more stable, we'd like to move this feature to the CLI package and rely on something like commander for argument parsing.

const runEvaluateSchema = async (): Promise<void> => {
  const workspacePath = getWorkspacePath()
  const args = process.argv.slice(2)

  let caseId: string | undefined
  const caseArg = args.find((arg) => arg.startsWith('--case='))
  if (caseArg) {
    caseId = caseArg.split('=')[1]
  }

  const casesArg = args.find((arg) => arg.startsWith('--cases='))
  if (casesArg && !caseId) {
    const cases = casesArg.split('=')[1]?.split(',')
    if (cases?.length === 1) {
      caseId = cases[0]
    }
  }

  const config: EvaluationConfig = {
    workspacePath,
    ...(caseId && { caseId }),
    outputFormat: 'json',
  }

  const result = await evaluateSchema(config)

  if (result.isErr()) {
    handleCliError('Schema evaluation failed', result.error)
  }
}

runEvaluateSchema().catch(handleUnexpectedError)
