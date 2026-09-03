export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface FileUploadItem {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
  webhookResponse?: string
}

export interface UploadRecord {
  id: string
  file_name: string
  file_type: string
  file_size: number
  status: 'success' | 'error'
  webhook_response: string | null
  created_at: string
}

export interface TranscriptRecord {
  id: string
  user_id: string
  video_url: string
  status: 'success' | 'error'
  transcript: string | null
  error_message: string | null
  created_at: string
}
