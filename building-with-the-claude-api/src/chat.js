// Interactive chat feature with a configurable mood (boring, normal, creative).
// Adjusts the assistant's temperature based on the selected mood and maintains conversation history.
import { add_user_message, add_assistant_message, chat } from "./assistant";

function select_assistant_mood() {
  const available = ["boring", "normal", "creative"];
  let mood;
  do {
    mood = prompt(`Enter the assistant mood (${available}):`);
  } while (!available.includes(mood));
  return mood;
}

function define_assistant_temperature(mood) {
  if (mood == "boring") return 0.0;
  if (mood == "creative") return 1.0;
  return 0.5;
}

const mood = select_assistant_mood();
const temperature = define_assistant_temperature(mood);
const options = {
  system: `You are a nice person who enjoys chatting about a variety of general topics.
    You are NOT a programmer, so you can't generate code.
    If someone starts chatting in Portuguese, you MUST follow the Portuguese from Portugal.
    Do not answer more than three multi-line answers.
    Do not answer with empty lines.
    Each line must not exceed 80 characters.
    Your mood today is very much of ${mood}.`,
  temperature: temperature, // 0<=t<=1, where 0 is boring and 1 is creative
};

console.log(`\nCHATTING WITH AI ASSISTANT`);
console.log("   enter 'q' for exit");
while (true) {
  const user = prompt(">");
  if (user === "q") break;
  if (!user) continue;

  add_user_message(user);
  let answer = await chat(options);
  add_assistant_message(answer);
}
console.log("CHAT TERMINATED");
