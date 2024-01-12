import { cancel, isCancel, text } from '@clack/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { RunnableSequence } from 'langchain/runnables'
import { BytesOutputParser } from 'langchain/schema/output_parser'
import pc from 'picocolors'
import type { Config } from '../config/config'
import { createMockReadableStream } from '../utils/stream-utils'

interface Options {
    config: Config
    prompt?: string
    inputFile?: string
    outputFile?: string
    dryRun?: boolean
}

interface Writer {
    write: () => Promise<void>
}

export async function startChat({ config, inputFile, outputFile, prompt, dryRun }: Options) {
    const model = new ChatOpenAI({
        temperature: config.temperature,
        modelName: config.modelName,
        openAIApiKey: config.openAIApiKey
    })

    const promptInput = await determinePrompt({ prompt, inputFile })
    const chain = RunnableSequence.from([model, new BytesOutputParser()])

    const stream = dryRun ? await createMockReadableStream() : await chain.stream(promptInput)
    const writer = await outputWriter(stream, outputFile)

    await writer.write()
}

function outputWriter(stream: ReadableStream, outputFile?: string) {
    return outputFile ? fileWriter(stream, outputFile) : stdoutWriter(stream)
}

function fileWriter(stream: ReadableStream, outputFile: string): Writer {
    const decoder = new TextDecoder('utf-8')

    return {
        write: async () => {
            const file = Bun.file(outputFile)
            const writer = file.writer()

            for await (const input of stream) {
                const message = decoder.decode(input)
                writer.write(message)
            }

            writer.flush()
        }
    }
}

function stdoutWriter(stream: ReadableStream): Writer {
    const decoder = new TextDecoder('utf-8')
    const { stdout } = process

    return {
        write: async () => {
            stdout.write('\n')

            for await (const input of stream) {
                const message = decoder.decode(input)
                stdout.write(message)
            }

            stdout.write('\n')
        }
    }
}

async function determinePrompt({ prompt, inputFile }: Pick<Options, 'prompt' | 'inputFile'>) {
    if (prompt) return prompt
    if (inputFile) return Bun.file(inputFile).text()

    const inputText = await text({
        message: pc.bold(pc.cyan('How can I assist you today?')),
        placeholder: 'Tell me a joke about math'
    })

    if (isCancel(inputText) || !inputText) {
        cancel('Operation cancelled')
        return process.exit(0)
    }

    return inputText
}
