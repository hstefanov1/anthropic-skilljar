// Interactive code generation feature for bash, java, and javascript.
// Uses stop sequences to return only code, without markdown formatting.
import { add_user_message, add_assistant_message, chat } from "./assistant";
import { log } from "./log";

function select_assistant_expertise() {
  const available = ["bash", "java", "javascript"];
  let expertise;
  do {
    expertise = prompt(`Enter the assistant expertise (${available}):`);
  } while (!available.includes(expertise));
  return expertise;
}

const expertise = select_assistant_expertise();
const options = {
  system: `You are a senior software architect and have a decade of experience in ${expertise}.
    You don't understand topics unrelated to the ${expertise} programming language.
    You breathe in ${expertise}.
    You write only code.
    Do not answer on topics non-related to code generation.
    Do not include \`\`\`${expertise}.
    After the code, write "@codegen@".`,
  stop_sequences: ["@codegen@"], // only get message until this
};

log(`\nCODEGEN WITH AI ASSISTANT`);
log("   enter 'q' for exit");
while (true) {
  const user = prompt(">");
  if (user === "q") break;
  if (!user) continue;

  add_user_message(user);
  let answer = await chat(options);
  add_assistant_message(answer);
}
log("CODEGEN TERMINATED");
