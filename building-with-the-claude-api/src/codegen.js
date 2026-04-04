// Interactive code generation for bash, java, and javascript.
// Solves prompts with Claude, then grades solutions by model and code linter (prompt evaluation).
import { tmpdir } from "os";
import { unlinkSync } from "fs";
import { join } from "path";
import { log, inline, fail, error } from "./log";
import { add_user_message, add_assistant_message, chat, clear_context } from "./assistant";

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

async function run_linter(cmd, arg, type, solution) {
  const tmpFile = join(tmpdir(), `codegen.js.${Date.now()}.${type}`);
  await Bun.write(tmpFile, solution);

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

async function grade_bash(solution) {
  await require_cmd("shellcheck");

  const result = await run_linter("shellcheck", "--format=json", "sh", solution);
  const issues = result.stdout ? JSON.parse(result.stdout) : [];
  const score = score_issues(issues);

  return {
    score,
    issues,
  };
}

async function grade_java(solution) {
  await require_cmd("javac");

  const result = await run_linter("javac", null, "java", solution);
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

async function grade_javascript(solution) {
  await require_cmd("bun");

  const result = await run_linter("bun", "--syntax-check", "js", solution);
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

async function grade_by_model(expertise, prompt, solution) {
  clear_context(); // start fresh

  let message = `You are an expert code reviewer in ${expertise}.
    Regarding the below prompt, evaluate its AI-generated solution.

    Prompt: ${prompt}
    Solution: ${solution}

    Notes:
    - Code comments are optional, and must not be included as weaknesses.
    - No error handling or exception management is needed if the code does not require it.
    - Lack of documentation is completely acceptable.

    Provide your evaluation as a structured JSON object with:
    - "strengths": An array of 1-3 key strengths
    - "weaknesses": An array of 1-3 key areas for improvement (If no weaknesses, then return none)
    - "reasoning": A concise explanation of your assessment
    - "score": A number between 1-10`;

  const options = {
    verbose: false,
    system: `Write only the JSON code.
      Do not include \`\`\`json.
      After the code, write "@json@".`,
    stop_sequences: ["@json@"],
  };

  add_user_message(message);
  let result = await chat(options);
  return JSON.parse(result);
}

async function solve_prompt(expertise, prompt, grader) {
  clear_context(); // start fresh

  const options = {
    verbose: false,
    system: `You are a senior software architect and have a decade of experience in ${expertise}.
      You don't understand topics unrelated to the ${expertise} programming language.
      You breathe in ${expertise}.
      You write only code.
      Do not answer on topics non-related to code generation.
      Do not include \`\`\`${expertise}.
      After the code, write "@codegen@".`,
    stop_sequences: ["@codegen@"],
  };

  inline("solving with claude: ");
  add_user_message(prompt);
  const solution = await chat(options);
  add_assistant_message(solution);
  log("ok");

  inline("grading by model...: ");
  let model_grade = await grade_by_model(expertise, prompt, solution);
  let model_score = model_grade.score;
  log(`${model_score}`);
  for (const weakness of model_grade.weaknesses) {
    if (weakness === "none") break;
    log(` - ${weakness}`);
  }

  inline("grading by code....: ");
  const code_grade = await grader(solution);
  const code_score = code_grade.score;
  log(`${code_score}`);
  for (const issue of code_grade.issues) {
    log(` - ${issue.level}: ${issue.message}`);
  }

  let score = parseFloat(((model_score + code_score) / 2).toFixed(2));
  log(`evaluation score...: ${score}/10`);

  return {
    solution,
    score,
  };
}

const expertise = select_assistant_expertise();
const grader = select_grader(expertise);
log(`\nCODEGEN WITH AI ASSISTANT`);
log("   enter 'q' for exit");
while (true) {
  const user = prompt(">");
  if (user === "q") break;
  if (!user) continue;

  log("---");
  const result = await solve_prompt(expertise, user, grader);

  log();
  result.solution.split("\n").forEach((line) => {
    if (line.trim() !== "") log("  " + line);
  });
  log();

  log("---");
}
log("CODEGEN TERMINATED");
