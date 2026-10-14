import { LangError, tokenize } from "./lexer.js";
import { parse } from "./parser.js";

/** A lexical scope with mutable/constant bindings and an optional parent scope. */
class Environment {
  constructor(parent = null) { this.values = new Map(); this.constants = new Set(); this.parent = parent; }
  /** Define a name in this scope; duplicate names in the same scope are rejected. */
  define(name, value, isConst = false) {
    if (this.values.has(name)) throw new Error(`'${name}' is already declared in this scope.`);
    this.values.set(name, value);
    if (isConst) this.constants.add(name);
  }
  /** Look up a name in this scope chain or throw a positioned undefined-name error. */
  get(name, token) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.parent) return this.parent.get(name, token);
    throw runtimeError(`Undefined variable '${name}'.`, token);
  }
  /** Update the nearest mutable binding in the scope chain and return its new value. */
  assign(name, value, token) {
    if (this.values.has(name)) {
      if (this.constants.has(name)) throw runtimeError(`Cannot reassign constant '${name}'.`, token);
      this.values.set(name, value); return value;
    }
    if (this.parent) return this.parent.assign(name, value, token);
    throw runtimeError(`Undefined variable '${name}'.`, token);
  }
}
class ReturnSignal { constructor(value) { this.value = value; } }
/** Runtime representation of a user function, including its lexical closure. */
class UserFunction {
  constructor(declaration, closure) { this.declaration = declaration; this.closure = closure; }
  call(interpreter, args) {
    const env = new Environment(this.closure);
    this.declaration.params.forEach((param, i) => env.define(param, args[i]));
    try { interpreter.executeBlock(this.declaration.body, env); }
    catch (signal) { if (signal instanceof ReturnSignal) return signal.value; throw signal; }
    return null;
  }
  get arity() { return this.declaration.params.length; }
  toString() { return `<fn ${this.declaration.name}>`; }
}
function runtimeError(message, token) {
  return new LangError(message, token?.line ?? 1, token?.column ?? 1, "runtime");
}
function isTruthy(value) { return value !== false && value !== null; }
function display(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof UserFunction) return value.toString();
  return String(value);
}

/** Evaluates parsed MyLang AST nodes using a tree-walk interpreter. */
export class Interpreter {
  constructor({ output = text => console.log(text) } = {}) {
    this.output = output;
    this.globals = new Environment();
    this.environment = this.globals;
    this.globals.define("print", { arity: 1, call: (_i, args) => { this.output(display(args[0])); return null; }, toString: () => "<native fn>" });
    this.globals.define("clock", { arity: 0, call: () => Date.now() / 1000, toString: () => "<native fn>" });
  }
  /** Execute a complete program, normalizing unexpected failures into LangError. */
  interpret(statements) {
    try { for (const statement of statements) this.execute(statement); }
    catch (error) {
      if (error instanceof LangError) throw error;
      if (error instanceof ReturnSignal) throw new LangError("'return' can only be used inside a function.", 1, 1, "runtime");
      throw new LangError(error.message || String(error), 1, 1, "runtime");
    }
  }
  /** Execute statements in a temporary lexical environment and always restore scope. */
  executeBlock(statements, environment) {
    const previous = this.environment;
    this.environment = environment;
    try { for (const statement of statements) this.execute(statement); }
    finally { this.environment = previous; }
  }
  /** Execute one statement AST node. */
  execute(node) {
    switch (node.type) {
      case "Variable": this.environment.define(node.name, this.evaluate(node.initializer), node.isConst); return;
      case "Print": this.output(display(this.evaluate(node.expression))); return;
      case "Function": this.environment.define(node.name, new UserFunction(node, this.environment), true); return;
      case "ExpressionStatement": this.evaluate(node.expression); return;
      case "Block": this.executeBlock(node.statements, new Environment(this.environment)); return;
      case "If":
        if (isTruthy(this.evaluate(node.condition))) this.execute(node.thenBranch);
        else if (node.elseBranch) this.execute(node.elseBranch);
        return;
      case "While":
        while (isTruthy(this.evaluate(node.condition))) this.execute(node.body);
        return;
      case "Return": throw new ReturnSignal(node.value ? this.evaluate(node.value) : null);
      default: throw new Error(`Unknown statement type: ${node.type}`);
    }
  }
  /** Evaluate an expression AST node and return its MyLang value. */
  evaluate(node) {
    switch (node.type) {
      case "Literal": return node.value;
      case "Grouping": return this.evaluate(node.expression);
      case "VariableExpression": return this.environment.get(node.name, node.token);
      case "Assign": return this.environment.assign(node.name, this.evaluate(node.value), node.token);
      case "Unary": {
        const value = this.evaluate(node.right);
        if (node.operator.type === "BANG") return !isTruthy(value);
        if (node.operator.type === "MINUS") return -this.requireNumber(value, node.operator);
        break;
      }
      case "Logical": {
        const left = this.evaluate(node.left);
        if (node.operator.type === "OR") return isTruthy(left) ? left : this.evaluate(node.right);
        return !isTruthy(left) ? left : this.evaluate(node.right);
      }
      case "Binary": {
        const left = this.evaluate(node.left), right = this.evaluate(node.right), op = node.operator.type;
        if (op === "EQUAL_EQUAL") return left === right;
        if (op === "BANG_EQUAL") return left !== right;
        if (op === "PLUS") {
          if (typeof left === "string" || typeof right === "string") return display(left) + display(right);
          return this.requireNumber(left, node.operator) + this.requireNumber(right, node.operator);
        }
        if (["MINUS", "STAR", "SLASH", "PERCENT", "GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL"].includes(op)) {
          const a = this.requireNumber(left, node.operator), b = this.requireNumber(right, node.operator);
          if ((op === "SLASH" || op === "PERCENT") && b === 0) throw runtimeError("Division by zero.", node.operator);
          if (op === "MINUS") return a - b;
          if (op === "STAR") return a * b;
          if (op === "SLASH") return a / b;
          if (op === "PERCENT") return a % b;
          if (op === "GREATER") return a > b;
          if (op === "GREATER_EQUAL") return a >= b;
          if (op === "LESS") return a < b;
          if (op === "LESS_EQUAL") return a <= b;
        }
        break;
      }
      case "Call": {
        const callee = this.evaluate(node.callee);
        const args = node.args.map(arg => this.evaluate(arg));
        if (!callee || typeof callee.call !== "function") throw runtimeError("Only functions can be called.", node.paren);
        if (args.length !== callee.arity) throw runtimeError(`Expected ${callee.arity} argument(s), got ${args.length}.`, node.paren);
        return callee.call(this, args);
      }
    }
    throw new Error(`Unknown expression type: ${node.type}`);
  }
  requireNumber(value, token) {
    if (typeof value !== "number") throw runtimeError("Operand must be a number.", token);
    return value;
  }
}

/**
 * Tokenize, parse, and execute source text using a new or supplied interpreter.
 * This convenience API resolves to the interpreter after successful execution.
 * @param {string} source MyLang source code.
 * @param {{interpreter?: Interpreter, output?: (text: string) => void}} [options]
 * @returns {Promise<Interpreter>} The interpreter used for execution.
 */
export async function run(source, options = {}) {
  const interpreter = options.interpreter ?? new Interpreter(options);
  interpreter.interpret(parse(tokenize(source)));
  return interpreter;
}
