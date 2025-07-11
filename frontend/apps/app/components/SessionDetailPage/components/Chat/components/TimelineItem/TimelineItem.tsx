'use client'

import type { FC } from 'react'
import type { TimelineItem as TimelineItemProps } from '@/features/timelineItems/types'
import { AgentMessage } from './components/AgentMessage'
import { ProcessIndicator } from './components/ProcessIndicator'
import { UserMessage } from './components/UserMessage'
import { VersionMessage } from './components/VersionMessage'
import styles from './TimelineItem.module.css'

type Props = TimelineItemProps

export const TimelineItem: FC<Props> = (props) => {
  // Handle schema_version role separately
  if ('building_schema_version_id' in props) {
    return (
      <div className={styles.messageContainer}>
        <VersionMessage
          buildingSchemaVersionId={props.building_schema_version_id}
        />
      </div>
    )
  }

  // Handle progress role separately
  if (props.role === 'progress' && 'progress' in props) {
    const progress = props.progress
    return (
      <ProcessIndicator
        initialExpanded
        title="Processing AI Message"
        subtitle={props.content}
        progress={progress}
        status={progress >= 100 ? 'complete' : 'processing'}
      />
    )
  }

  // Destructure props for regular messages
  const { content, role, timestamp, avatarSrc, avatarAlt, initial, children } =
    props

  // Only format and display timestamp if it exists
  const formattedTime = timestamp
    ? timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className={styles.messageContainer}>
      {role === 'user' ? (
        <UserMessage
          content={content}
          timestamp={timestamp}
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          initial={initial}
        />
      ) : (
        <AgentMessage
          state="default"
          message={content}
          time={formattedTime || ''}
        >
          {children}
        </AgentMessage>
      )}
    </div>
  )
}
