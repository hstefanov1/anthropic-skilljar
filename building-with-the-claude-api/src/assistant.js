// Anthropic client wrapper that manages conversation history and streams responses.
// Exports add_user_message, add_assistant_message, and chat for use by feature modules.
import Anthropic from "@anthropic-ai/sdk";
import { log, inline, error } from "./log";

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
  if (verbose) log("---");

  let answer = "";

  // prettier-ignore
  await client.messages.stream({
    model: `${model}`,
    max_tokens: 1024,
    messages: messages,
    ...options
  }).on("text", (text) => {
    if (verbose) inline(text.trimEnd());
  }).on("end", () => {
    if (verbose) log();
  }).on("error", (e) => {
    error(`\nERROR: ${e.message}`)
  }).on("contentBlock", (msg) => {
    answer = msg.text;
  }).finalMessage().catch(() => {
    process.exit(1) // exit on unhandled stream error
  });

  if (verbose) log("---");
  return answer;
}
