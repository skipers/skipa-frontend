export function splitTrailingTableBlock(markdown: string): { stable: string; pendingTable: string } {
  if (!markdown || markdown.endsWith('\n\n')) {
    return { stable: markdown, pendingTable: '' }
  }

  const lines = markdown.split('\n')
  let lastContentLine = lines.length - 1
  while (lastContentLine >= 0 && lines[lastContentLine].trim() === '') {
    lastContentLine -= 1
  }
  if (lastContentLine < 0 || !isTableLine(lines[lastContentLine])) {
    return { stable: markdown, pendingTable: '' }
  }

  let firstTableLine = lastContentLine
  while (firstTableLine > 0 && isTableLine(lines[firstTableLine - 1])) {
    firstTableLine -= 1
  }

  const tableLines = lines.slice(firstTableLine, lastContentLine + 1)
  if (tableLines.length < 2 || !tableLines.some(isTableSeparatorLine)) {
    return { stable: markdown, pendingTable: '' }
  }

  return {
    stable: lines.slice(0, firstTableLine).join('\n'),
    pendingTable: lines.slice(firstTableLine).join('\n'),
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.includes('|')
}

function isTableSeparatorLine(line: string): boolean {
  return /^\|?[\s:|-]+\|[\s:|.-]*$/.test(line.trim()) && line.includes('-')
}
