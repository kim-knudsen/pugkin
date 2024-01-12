# 💻 pugkin

Small CLI tool for hitting the OpenAI API. Written in [TypeScript](https://www.typescriptlang.org/) using [Bun](https://bun.sh/) as runtime.

<img width="700" height="516" src="https://knudsen.io/images/pugkin/terminal.svg">

## Installation

```bash
bun install
bun link
```

## Usage

Running the base command will start an interactive session with all output going to stdout. If this is the initial run, you'll be prompted to setup your configuration, i.e. specifying your `OPENAI_API_KEY` etc.

```bash
pugkin
```

You may also provide a prompt text file and specify output directly.

```bash
pugkin chat -i prompt.txt -o response.txt
```

For any addtional commands and options, use the help switch.

```bash
pugkin -h
```

## TODOS

-   [ ] Support `maxTokens`
-   [ ] Improve logging
-   [ ] Memory/session support
-   [ ] Display tokens used/price
-   [x] Support input and output files
