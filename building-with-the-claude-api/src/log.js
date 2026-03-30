// Utilities for printing messages to stdout and stderr.
export function log(text) {
  console.log(text ? text : "");
}

export function inline(text) {
  process.stdout.write(text);
}

export function error(text) {
  console.error(`\nERROR: ${text}\n`);
}
