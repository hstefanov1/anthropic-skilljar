# Building with the Claude API

To install dependencies:

```bash
bun install
```

To run:

```bash
sh start_app.sh <optional_feature_name>
```

To debug:

```bash
sh start_debug_app.sh <optional_feature_name>
```

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Available Features

- [**chat**](./src/chat.js) — Interactive chat with a configurable mood (boring, normal, creative). Adjusts the assistant's temperature based on the selected mood and maintains conversation history.
- [**codegen**](./src/codegen.js) — Interactive code generation for bash, java, and javascript. Solves prompts with Claude, then grades solutions by model and code linter (prompt evaluation).
- [**eval**](./src/eval.js) — Prompt evaluation runner for bash, java, and javascript tasks. Loads a dataset of programming tasks, runs each through the assistant, and collects results with scores for analysis.
