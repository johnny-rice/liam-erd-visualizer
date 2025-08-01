'use client'

import type { FC, PropsWithChildren } from 'react'
import { match } from 'ts-pattern'
import type { TimelineItemEntry } from '../../../../types'
import { AgentMessage } from './components/AgentMessage'
import { ErrorMessage } from './components/ErrorMessage'
import { LogMessage } from './components/LogMessage'
import { QueryResultMessage } from './components/QueryResultMessage'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'

type Props = PropsWithChildren &
  TimelineItemEntry & {
    showHeader?: boolean
  }

export const TimelineItem: FC<Props> = (props) => {
  const { showHeader = true, ...timelineItemProps } = props

  return match(timelineItemProps)
    .with({ type: 'schema_version' }, ({ buildingSchemaVersionId, onView }) => (
      <AgentMessage state="default" assistantRole="db" showHeader={showHeader}>
        <VersionMessage
          buildingSchemaVersionId={buildingSchemaVersionId}
          onView={onView}
        />
      </AgentMessage>
    ))
    .with({ type: 'query_result' }, ({ queryResultId, results }) => (
      <AgentMessage state="default" assistantRole="db" showHeader={showHeader}>
        <QueryResultMessage
          queryResultId={queryResultId}
          results={Array.isArray(results) ? results : undefined}
        />
      </AgentMessage>
    ))
    .with({ type: 'user' }, ({ content, timestamp, userName }) => (
      <UserMessage
        content={content}
        timestamp={timestamp}
        userName={userName}
      />
    ))
    .with({ type: 'assistant_log' }, ({ content, role }) => (
      <AgentMessage
        state="default"
        assistantRole={role}
        showHeader={showHeader}
      >
        <LogMessage content={content} />
      </AgentMessage>
    ))
    .with({ type: 'assistant' }, ({ content, role, timestamp, children }) => (
      <AgentMessage
        state="default"
        assistantRole={role}
        message={content}
        time={timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
        showHeader={showHeader}
      >
        {children}
      </AgentMessage>
    ))
    .with({ type: 'error' }, ({ content, onRetry }) => (
      <AgentMessage state="default" assistantRole="db" showHeader={showHeader}>
        <ErrorMessage message={content} onRetry={onRetry} />
      </AgentMessage>
    ))
    .exhaustive()
}
