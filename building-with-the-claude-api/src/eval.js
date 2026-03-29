// Prompt evaluation runner for bash, java, and javascript tasks.
// Loads a dataset of programming tasks, runs each through the assistant,
// and collects results with scores for analysis.
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { add_user_message, chat } from "./assistant";

function select_assistant_expertise() {
  const available = ["bash", "java", "javascript"];
  let expertise;
  do {
    expertise = prompt(`Enter the assistant expertise (${available}):`);
  } while (!available.includes(expertise));
  return expertise;
}

async function run_prompt(test_case) {
  let prompt = `Please solve the following task: ${test_case.task}`;
  add_user_message(prompt);
  return await chat({ verbose: false });
}

async function run_test_case(test_case) {
  let output = await run_prompt(test_case);

  // TODO - grading
  let score = 10;

  return {
    test_case: test_case,
    output: output,
    score: score,
  };
}

async function run_eval(dataset) {
  const length = dataset.length;

  let results = [];

  let result;
  let test_case;
  for (let i = 0; i < length; i++) {
    process.stdout.write(`Running test case ${i + 1}/${length}... `);
    test_case = dataset[i];
    result = await run_test_case(test_case);
    results.push(result);
    process.stdout.write("ok\n");
  }

  return results;
}

const expertise = select_assistant_expertise();
console.log();
const dir = dirname(fileURLToPath(import.meta.url));
const file = join(dir, `../datasets/ds-${expertise}.json`);
const dataset = JSON.parse(readFileSync(file, "utf-8"));
const results = await run_eval(dataset);
console.log(JSON.stringify(results, null, 2));
