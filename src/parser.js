import { LangError } from "./lexer.js";

/**
 * Parse a token stream into an array of statement/declaration AST nodes.
 * @param {Array<object>} tokens Output from tokenize().
 * @returns {Array<object>} The program AST.
 * @throws {LangError} If the token stream does not match the language grammar.
 */
export function parse(tokens) {
  let current = 0;
  const peek = () => tokens[current];
  const previous = () => tokens[current - 1];
  const atEnd = () => peek().type === "EOF";
  const check = type => !atEnd() && peek().type === type;
  function advance() { if (!atEnd()) current++; return previous(); }
  function match(...types) {
    for (const type of types) if (check(type)) { advance(); return true; }
    return false;
  }
  function consume(type, message) {
    if (check(type)) return advance();
    throw error(peek(), message);
  }
  function error(token, message) {
    return new LangError(message, token.line, token.column, "parser");
  }
  function program() {
    const statements = [];
    while (!atEnd()) statements.push(declaration());
    return statements;
  }
  function declaration() {
    if (match("LET")) return variableDeclaration(false);
    if (match("CONST")) return variableDeclaration(true);
    if (match("FN")) return functionDeclaration();
    return statement();
  }
  function variableDeclaration(isConst) {
    const name = consume("IDENTIFIER", "Expected a variable name.");
    consume("EQUAL", "Expected '=' after the variable name.");
    const initializer = expression();
    consume("SEMICOLON", "Expected ';' after the variable declaration.");
    return { type: "Variable", name: name.lexeme, initializer, isConst, token: name };
  }
  function functionDeclaration() {
    const name = consume("IDENTIFIER", "Expected a function name.");
    consume("LEFT_PAREN", "Expected '(' after function name.");
    const params = [];
    if (!check("RIGHT_PAREN")) {
      do {
        if (params.length >= 255) throw error(peek(), "A function may have at most 255 parameters.");
        params.push(consume("IDENTIFIER", "Expected a parameter name.").lexeme);
      } while (match("COMMA"));
    }
    consume("RIGHT_PAREN", "Expected ')' after parameters.");
    consume("LEFT_BRACE", "Expected '{' before function body.");
    return { type: "Function", name: name.lexeme, params, body: blockContents(), token: name };
  }
  function statement() {
    if (match("PRINT")) return printStatement();
    if (match("IF")) return ifStatement();
    if (match("WHILE")) return whileStatement();
    if (match("RETURN")) return returnStatement();
    if (match("LEFT_BRACE")) return { type: "Block", statements: blockContents() };
    return expressionStatement();
  }
  function blockContents() {
    const statements = [];
    while (!check("RIGHT_BRACE") && !atEnd()) statements.push(declaration());
    consume("RIGHT_BRACE", "Expected '}' after block.");
    return statements;
  }
  function printStatement() {
    const printed = expression();
    consume("SEMICOLON", "Expected ';' after printed value.");
    return { type: "Print", expression: printed };
  }
  function ifStatement() {
    consume("LEFT_PAREN", "Expected '(' after 'if'.");
    const condition = expression();
    consume("RIGHT_PAREN", "Expected ')' after condition.");
    const thenBranch = statement();
    const elseBranch = match("ELSE") ? statement() : null;
    return { type: "If", condition, thenBranch, elseBranch };
  }
  function whileStatement() {
    consume("LEFT_PAREN", "Expected '(' after 'while'.");
    const condition = expression();
    consume("RIGHT_PAREN", "Expected ')' after condition.");
    return { type: "While", condition, body: statement() };
  }
  function returnStatement() {
    const token = previous();
    const value = check("SEMICOLON") ? null : expression();
    consume("SEMICOLON", "Expected ';' after return value.");
    return { type: "Return", value, token };
  }
  function expressionStatement() {
    const expr = expression();
    consume("SEMICOLON", "Expected ';' after expression.");
    return { type: "ExpressionStatement", expression: expr };
  }
  function expression() { return assignment(); }
  function assignment() {
    const expr = logicalOr();
    if (match("EQUAL")) {
      const equals = previous();
      const value = assignment();
      if (expr.type === "VariableExpression") return { type: "Assign", name: expr.name, value, token: equals };
      throw error(equals, "Invalid assignment target.");
    }
    return expr;
  }
  function logicalOr() {
    let expr = logicalAnd();
    while (match("OR")) expr = { type: "Logical", left: expr, operator: previous(), right: logicalAnd() };
    return expr;
  }
  function logicalAnd() {
    let expr = equality();
    while (match("AND")) expr = { type: "Logical", left: expr, operator: previous(), right: equality() };
    return expr;
  }
  function equality() {
    let expr = comparison();
    while (match("EQUAL_EQUAL", "BANG_EQUAL")) expr = { type: "Binary", left: expr, operator: previous(), right: comparison() };
    return expr;
  }
  function comparison() {
    let expr = term();
    while (match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) expr = { type: "Binary", left: expr, operator: previous(), right: term() };
    return expr;
  }
  function term() {
    let expr = factor();
    while (match("PLUS", "MINUS")) expr = { type: "Binary", left: expr, operator: previous(), right: factor() };
    return expr;
  }
  function factor() {
    let expr = unary();
    while (match("STAR", "SLASH", "PERCENT")) expr = { type: "Binary", left: expr, operator: previous(), right: unary() };
    return expr;
  }
  function unary() {
    if (match("BANG", "MINUS")) return { type: "Unary", operator: previous(), right: unary() };
    return call();
  }
  function call() {
    let expr = primary();
    while (match("LEFT_PAREN")) {
      const args = [];
      if (!check("RIGHT_PAREN")) {
        do {
          if (args.length >= 255) throw error(peek(), "A call may have at most 255 arguments.");
          args.push(expression());
        } while (match("COMMA"));
      }
      const paren = consume("RIGHT_PAREN", "Expected ')' after arguments.");
      expr = { type: "Call", callee: expr, args, paren };
    }
    return expr;
  }
  function primary() {
    if (match("FALSE")) return { type: "Literal", value: false };
    if (match("TRUE")) return { type: "Literal", value: true };
    if (match("NULL")) return { type: "Literal", value: null };
    if (match("NUMBER", "STRING")) return { type: "Literal", value: previous().literal };
    if (match("IDENTIFIER")) return { type: "VariableExpression", name: previous().lexeme, token: previous() };
    if (match("LEFT_PAREN")) {
      const expr = expression();
      consume("RIGHT_PAREN", "Expected ')' after expression.");
      return { type: "Grouping", expression: expr };
    }
    throw error(peek(), "Expected an expression.");
  }

  return program();
}
