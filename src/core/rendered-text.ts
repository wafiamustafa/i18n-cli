import { parseExpression } from "@babel/parser";
import type { Node } from "@babel/types";

export const TEXT_ATTRIBUTES = new Set([
  "title", "alt", "placeholder", "aria-label", "aria-description", "label",
]);

export function hasWords(value: string): boolean {
  return /\p{L}/u.test(value);
}

/** Inspect values rendered by an expression, without treating keys/conditions as UI text. */
export function hasRenderedLiteral(node: Node): boolean {
  switch (node.type) {
    case "StringLiteral":
      return hasWords(node.value);
    case "TemplateLiteral":
      return node.quasis.some(part => hasWords(part.value.cooked ?? part.value.raw)) ||
        node.expressions.some(hasRenderedLiteral);
    case "ConditionalExpression":
      return hasRenderedLiteral(node.consequent) || hasRenderedLiteral(node.alternate);
    case "LogicalExpression":
      return (node.operator !== "&&" && hasRenderedLiteral(node.left)) ||
        hasRenderedLiteral(node.right);
    case "BinaryExpression":
      return node.operator === "+" &&
        (hasRenderedLiteral(node.left) || hasRenderedLiteral(node.right));
    case "ArrayExpression":
      return node.elements.some(element => element !== null && hasRenderedLiteral(element));
    case "TSAsExpression":
    case "TSNonNullExpression":
    case "TSTypeAssertion":
    case "ParenthesizedExpression":
      return hasRenderedLiteral(node.expression);
    default:
      // Calls, identifiers and member accesses require runtime/data-flow analysis.
      return false;
  }
}

export function hasLiteralExpression(expression: string, patterns: RegExp[] = []): boolean {
  if (/\|\s*(?:translate|transloco)\b/.test(expression)) return false;
  let source = expression;
  for (const pattern of patterns) {
    source = source.replace(new RegExp(pattern.source, pattern.flags), "''");
  }
  try {
    return hasRenderedLiteral(parseExpression(source, { plugins: ["typescript"] }));
  } catch {
    // HTML template expressions can contain framework-specific syntax.
    return false;
  }
}
