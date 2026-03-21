import { add_user_message, add_assistant_message, chat } from "./assistant";

function select_assistant_expertise() {
  const available = ["bash", "java", "javascript"];
  let expertise;
  do {
    expertise = prompt(`Enter the assistant expertise (${available}):`);
  } while (!available.includes(expertise));
  return expertise;
}

const end = `@codegen@`;
const expertise = select_assistant_expertise();
const options = {
  system: `You are a senior software architect and have a decade of experience in ${expertise}.
    You don't understand topics unrelated to the ${expertise} programming language.
    Do not answer on topics non-related to code generation.
    You breathe in ${expertise}.
    Write only code. After the code write ${end}.
    Do not include the \`\`\`${expertise}.
    Do not add empty line after the code and the tag.`,
  stop_sequences: [`${end}`], // only get message until this
};

console.log(`\nCODEGEN WITH AI ASSISTANT`);
console.log("   enter 'q' for exit");
while (true) {
  const user = prompt(">");
  if (user === "q") break;
  if (!user) continue;

  add_user_message(user);
  let answer = await chat(options);
  add_assistant_message(answer);
}
console.log("CODEGEN TERMINATED");
