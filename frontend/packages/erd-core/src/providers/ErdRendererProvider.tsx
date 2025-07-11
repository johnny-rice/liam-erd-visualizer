import { NuqsAdapter } from 'nuqs/adapters/react'
import type { FC, PropsWithChildren } from 'react'
import { SchemaProvider, type SchemaProviderValue } from '@/stores'
import { UserEditingProvider } from '@/stores/userEditing'

type Props = {
  schema: SchemaProviderValue
  showDiff?: boolean
}

export const ErdRendererProvider: FC<PropsWithChildren<Props>> = ({
  schema,
  showDiff,
  children,
}) => {
  return (
    <NuqsAdapter>
      <UserEditingProvider showDiff={showDiff}>
        <SchemaProvider {...schema}>{children}</SchemaProvider>
      </UserEditingProvider>
    </NuqsAdapter>
  )
}
