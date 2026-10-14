# MyLang Interpreter

MyLang is a small, general-purpose interpreted programming language built from scratch in JavaScript. The project includes a lexer, recursive-descent parser, tree-walk interpreter, command-line runner, interactive REPL, examples, automated tests, and documentation.

> **Status:** v0.1.0 — early prototype. The language is intentionally small; syntax and behavior may change before v1.0.

**Recommended repository name:** `mylang-interpreter`

## Features

- Numbers, strings, booleans, and `null`
- Mutable variables (`let`) and constants (`const`)
- Arithmetic, comparisons, equality, and short-circuit logical operators
- Lexical block scope and variable assignment
- `if/else`, `while`, and blocks
- Named functions, exact argument counts, return values, recursion, and closures
- `print expression;` output statement and `clock()` built-in
- Lexer/parser/runtime diagnostics with source locations where available
- File execution and an interactive REPL
- Zero third-party runtime dependencies

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)
- Git recommended

Check your installation:

```powershell
node --version
npm --version
git --version
```

## Quick start

Clone the repository and enter its directory:

```powershell
git clone https://github.com/ichigo137/mylang-interpreter.git
cd mylang-interpreter
```

Run the example program:

```powershell
node .\src\cli.js .\examples\hello.my
```

Start the REPL:

```powershell
node .\src\cli.js
```

Type `.exit` to leave the REPL. The REPL displays bare expression results automatically:

```text
mylang> 9 * 9
81
mylang> let score = 10;
mylang> score + 2
12
mylang> .exit
```

Run the automated tests:

```powershell
npm test
```

No `npm install` is needed for the current implementation because it uses only Node.js built-in modules.

## Language example

Save this as `hello.my`:

```mylang
let name = "world";
print "Hello, " + name + "!";

fn square(n) {
  return n * n;
}

print square(9);

let count = 3;
while (count > 0) {
  print count;
  count = count - 1;
}
```

## Documentation

- [Language Reference](docs/REFERENCE.md) — syntax, types, operators, built-ins, examples, and limitations.
- [Architecture and Source-Code Guide](docs/ARCHITECTURE.md) — what each important function does and how execution works.
- [Language Design Overview](docs/LANGUAGE.md) — current design decisions and compatibility policy.
- [Formal Grammar](docs/GRAMMAR.md) — the EBNF grammar.
- [Roadmap](docs/ROADMAP.md) — planned features and development phases.
- [Changelog](CHANGELOG.md) — notable changes by version.
- [Contributing Guide](CONTRIBUTING.md) — development workflow and contribution expectations.

## Project structure

```text
mylang-interpreter/
├── .github/workflows/   # CI on Node.js 20, 22, and 24
├── docs/                # Language reference and implementation docs
├── examples/             # Programs written in MyLang
├── src/
│   ├── lexer.js          # Source text -> tokens
│   ├── parser.js         # Tokens -> AST
│   ├── interpreter.js    # AST -> runtime behavior
│   └── cli.js            # File runner and REPL
├── tests/                # Node.js built-in test runner tests
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
└── README.md
```

## Current limitations

MyLang v0.1.0 does not yet support arrays, maps/objects, classes, modules/imports, `for`, `break`, `continue`, exceptions, static typing, a bytecode VM, or file/network APIs. See the [reference](docs/REFERENCE.md) and [roadmap](docs/ROADMAP.md) for details.

## Security

MyLang programs currently have no built-in file-system, network, or shell access. Do not treat this prototype as a hardened sandbox for untrusted code.

## License

Distributed under the [MIT License](LICENSE).
