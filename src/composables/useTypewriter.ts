export interface TypewriterControls {
  enqueue: (text: string) => void
  flush: () => void
  stop: () => void
}

export function createTypewriter(
  appendText: (text: string) => void,
  afterFrame?: () => void,
): TypewriterControls {
  let queue = ''
  let frameId: number | null = null
  let lastFrameAt = 0

  function schedule() {
    if (frameId !== null) return
    frameId = window.requestAnimationFrame(tick)
  }

  function tick(now: number) {
    frameId = null
    if (!queue) return

    const elapsed = lastFrameAt ? Math.max(12, now - lastFrameAt) : 16
    lastFrameAt = now
    const chunkSize = Math.max(2, Math.min(10, Math.floor(elapsed / 3)))
    const chunk = queue.slice(0, chunkSize)
    queue = queue.slice(chunk.length)
    appendText(chunk)
    afterFrame?.()

    if (queue) schedule()
  }

  return {
    enqueue(text: string) {
      if (!text) return
      queue += text
      schedule()
    },
    flush() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }
      if (!queue) return
      const remaining = queue
      queue = ''
      appendText(remaining)
      afterFrame?.()
    },
    stop() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }
      queue = ''
    },
  }
}
