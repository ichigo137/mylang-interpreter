import test from "node:test";
import assert from "node:assert/strict";
import { tokenize, LangError } from "../src/lexer.js";
import { parse } from "../src/parser.js";
import { Interpreter, run } from "../src/interpreter.js";

/** Run source in an isolated interpreter and collect printed output as strings. */
function execute(source) {
  const output = [];
  const interpreter = new Interpreter({ output: value => output.push(value) });
  interpreter.interpret(parse(tokenize(source)));
  return output;
}

test("prints strings and arithmetic", () => {
  assert.deepEqual(execute('print "hello"; print 2 + 3 * 4; print("parentheses");'), ["hello", "14", "parentheses"]);
});

test("variables, reassignment, and constants", () => {
  assert.deepEqual(execute("let x = 2; x = x + 5; print x; const y = 9; print y;"), ["7", "9"]);
  assert.throws(() => execute("const x = 1; x = 2;"), /Cannot reassign constant/);
});

test("if/else and truthiness", () => {
  assert.deepEqual(execute('if (false) { print "bad"; } else { print "good"; }'), ["good"]);
  assert.deepEqual(execute('print !0; print !""; print !null;'), ["false", "false", "true"]);
});

test("while loop", () => {
  assert.deepEqual(execute("let i = 0; while (i < 3) { print i; i = i + 1; }"), ["0", "1", "2"]);
});

test("functions, return, and recursion", () => {
  const source = "fn fact(n) { if (n <= 1) { return 1; } return n * fact(n - 1); } print fact(5);";
  assert.deepEqual(execute(source), ["120"]);
});

test("closures retain their enclosing scope", () => {
  const source = 'fn outer() { let message = "captured"; fn inner() { print message; } inner(); } outer();';
  assert.deepEqual(execute(source), ["captured"]);
});

test("logical operators short circuit", () => {
  assert.deepEqual(execute("print false && missing; print true || missing;"), ["false", "true"]);
});

test("operator precedence, comparisons, and remainder", () => {
  assert.deepEqual(execute("print 2 + 3 * 4; print (2 + 3) * 4; print 5 % 2; print 3 >= 3; print 2 < 1;"), ["14", "20", "1", "true", "false"]);
});

test("strings concatenate and recognize escapes", () => {
  assert.deepEqual(execute(String.raw`print "level " + 5; print "one\ntwo"; print 'it\'s fine'; print "tab\there";`), ["level 5", "one\ntwo", "it's fine", "tab\there"]);
});

test("lexical block scope shadows outer names", () => {
  assert.deepEqual(execute("let x = 1; { let x = 2; print x; } print x;"), ["2", "1"]);
  assert.throws(() => execute("{ let hidden = 3; } print hidden;"), /Undefined variable 'hidden'/);
});

test("function calls enforce argument counts and callable values", () => {
  assert.throws(() => execute("fn add(a, b) { return a + b; } add(1);"), /Expected 2 argument\(s\), got 1/);
  assert.throws(() => execute("let value = 1; value();"), /Only functions can be called/);
});

test("clock returns a usable timestamp", () => {
  assert.deepEqual(execute("print clock() > 0;"), ["true"]);
});

test("functions return null when no value is returned", () => {
  assert.deepEqual(execute("fn nothing() { let x = 1; } print nothing(); fn bare() { return; } print bare();"), ["null", "null"]);
});

test("division and remainder by zero are readable runtime errors", () => {
  assert.throws(() => execute("print 10 / 0;"), /Division by zero/);
  assert.throws(() => execute("print 10 % 0;"), /Division by zero/);
});

test("undefined variables produce errors", () => {
  assert.throws(() => execute("print missing;"), /Undefined variable 'missing'/);
});

test("lexer reports unexpected characters and unterminated strings", () => {
  assert.throws(() => tokenize("@"), error => error instanceof LangError && /lexer error/.test(error.message));
  assert.throws(() => tokenize('"unfinished'), /Unterminated string literal/);
});

test("parser requires statement terminators and valid assignment targets", () => {
  assert.throws(() => parse(tokenize("let x = 3")), /Expected ';'/);
  assert.throws(() => parse(tokenize("(x + 1) = 4;")), /Invalid assignment target/);
});

test("errors include source locations", () => {
  assert.throws(() => execute("\nprint missing;"), /runtime error at 2:7: Undefined variable 'missing'/);
});

test("run() convenience API executes source and returns its interpreter", async () => {
  const output = [];
  const interpreter = await run("let answer = 40 + 2; print answer;", { output: value => output.push(value) });
  assert.deepEqual(output, ["42"]);
  assert.ok(interpreter instanceof Interpreter);
});
