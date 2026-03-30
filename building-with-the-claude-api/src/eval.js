// Prompt evaluation runner for bash, java, and javascript tasks.
// Loads a dataset of programming tasks, runs each through the assistant,
// and collects results with scores for analysis.
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { log, inline, error } from "./log";
import { clear_context, add_user_message, chat } from "./assistant";

function select_assistant_expertise() {
  const available = ["bash", "java", "javascript"];
  let expertise;
  do {
    expertise = prompt(`Enter the assistant expertise (${available}):`);
  } while (!available.includes(expertise));
  return expertise;
}

function get_grader(expertise) {
  const graders = {
    bash: run_grader_for_bash,
    java: run_grader_for_java,
    javascript: run_grader_for_javascript,
  };
  const grader = graders[expertise];
  if (!grader) {
    error(`Unimplemented grader for expertise "${expertise}"`);
    process.exit(1);
  }
  return grader;
}

async function run_grader_for_bash(output) {
  // TODO: grading for bash
  return {
    score: 10,
  };
}

async function run_grader_for_java(output) {
  // TODO: grading for java
  return {
    score: 10,
  };
}

async function run_grader_for_javascript(output) {
  // TODO: grading for javascript
  return {
    score: 10,
  };
}

async function run_grader_by_model(test_case, output) {
  let prompt = `You are an expert code reviewer. Evaluate this AI-generated solution.

     Task: ${test_case.task}
     Solution: ${output}

     Provide your evaluation as a structured JSON object with:
     - "strengths": An array of 1-3 key strengths
     - "weaknesses": An array of 1-3 key areas for improvement
     - "reasoning": A concise explanation of your assessment
     - "score": A number between 1-10`;

  add_user_message(prompt);
  let grade = await chat({
    verbose: false,
    system: `Write only the JSON code. Do not include \`\`\`json. After the code, write "@json@".`,
    stop_sequences: ["@json@"],
  });
  return JSON.parse(grade);
}

async function run_prompt(test_case) {
  let prompt = `Please solve the following task: ${test_case.task}`;
  add_user_message(prompt);
  return await chat({ verbose: false });
}

async function run_test_case(test_case, code_grader) {
  clear_context(); // start fresh

  inline(" solving task with claude: ");
  let output = await run_prompt(test_case);
  log("ok");

  inline(" grading by model........: ");
  let model_grade = await run_grader_by_model(test_case, output);
  let model_score = model_grade.score;
  log("ok");

  inline(" grading by code.........: ");
  const user_grade = await code_grader(output);
  const user_score = user_grade.score;
  log("ok");

  let score = parseFloat(((model_score + user_score) / 2).toFixed(2));

  return {
    test_case: test_case,
    output: output,
    score: score,
  };
}

async function run_eval(dataset, code_grader) {
  const length = dataset.length;

  let results = [];

  let result;
  let test_case;
  for (let i = 0; i < length; i++) {
    log(`Running test case ${i + 1}/${length}`);
    test_case = dataset[i];
    result = await run_test_case(test_case, code_grader);
    results.push(result);
    log();
  }

  return results;
}

const expertise = select_assistant_expertise();
log();
const code_grader = get_grader(expertise);
const dir = dirname(fileURLToPath(import.meta.url));
const file = join(dir, `../datasets/ds-${expertise}.json`);
const dataset = JSON.parse(readFileSync(file, "utf-8"));
const results = await run_eval(dataset, code_grader);
log(JSON.stringify(results, null, 2));
