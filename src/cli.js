import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { Interpreter } from "./interpreter.js";

/** Run source text through the lexer, parser, and a supplied interpreter instance. */
function execute(source, interpreter) {
  interpreter.interpret(parse(tokenize(source)));
}
/** Start the line-based REPL, retaining global variables between input lines. */
async function repl() {
  const interpreter = new Interpreter();
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: "mylang> " });
  console.log("MyLang v0.1.0 — type .exit to quit.");
  rl.prompt();
  for await (const line of rl) {
    if (line.trim() === ".exit") break;
    if (!line.trim()) { rl.prompt(); continue; }
    try {
      const trimmed = line.trim();
      // In the REPL, evaluate a bare expression and display its value.
      // Declarations and control-flow statements still use normal language syntax.
      const isStatement = /^(let|const|fn|if|else|while|return|print)\b/.test(trimmed)
        || trimmed.startsWith("{")
        || trimmed.startsWith("//");
      if (!isStatement) {
        const expression = trimmed.endsWith(";") ? trimmed.slice(0, -1) : trimmed;
        execute("print " + expression + ";", interpreter);
      } else {
        execute(line, interpreter);
      }
    }
    catch (error) { console.error(error instanceof Error ? error.message : String(error)); }
    rl.setPrompt("mylang> ");
    rl.prompt();
  }
}
/** Select file mode or interactive mode from the command-line arguments. */
async function main() {
  const file = process.argv[2];
  if (!file) { await repl(); return; }
  try {
    const source = await readFile(resolve(file), "utf8");
    execute(source, new Interpreter());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
main();
