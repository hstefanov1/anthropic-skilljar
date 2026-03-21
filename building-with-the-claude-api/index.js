const available = ["chat", "codegen"];
let feature;
do {
  feature = prompt(`Enter the feature to run (${available}):`);
} while (!available.includes(feature));

await import(`./src/${feature}`);
