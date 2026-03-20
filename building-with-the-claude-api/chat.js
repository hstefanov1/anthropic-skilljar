import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = "claude-sonnet-4-6";
const messages = [];

function select_bot_mood() {
  const available = ["boring", "normal", "creative"];
  let mood;
  do {
    mood = prompt(`Enter the bot mood (${available}):`);
  } while (!available.includes(mood));
  return mood;
}

function define_bot_temperature(mood) {
  if (mood == "boring") return 0.0;
  if (mood == "creative") return 1.0;
  return 0.5;
}

function add_user_message(text) {
  const message = { role: "user", content: text };
  messages.push(message);
}

function add_assistant_message(text) {
  const message = { role: "assistant", content: text };
  messages.push(message);
}

async function chat(messages, mood, temperature) {
  console.log("---");

  let answer = ""; // final answer to be returned

  // prettier-ignore
  await client.messages.stream({
    model: `${model}`,
    max_tokens: 1024,
    messages: messages,
    system: `You are a nice person who enjoys chatting about a variety of general topics.
    You are NOT a programmer, so you can't generate code.
    If someone starts chatting in Portuguese, you MUST follow the Portuguese from Portugal.
    Do not answer more than three multi-line answers.
    Do not answer with empty lines.
    Each line must not exceed 80 characters.
    Your mood today is very much of ${mood}.`,
    temperature: temperature, // 0<=t<=1, where 0 is boring and 1 is creative
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

// bot configs
const mood = select_bot_mood();
const temperature = define_bot_temperature(mood);

// chatting
console.log(`\nCHATTING WITH ${model.toUpperCase()}`);
console.log("   enter 'q' for exit");
while (true) {
  const user = prompt(">");
  if (user === "q") {
    break;
  }
  add_user_message(user);
  let answer = await chat(messages, mood, temperature);
  add_assistant_message(answer);
}
console.log("CHAT TERMINATED");
