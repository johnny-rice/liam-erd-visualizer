'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useEffect, useRef, useTransition } from 'react'
import { generateTimelineItemId } from '@/features/timelineItems/services/timelineItemHelpers'
import type {
  TimelineItemEntry,
  TimelineItemType,
} from '@/features/timelineItems/types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { TimelineItem } from './components/TimelineItem'
import { sendChatMessage } from './services'

type DesignSession = {
  id: string
  organizationId: string
  timelineItems: TimelineItemType[]
  buildingSchemaId: string
  latestVersionNumber?: number
}

interface Props {
  schemaData: Schema
  designSession: DesignSession
  timelineItems: TimelineItemEntry[]
  onMessageSend: (entry: TimelineItemEntry) => void
}

export const Chat: FC<Props> = ({
  schemaData,
  designSession,
  timelineItems: realtimeTimelineItems,
  onMessageSend,
}) => {
  const [isLoading, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when component mounts or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Start AI response without saving user message (for auto-start scenarios)
  const startAIResponse = async (content: string) => {
    // Send chat message to API
    const result = await sendChatMessage({
      userInput: content,
      timelineItems: realtimeTimelineItems,
      designSession,
    })

    if (result.success) {
      // Scroll to bottom after successful completion
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    }
  }

  // TODO: Add rate limiting - Implement rate limiting for message sending to prevent spam
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      content,
      role: 'user',
      timestamp: new Date(),
    }
    onMessageSend(userMessage)

    startTransition(() => {
      startAIResponse(content)
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer}>
        {/* Display all timeline items */}
        {realtimeTimelineItems.map((timelineItem) => (
          <TimelineItem key={timelineItem.id} {...timelineItem} />
        ))}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        schema={schemaData}
      />
    </div>
  )
}
