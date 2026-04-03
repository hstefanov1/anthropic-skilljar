// Prompt evaluation runner for bash, java, and javascript tasks.
// Loads a dataset of programming tasks, runs each through the assistant,
// and collects results with scores for analysis.
import { tmpdir } from "os";
import { readFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { log, inline, fail, error } from "./log";
import { clear_context, add_user_message, chat } from "./assistant";

function select_assistant_expertise() {
  const available = ["bash", "java", "javascript"];
  let expertise;
  do {
    expertise = prompt(`Enter the assistant expertise (${available}):`);
  } while (!available.includes(expertise));
  return expertise;
}

function select_grader(expertise) {
  const graders = {
    bash: grade_bash,
    java: grade_java,
    javascript: grade_javascript,
  };
  const grader = graders[expertise];
  if (!grader) {
    error(`Unimplemented grader for expertise "${expertise}"`);
  }
  return grader;
}

function score_issues(issues) {
  const weights = { error: 3, warning: 2, info: 1, style: 0.5 };
  const penalty = issues.reduce((sum, i) => sum + (weights[i.level] ?? 0), 0);
  return Math.max(0, Math.round(10 - penalty));
}

async function require_cmd(cmd) {
  const proc = Bun.spawn(["which", cmd], { stdout: "pipe" });
  const exit = await proc.exited;
  const success = exit === 0;
  if (!success) {
    fail(`${cmd} not found in $PATH`);
  }
}

async function run_linter(cmd, arg, type, output) {
  const tmpFile = join(tmpdir(), `eval.js.${Date.now()}.${type}`);
  await Bun.write(tmpFile, output);

  const proc = Bun.spawn([cmd, ...(arg ? [arg] : []), tmpFile], {
    stdout: "pipe",
    stderr: "pipe",
  });
  await proc.exited;

  unlinkSync(tmpFile);

  const err = await new Response(proc.stderr).text();
  const out = await new Response(proc.stdout).text();

  return {
    stdout: out,
    stderr: err,
  };
}

async function grade_bash(output) {
  await require_cmd("shellcheck");

  const result = await run_linter("shellcheck", "--format=json", "sh", output);
  const issues = result.stdout ? JSON.parse(result.stdout) : [];
  const score = score_issues(issues);

  return {
    score,
    issues,
  };
}

async function grade_java(output) {
  await require_cmd("javac");

  const result = await run_linter("javac", null, "java", output);
  const issues = (result.stderr ? result.stderr.trim().split("\n") : [])
    .filter((l) => /: (error|warning|note):/.test(l))
    .map((l) => ({
      level: l.includes(": error:") ? "error" : l.includes(": warning:") ? "warning" : "info",
      message: l.trim(),
    }));
  const score = score_issues(issues);

  return {
    score,
    issues,
  };
}

async function grade_javascript(output) {
  await require_cmd("bun");

  const result = await run_linter("bun", "--syntax-check", "js", output);
  const issues = (result.stderr ? result.stderr.trim().split("\n") : [])
    .filter((l) => /^.*:\d+$/.test(l) === false && l.trim().length > 0)
    .map((l) => ({
      level: l.toLowerCase().includes("syntaxerror") ? "error" : "warning",
      message: l.trim(),
    }));
  const score = score_issues(issues);

  return {
    score,
    issues,
  };
}

async function grade_by_model(test_case, output) {
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

async function solve_task(test_case) {
  let prompt = `Please solve the following task: "${test_case.task}".
      Don't add comments or explanations to the solution.
      Don't use markdown tags in the solution.
      Provide only and solely the code solution.
      `;
  add_user_message(prompt);
  return await chat({ verbose: false });
}

async function evaluate_task(test_case, code_grader) {
  clear_context(); // start fresh

  inline(" solving task with claude: ");
  let output = await solve_task(test_case);
  log("ok");

  inline(" grading by model........: ");
  let model_grade = await grade_by_model(test_case, output);
  let model_score = model_grade.score;
  log(`${model_score}`);

  inline(" grading by code.........: ");
  const user_grade = await code_grader(output);
  const user_score = user_grade.score;
  log(`${user_score}`);

  let score = parseFloat(((model_score + user_score) / 2).toFixed(2));

  return {
    test_case: test_case,
    output: output,
    score: score,
  };
}

async function evaluate_dataset(dataset, code_grader) {
  const length = dataset.length;

  let results = [];

  let result;
  let test_case;
  for (let i = 0; i < length; i++) {
    log(`Running test case ${i + 1}/${length}`);
    test_case = dataset[i];
    result = await evaluate_task(test_case, code_grader);
    results.push(result);
    log();
  }

  return results;
}

const expertise = select_assistant_expertise();
log();
const code_grader = select_grader(expertise);
const dir = dirname(fileURLToPath(import.meta.url));
const file = join(dir, `../datasets/ds-${expertise}.json`);
const dataset = JSON.parse(readFileSync(file, "utf-8"));
const results = await evaluate_dataset(dataset, code_grader);
log(JSON.stringify(results, null, 2));
