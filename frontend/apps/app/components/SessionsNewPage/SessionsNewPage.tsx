'use client'

import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect } from 'react'
import * as v from 'valibot'
import styles from './SessionsNewPage.module.css'

const ApiSessionsCreateSchema = v.object({
  success: v.boolean(),
  designSession: v.object({
    id: v.string(),
  }),
})

export const SessionsNewPage: FC = () => {
  const router = useRouter()

  const createSession = useCallback(async () => {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error('Failed to create session')
    }

    const data = await response.json()
    const result = v.safeParse(ApiSessionsCreateSchema, data)

    if (!result.success) {
      throw new Error('Invalid response format')
    }

    if (result.output.success) {
      // Redirect to the project-independent session detail page
      router.push(`/app/design_sessions/${result.output.designSession.id}`)
    } else {
      throw new Error('Session creation failed')
    }
  }, [router])

  useEffect(() => {
    createSession()
  }, [createSession])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Creating Session ...</h1>
        <p className={styles.subtitle}>Creating a new design session</p>
      </div>
    </div>
  )
}
