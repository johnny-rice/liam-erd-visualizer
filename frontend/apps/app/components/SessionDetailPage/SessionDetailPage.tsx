import { schemaSchema } from '@liam-hq/db-structure'
import type { ComponentProps, FC } from 'react'
import { safeParse } from 'valibot'
import { SessionDetailPageClient } from './SessionDetailPageClient'
import { getBuildingSchema } from './services/buildingSchema/server/getBuildingSchema'
import { buildPrevSchema } from './services/buildPrevSchema/server/buildPrevSchema'
import { getLatestVersion } from './services/latestVersion/server/getLatestVersion'

type Props = {
  designSession: ComponentProps<typeof SessionDetailPageClient>['designSession']
}

export const SessionDetailPage: FC<Props> = async ({ designSession }) => {
  const designSessionId = designSession.id

  const buildingSchema = await getBuildingSchema(designSessionId)
  const parsedSchema = safeParse(schemaSchema, buildingSchema?.schema)
  const initialSchema = parsedSchema.success ? parsedSchema.output : null

  const initialCurrentVersion = await getLatestVersion(buildingSchema?.id ?? '')
  const initialPrevSchema =
    initialSchema !== null && initialCurrentVersion !== null
      ? await buildPrevSchema({
          currentSchema: initialSchema,
          currentVersionId: initialCurrentVersion.id,
        })
      : null

  return (
    <SessionDetailPageClient
      designSession={designSession}
      initialSchema={initialSchema}
      initialPrevSchema={initialPrevSchema}
      initialCurrentVersion={initialCurrentVersion}
    />
  )
}
