import { cancel, group, intro, outro, text } from '@clack/prompts'
import consola from 'consola'
import os from 'os'
import z from 'zod'

const DIR_PATH = `${os.homedir()}/.config/pugkin`
const FILE_PATH = `${DIR_PATH}/config.json`

const configFile = () => Bun.file(FILE_PATH, { type: 'application/json' })

const ConfigSchema = z.object({
    temperature: z.number().min(0).max(1),
    modelName: z.string(),
    openAIApiKey: z.string()
})

export type Config = z.infer<typeof ConfigSchema>

export async function loadConfig() {
    consola.debug(`Loading config from: ${FILE_PATH}`)

    await ensure()

    const json = await configFile().json<Config>()
    return ConfigSchema.safeParse(json)
}

export async function saveConfig(config: Partial<Config>) {
    await ensure()

    const json = await configFile().json<Config>()
    const validatedConfig = ConfigSchema.parse({ ...json, ...config })

    Bun.write(configFile(), JSON.stringify(validatedConfig, null, 4))

    return validatedConfig
}

export async function createConfigFlow() {
    intro(`Setting up your config file`)

    const configResult = await loadConfig()
    const initialConfig: Partial<Config> = configResult.success ? configResult.data : {}

    const { modelName, openAIApiKey, temperature } = await group(
        {
            modelName: () =>
                text({
                    message: `OpenAI model name`,
                    initialValue: initialConfig.modelName ?? 'gpt-4-0613'
                }),
            temperature: () =>
                text({
                    message: `GPT temperature`,
                    initialValue: initialConfig.temperature?.toString() ?? '0.8'
                }),
            openAIApiKey: () =>
                text({
                    message: `OpenAI API key`,
                    initialValue: initialConfig.openAIApiKey,
                    placeholder: 'sk-...'
                })
        },
        {
            onCancel: () => {
                cancel('Operation cancelled')
                process.exit(0)
            }
        }
    )

    await saveConfig({ modelName, temperature: parseFloat(temperature), openAIApiKey })

    outro(`Config updated!`)
}

async function ensure() {
    const exists = await configFile().exists()
    if (!exists) await Bun.write(configFile(), JSON.stringify({}))
}
