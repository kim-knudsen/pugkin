#! /usr/bin/env bun

import { defineCommand, runCommand, runMain, type ArgsDef, type ParsedArgs } from 'citty'
import { consola } from 'consola'
import { startChat } from './chat/openai-bridge'
import { createConfigFlow, loadConfig, saveConfig, type Config } from './config/config'

const configCommand = defineCommand({
    meta: {
        name: 'config',
        description: 'Update configuration'
    },
    args: {
        temperature: {
            type: 'string',
            description: 'The LLM temperature (0-1)',
            alias: 't'
        },
        modelName: {
            type: 'string',
            description: 'The name of the LLM, e.g. "gpt-4-0613"',
            alias: 'm'
        },
        openAIApiKey: {
            type: 'string',
            description: 'The OpenAI API key',
            alias: 'k'
        },
        interactive: {
            type: 'boolean',
            description: 'Interactive mode',
            alias: 'i'
        }
    },
    run: async ({ args, rawArgs }) => {
        consola.debug('config with args', rawArgs)
        if (args.interactive || rawArgs.length === 0) return createConfigFlow()

        const config: Partial<Config> = {}
        const { modelName, openAIApiKey, temperature } = args

        if (modelName) config.modelName = modelName
        if (openAIApiKey) config.openAIApiKey = openAIApiKey
        if (temperature) config.temperature = parseFloat(temperature)

        await saveConfig(config)

        consola.success('Config updated!')
    }
})

const chatCommand = defineCommand({
    meta: {
        name: 'chat',
        description: "Let's chat with OpenAI"
    },
    args: {
        input: {
            type: 'string',
            description: 'The prompt as a text file',
            alias: 'i'
        },
        prompt: {
            type: 'string',
            description: 'Prompt text',
            alias: 'p'
        },
        output: {
            type: 'string',
            description: 'Output file. If undefined, will print to stdout',
            alias: 'o'
        }
    },
    run: async ({ args }) => {
        consola.debug('chat with args', args)

        const config = await loadConfig()

        if (!config.success) {
            consola.info(`Looks like this is your first rodeo. Let's set up your config file.`)
            return createConfigFlow()
        }

        await startChat({ config: config.data, inputFile: args.input, outputFile: args.output })
    }
})

const main = defineCommand({
    meta: {
        name: 'pugkin',
        version: '0.1.0',
        description: 'OpenAI from the command line'
    },
    args: {
        verbose: {
            type: 'boolean',
            description: 'Verbose output',
            alias: 'v'
        }
    },
    setup({ args }) {
        if (args.verbose) consola.level = 4
    },
    run: async ({ args }) => {
        consola.debug(`main with args`, args)

        if (isSubCommand(args)) return
        runCommand(chatCommand, { rawArgs: [] })
    },
    subCommands: {
        config: configCommand,
        chat: chatCommand
    }
})

function isSubCommand<T extends ArgsDef = ArgsDef>(args: ParsedArgs<T>) {
    return args._.length > 0
}

runMain(main).catch(error => {
    consola.error(`Damn! Seems we hit an error`, error)
    process.exit(1)
})
