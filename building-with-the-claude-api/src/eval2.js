// Generic prompt evaluation runner for iterative prompt engineering.
// Guides the user through defining a topic, building a dataset with Claude,
// reviewing and evaluating prompts, and exporting a report.
import { add_user_message, chat } from "./assistant";
import { createInterface } from "readline";
import { log, inline } from "./log";

async function prompt_action(message) {
  const actions = [...message.matchAll(/\[(.*?)\]/g)].map((match) => match[1]);
  let action;
  do {
    action = prompt(`${message}:`);
  } while (!actions.includes(action));
  return action;
}

async function prompt_input(hint) {
  let result = "";

  if (hint) log(`${hint}`);

  const rl = createInterface({
    input: process.stdin,
  });

  try {
    inline("> ");
    for await (const line of rl) {
      if (line.trim().toLowerCase() === "q") break;
      result += line + "\n";
      inline("> ");
    }
  } finally {
    rl.close();
  }

  return result.trim();
}

async function generate_dataset(topic) {
  log("\nBuild your dataset with Claude");

  while (true) {
    let spec = await prompt_input(`${" ".repeat(3)}enter 'q' to generate`);

    while (true) {
      add_user_message(
        `
        You are an AI dataset generator.

        Goal:
        Create high-quality dataset items for a prompt evaluation of the topic provided.

        Rules:
        - Each item should represent a realistic and useful task or example.
        - Keep each item under 50 words.
        - Ensure variation in phrasing and intent.
        - No duplicates or near-duplicates.
        - Stick strictly to the output format.

        Output must be a valid JSON array in the following format:
        [
          {
            task: "<dataset item 1>"
          },
          {
            task: "<dataset item 2>"
          },
          {
            task: "<dataset item N>"
          }
        ]

        Topic: ${topic}
        Specification: ${spec}
        Number of items: 5
        `,
      );
      log();
      let dataset = await chat({
        system: `Write only the JSON code. Do not include \`\`\`json. After the code, write "@json@".`,
        stop_sequences: ["@json@"],
      });
      log();
      const action = await prompt_action("[k]eep, [r]egenerate, [e]dit prompt");
      if (action === "k") return { dataset: JSON.parse(dataset) };
      if (action === "e") break; // break inner loop -> re-read input
      // "r" continues inner loop -> regenerates with same prompt
    }
    log();
  }
}

log(`PROMPT EVALUATION`);
log();
log("\nProcess Overview:");
log(" 1. Define the topic");
log(" 2. Build the dataset");
log(" 3. Review the prompt");
log(" 4. Evaluate the prompt using the model");
log(" 5. Generate and export the report");
log(" 6. Complete the process or return to step 3 for improvement");
log();
const topic = prompt("Enter the topic name:");
const dataset = await generate_dataset(topic);
log(`${JSON.stringify(dataset, null, 2)}\n`);
