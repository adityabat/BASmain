import axios from 'axios'
import { AGENT_URL, agentAuthHeaders } from './agentApi'

function getUploadSessionId(): string {
  const stored = localStorage.getItem('upload_session_id')
  if (stored) return stored
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  localStorage.setItem('upload_session_id', id)
  return id
}

export async function uploadFileToWebhook(
  file: File,
  onProgress: (percent: number) => void,
  userId: string
): Promise<string> {
  const session = getUploadSessionId()

  const formData = new FormData()
  formData.append('action', 'upload')
  formData.append('data', file, file.name)
  formData.append('fileName', file.name)
  formData.append('fileType', file.type)
  formData.append('fileSize', String(file.size))
  formData.append('userId', userId)
  formData.append('session', session)

  try {
    const response = await axios.post(AGENT_URL, formData, {
      timeout: 60000,
      headers: await agentAuthHeaders(),
      onUploadProgress(progressEvent) {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(Math.min(percent, 99))
        }
      },
    })
    onProgress(100)
    return JSON.stringify(response.data)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { error?: unknown } | undefined
      if (typeof data?.error === 'string') throw new Error(data.error)
    }
    throw err
  }
}
