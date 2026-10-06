export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

function storageKey(userId: string) {
  return `chat_messages_${userId}`
}

export function readStoredMessages(userId: string): StoredMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is StoredMessage => {
      if (!item || typeof item !== 'object') return false
      const row = item as StoredMessage
      return (row.role === 'user' || row.role === 'assistant')
        && typeof row.id === 'string'
        && typeof row.text === 'string'
    }).slice(-200)
  } catch {
    return []
  }
}

export function writeStoredMessages(userId: string, messages: StoredMessage[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(messages.slice(-200)))
}
