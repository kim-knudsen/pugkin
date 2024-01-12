import { sleep } from 'bun'

const MOCK_TEXT = `JavaScript (or, more formally, ECMAScript) is just a specification for a programming language. Anyone can write a JavaScript engine that ingests a valid JavaScript program and executes it. The two most popular engines in use today are V8 (developed by Google) and JavaScriptCore (developed by Apple). Both are open source.

But most JavaScript programs don't run in a vacuum. They need a way to access the outside world to perform useful tasks. This is where runtimes come in. They implement additional APIs that are then made available to the JavaScript programs they execute.`

export async function createMockReadableStream(delay = 2000, chunkSize: number = 10) {
    await sleep(delay)

    return new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder()
            let position = 0

            function enqueueNextChunk() {
                if (position < MOCK_TEXT.length) {
                    const chunk = MOCK_TEXT.slice(position, position + chunkSize)
                    controller.enqueue(encoder.encode(chunk))
                    position += chunkSize
                    setTimeout(enqueueNextChunk, 100)
                } else {
                    controller.close()
                }
            }

            enqueueNextChunk()
        }
    })
}
