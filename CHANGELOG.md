# Changelog

All notable changes to MyLang are documented here.

## [0.1.0] - 2026-10-14

### Added
- Lexer with source positions, comments, numeric/string literals, and operators.
- Recursive-descent parser and documented EBNF grammar.
- Tree-walk interpreter with lexical scopes, mutable variables, constants, functions, recursion, closures, and return values.
- Arithmetic, comparisons, equality, short-circuit logical operators, conditionals, and while loops.
- `print` statement and `clock()` native function.
- File runner, interactive REPL, example programs, and automated tests.
- Language reference and source architecture/function guide.
- JSDoc comments for important public entry points and runtime methods.
- MIT license and GitHub Actions test workflow.
- Expanded regression tests for operators, strings, scopes, calls, return values, built-ins, and source locations.

### Notes
- This is an early prototype; syntax and semantics may change before v1.0.
- Arrays, maps, modules, static typing, and a bytecode VM are not implemented yet.
