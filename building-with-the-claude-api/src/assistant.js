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

export async function chat({ ...options } = {}) {
  let answer = "";
  console.log("---");

  // prettier-ignore
  await client.messages.stream({
    model: `${model}`,
    max_tokens: 1024,
    messages: messages,
    ...options
  }).on("text", (text) => {
    process.stdout.write(text);
  }).on("end", () => {
    console.log();
  }).on("error", (e) => {
    process.stderr.write(`Ops, something went wrong =(\n\nERROR: ${e.message}`)
  }).on("contentBlock", (msg) => {
    answer = msg.text;
  }).finalMessage().catch(() => { }); // suppress the stack trace

  console.log("---");
  return answer;
}
