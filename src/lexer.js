/**
 * Error carrying a language phase and 1-based source coordinates.
 * @param {string} message Human-readable diagnostic.
 * @param {number} [line=1] 1-based source line.
 * @param {number} [column=1] 1-based source column.
 * @param {string} [phase="language"] Lexer, parser, or runtime phase.
 */
export class LangError extends Error {
  constructor(message, line = 1, column = 1, phase = "language") {
    super(`${phase} error at ${line}:${column}: ${message}`);
    this.name = "LangError";
    this.line = line;
    this.column = column;
    this.phase = phase;
  }
}

const KEYWORDS = new Set([
  "let", "const", "fn", "if", "else", "while", "return", "print",
  "true", "false", "null"
]);

/**
 * Convert MyLang source text into a positioned token stream ending in EOF.
 * @param {string} source Complete source code.
 * @returns {Array<{type: string, lexeme: string, literal: unknown, line: number, column: number}>}
 * @throws {LangError} If the source contains an invalid character or literal.
 */
export function tokenize(source) {
  const tokens = [];
  let start = 0, current = 0, line = 1, column = 1;
  let startLine = 1, startColumn = 1;

  const atEnd = () => current >= source.length;
  const peek = () => source[current] ?? "\0";
  const peekNext = () => source[current + 1] ?? "\0";
  function advance() {
    const ch = source[current++];
    if (ch === "\n") { line++; column = 1; } else column++;
    return ch;
  }
  function add(type, literal = null) {
    tokens.push({ type, lexeme: source.slice(start, current), literal, line: startLine, column: startColumn });
  }
  function match(expected) {
    if (atEnd() || source[current] !== expected) return false;
    advance();
    return true;
  }
  function string(quote) {
    let value = "";
    while (!atEnd() && peek() !== quote) {
      if (peek() === "\n") throw new LangError("Unterminated string literal.", startLine, startColumn, "lexer");
      if (peek() === "\\") {
        advance();
        if (atEnd()) break;
        const escaped = advance();
        const map = { n: "\n", r: "\r", t: "\t", "\\": "\\", '"': '"', "'": "'" };
        value += map[escaped] ?? escaped;
      } else value += advance();
    }
    if (atEnd()) throw new LangError("Unterminated string literal.", startLine, startColumn, "lexer");
    advance();
    add("STRING", value);
  }
  function number() {
    while (/\d/.test(peek())) advance();
    if (peek() === "." && /\d/.test(peekNext())) {
      advance();
      while (/\d/.test(peek())) advance();
    }
    const value = Number(source.slice(start, current));
    if (!Number.isFinite(value)) throw new LangError("Number is outside the supported range.", startLine, startColumn, "lexer");
    add("NUMBER", value);
  }
  function identifier() {
    while (/[A-Za-z0-9_]/.test(peek())) advance();
    const word = source.slice(start, current);
    add(KEYWORDS.has(word) ? word.toUpperCase() : "IDENTIFIER");
  }

  while (!atEnd()) {
    start = current; startLine = line; startColumn = column;
    const ch = advance();
    if (/[ \r\t\n]/.test(ch)) continue;
    if (ch === "/" && peek() === "/") {
      while (!atEnd() && peek() !== "\n") advance();
      continue;
    }
    if (/[0-9]/.test(ch)) { number(); continue; }
    if (/[A-Za-z_]/.test(ch)) { identifier(); continue; }
    if (ch === '"' || ch === "'") { string(ch); continue; }

    let type;
    switch (ch) {
      case "(": type = "LEFT_PAREN"; break;
      case ")": type = "RIGHT_PAREN"; break;
      case "{": type = "LEFT_BRACE"; break;
      case "}": type = "RIGHT_BRACE"; break;
      case ",": type = "COMMA"; break;
      case ".": type = "DOT"; break;
      case ";": type = "SEMICOLON"; break;
      case "+": type = "PLUS"; break;
      case "-": type = "MINUS"; break;
      case "*": type = "STAR"; break;
      case "/": type = "SLASH"; break;
      case "%": type = "PERCENT"; break;
      case "!": type = match("=") ? "BANG_EQUAL" : "BANG"; break;
      case "=": type = match("=") ? "EQUAL_EQUAL" : "EQUAL"; break;
      case "<": type = match("=") ? "LESS_EQUAL" : "LESS"; break;
      case ">": type = match("=") ? "GREATER_EQUAL" : "GREATER"; break;
      case "&": type = match("&") ? "AND" : null; break;
      case "|": type = match("|") ? "OR" : null; break;
      default: type = null;
    }
    if (!type) throw new LangError(`Unexpected character '${ch}'.`, startLine, startColumn, "lexer");
    add(type);
  }
  tokens.push({ type: "EOF", lexeme: "", literal: null, line, column });
  return tokens;
}
