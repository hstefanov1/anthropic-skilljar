// Anthropic client wrapper that manages conversation history and streams responses.
// Exports add_user_message, add_assistant_message, and chat for use by feature modules.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = "claude-sonnet-4-6";
const messages = [];

export function add_user_message(text) {
  const message = { role: "user", content: text };
  messages.push(message);
}

export function add_assistant_message(text) {
  const message = { role: "assistant", content: text };
  messages.push(message);
}

export async function chat({ verbose: _verbose, ...options } = {}) {
  const verbose = _verbose ?? true;
  if (verbose) console.log("---");

  let answer = "";

  // prettier-ignore
  await client.messages.stream({
    model: `${model}`,
    max_tokens: 1024,
    messages: messages,
    ...options
  }).on("text", (text) => {
    if (verbose) process.stdout.write(text);
  }).on("end", () => {
    if (verbose) console.log();
  }).on("error", (e) => {
    process.stderr.write(`Ops, something went wrong =(\n\nERROR: ${e.message}`)
  }).on("contentBlock", (msg) => {
    answer = msg.text;
  }).finalMessage().catch(() => { }); // suppress the stack trace

  if (verbose) console.log("---");
  return answer;
}
