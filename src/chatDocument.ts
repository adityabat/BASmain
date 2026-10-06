import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

function runsFromLine(line: string): TextRun[] {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  if (parts.length === 0) return [new TextRun('')]
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true })
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return new TextRun({ text: part.slice(1, -1), font: 'Consolas' })
    }
    return new TextRun(part)
  })
}

function paragraphFromLine(line: string): Paragraph {
  const heading = /^(#{1,3})\s+(.*)$/.exec(line)
  if (heading) {
    const level = heading[1].length === 1
      ? HeadingLevel.HEADING_1
      : heading[1].length === 2
        ? HeadingLevel.HEADING_2
        : HeadingLevel.HEADING_3
    return new Paragraph({ text: heading[2], heading: level })
  }

  const bullet = /^[-*]\s+(.*)$/.exec(line)
  if (bullet) {
    return new Paragraph({ children: runsFromLine(bullet[1]), bullet: { level: 0 } })
  }

  return new Paragraph({
    children: runsFromLine(line),
    spacing: { after: 120 },
  })
}

function bodyParagraphs(text: string): Paragraph[] {
  return text.replace(/\r\n/g, '\n').split('\n').map(paragraphFromLine)
}

async function saveDoc(title: string, body: string, filename: string) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
        ...bodyParagraphs(body),
      ],
    }],
  })
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Download one assistant reply as a .docx, including the question that prompted it. */
export async function downloadChatResponse(question: string | undefined, answer: string): Promise<void> {
  const parts = ['## Response', answer]
  if (question?.trim()) parts.unshift('## Question', question.trim())
  await saveDoc('Chat response', parts.join('\n\n'), 'chat-response.docx')
}

export async function downloadReport(title: string, body: string, filename: string): Promise<void> {
  await saveDoc(title, body, filename)
}
