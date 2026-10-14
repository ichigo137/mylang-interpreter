# MyLang Architecture and Source-Code Guide

**Version:** 0.1.0  
**Audience:** Contributors and anyone learning how this interpreter works.

This guide explains what each source module and important function is responsible for. It describes the current implementation, not a future design.

## 1. Execution pipeline

A source program moves through these stages:

```text
Source text
   |
   v
src/lexer.js       tokenize characters into tokens
   |
   v
src/parser.js      parse tokens into an abstract syntax tree (AST)
   |
   v
src/interpreter.js evaluate the AST and perform effects
   |
   v
Output / runtime result
```

The command-line interface in `src/cli.js` connects the stages and handles either a file or interactive input.

## 2. `src/lexer.js` — lexical analysis

The lexer reads source text and emits token objects. Tokens contain a `type`, original `lexeme`, optional `literal`, and source `line`/`column`.

### `LangError`

A custom error class used throughout the language implementation. It formats errors as `<phase> error at <line>:<column>: <message>` and retains the phase and position as properties.

### `tokenize(source)`

**Input:** source code as a string.  
**Returns:** an array of tokens ending with `EOF`.

Responsibilities:
- Skips spaces, tabs, carriage returns, and newlines while tracking source positions.
- Skips `//` comments.
- Recognizes keywords, identifiers, numeric literals, strings, punctuation, and operators.
- Converts number and string token contents into JavaScript values stored in `literal`.
- Reports invalid characters, unterminated strings, and non-finite numeric literals as lexer errors.

Important internal helpers inside `tokenize`:

| Helper | Responsibility |
|---|---|
| `atEnd()` | Checks whether all source characters have been consumed. |
| `peek()` / `peekNext()` | Inspects the current or next character without consuming it. |
| `advance()` | Consumes one character and updates line/column tracking. |
| `add(type, literal)` | Appends a token with its original source location. |
| `match(expected)` | Consumes a character only when it matches the expected character. |
| `string(quote)` | Reads a quoted string and interprets escape sequences. |
| `number()` | Reads an integer or decimal numeric literal. |
| `identifier()` | Reads a name and checks whether it is a reserved keyword. |

The keyword set is currently: `let`, `const`, `fn`, `if`, `else`, `while`, `return`, `print`, `true`, `false`, and `null`.

## 3. `src/parser.js` — syntax analysis

The parser consumes the token array and builds AST nodes. It is a recursive-descent parser: each grammar level is implemented as a function.

### `parse(tokens)`

**Input:** the array returned by `tokenize`.  
**Returns:** an array of top-level statement/declaration AST nodes.

Important internal functions:

| Function | Responsibility |
|---|---|
| `peek()`, `previous()`, `atEnd()`, `check(type)` | Inspect the parser's current token. |
| `advance()` | Consume the current token. |
| `match(...types)` | Consume a token if it matches any listed type. |
| `consume(type, message)` | Require a token or throw a positioned parser error. |
| `error(token, message)` | Create a parser-phase `LangError`. |
| `program()` | Parse declarations until `EOF`. |
| `declaration()` | Dispatch to variable, constant, function, or statement parsing. |
| `variableDeclaration(isConst)` | Parse `let` or `const` declarations. |
| `functionDeclaration()` | Parse a named function, its parameters, and body. |
| `statement()` | Dispatch to print, if, while, return, block, or expression statements. |
| `blockContents()` | Parse declarations until a closing brace. |
| `printStatement()` | Parse `print expression;`. |
| `ifStatement()` | Parse an if statement and optional else branch. |
| `whileStatement()` | Parse a while loop. |
| `returnStatement()` | Parse `return;` or `return expression;`. |
| `expressionStatement()` | Parse an expression followed by a semicolon. |
| `expression()` | Entry point for expression parsing; delegates to assignment. |
| `assignment()` | Parse right-associative assignment and validate its target. |
| `logicalOr()`, `logicalAnd()` | Parse logical operators at their precedence levels. |
| `equality()`, `comparison()` | Parse equality and numeric comparison operators. |
| `term()`, `factor()` | Parse addition/subtraction and multiplication/division/remainder. |
| `unary()` | Parse logical NOT and unary negation. |
| `call()` | Parse function calls and argument lists. |
| `primary()` | Parse literals, identifiers, and parenthesized expressions. |

### AST node shapes

The AST is represented by ordinary JavaScript objects. Common statement node types are `Variable`, `Function`, `Print`, `ExpressionStatement`, `Block`, `If`, `While`, and `Return`. Expression nodes include `Literal`, `Grouping`, `VariableExpression`, `Assign`, `Unary`, `Logical`, `Binary`, and `Call`.

The parser does not evaluate code. Its job is to reject invalid syntax and describe valid syntax in a structured form.

## 4. `src/interpreter.js` — runtime and evaluation

### `Environment`

Stores variable bindings for one lexical scope.

- `define(name, value, isConst)`: creates a binding in the current scope and optionally marks it constant.
- `get(name, token)`: searches the current scope and then parent scopes; reports an undefined-variable error if not found.
- `assign(name, value, token)`: updates the nearest existing mutable binding; rejects constants and undefined names.

Each block and function call creates an environment linked to its parent. This is how lexical scope works.

### `ReturnSignal`

An internal control-flow object used to stop executing a function body when a `return` statement runs. It is caught by `UserFunction.call`; it is not a user-facing language value.

### `UserFunction`

Represents a function declared in MyLang.

- Constructor: stores the function's AST declaration and the environment where it was defined (the closure).
- `call(interpreter, args)`: creates a function environment, binds parameter names to argument values, executes the body, and returns the returned value or `null`.
- `arity`: reports the number of declared parameters.
- `toString()`: provides the display label, such as `<fn add>`.

### Runtime helper functions

| Function | Responsibility |
|---|---|
| `runtimeError(message, token)` | Creates a runtime-phase `LangError` with the token's location when available. |
| `isTruthy(value)` | Implements MyLang truthiness: only `false` and `null` are falsey. |
| `display(value)` | Converts values to text for printing; functions receive a readable label. |

### `Interpreter`

The main tree-walk evaluator. Its constructor accepts an optional `output` callback, which defaults to `console.log`, and initializes the global environment with the native `clock()` function.

- `interpret(statements)`: executes a parsed program and normalizes uncaught errors.
- `executeBlock(statements, environment)`: temporarily switches environments while executing a block, then restores the previous environment even if execution throws.
- `execute(node)`: runs statement AST nodes: declarations, print, function declarations, expression statements, blocks, if, while, and return.
- `evaluate(node)`: computes expression values: literals, grouping, variable reads, assignments, unary/logical/binary operations, and function calls.
- `requireNumber(value, token)`: checks that an operation received a number or throws a runtime error.

### Evaluation details worth knowing

- Logical AND and OR short-circuit.
- Function arguments are evaluated before the call and must match the function's arity exactly.
- Functions close over their declaration environment, not the caller's environment.
- `print` is a parser-level statement. The interpreter also creates a global binding named `print`, but source code cannot reference that binding as an ordinary identifier because `print` is reserved as a keyword. Use `print expression;`.
- `clock()` returns `Date.now() / 1000`, the host's Unix timestamp in seconds.

### `run(source, options = {})`

An exported convenience helper that dynamically imports the lexer and parser, tokenizes and parses the source, then interprets it. It returns a Promise that resolves to the interpreter. The CLI currently calls the stages directly instead of using this helper.

## 5. `src/cli.js` — command-line interface

### `execute(source, interpreter)`

Runs the source through `tokenize`, `parse`, and `interpreter.interpret` using the supplied interpreter instance.

### `repl()`

Creates one interpreter and a line-based terminal prompt. Each line is executed with the same interpreter, so variables and functions remain available in later lines. It prints bare expression results automatically by wrapping non-statement-looking lines in a print statement. This detection is intentionally simple; use a source file for multi-line blocks and complex input.

### `main()`

Checks whether a source-file argument was supplied. If present, reads and runs that file. If absent, starts the REPL. It reports errors and sets a non-zero process exit code when a file fails.

## 6. Tests, examples, and documentation

- `tests/language.test.js`: automated behavior tests; add tests when changing syntax or runtime behavior.
- `examples/hello.my`: introductory example covering output, variables, functions, and loops.
- `examples/fibonacci.my`: recursion/loop example that prints Fibonacci values.
- `docs/REFERENCE.md`: user-facing syntax and language reference.
- `docs/GRAMMAR.md`: compact EBNF grammar.
- `docs/ROADMAP.md`: planned work and milestones.

## 7. Making a safe change

1. Decide the intended language behavior before editing code.
2. Update the parser/interpreter/lexer as appropriate.
3. Add a focused regression test in `tests/language.test.js`.
4. Update `docs/REFERENCE.md` and `docs/GRAMMAR.md` if syntax or semantics changed.
5. Run `npm test` and the relevant examples.
6. Review the diff before committing.

