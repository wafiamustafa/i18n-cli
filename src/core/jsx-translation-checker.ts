import { parse } from "@babel/parser";
import { VISITOR_KEYS } from "@babel/types";
import type { JSXElement, Node } from "@babel/types";
import { hasLiteralExpression, hasWords, TEXT_ATTRIBUTES } from "./rendered-text.js";
import { hasUntranslatedHtmlText } from "./html-translation-checker.js";

const TRANSLATION_COMPONENTS = new Set(["Trans", "FormattedMessage", "FormattedHTMLMessage"]);

export function hasUntranslatedJsxText(
  source: string,
  usagePatterns: RegExp[] = [],
  jsx = true
): boolean {
  const ast = parse(source, {
    sourceType: "unambiguous",
    plugins: jsx ? ["jsx", "typescript", "decorators-legacy"] : ["typescript", "decorators-legacy"],
  });

  function literalExpression(node: Node): boolean {
    return hasLiteralExpression(source.slice(node.start ?? 0, node.end ?? 0), usagePatterns);
  }

  function checkElement(node: JSXElement, translated: boolean): boolean {
    const opening = node.openingElement;
    const name = opening.name.type === "JSXIdentifier" ? opening.name.name : "";
    if (name === "script" || name === "style") return false;
    const contentTranslated = translated || TRANSLATION_COMPONENTS.has(name);
    const buttonInput = name === "input" && opening.attributes.some(attribute =>
      attribute.type === "JSXAttribute" && attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === "type" && attribute.value?.type === "StringLiteral" &&
      /^(?:button|submit|reset)$/.test(attribute.value.value)
    );

    for (const attribute of opening.attributes) {
      if (attribute.type !== "JSXAttribute" || attribute.name.type !== "JSXIdentifier") continue;
      const key = attribute.name.name;
      const isText = TEXT_ATTRIBUTES.has(key) || (key === "value" && buttonInput) ||
        (key === "children" && !contentTranslated);
      if (!isText || !attribute.value) continue;
      if (attribute.value.type === "StringLiteral" && hasWords(attribute.value.value)) return true;
      if (attribute.value.type === "JSXExpressionContainer" && literalExpression(attribute.value.expression)) {
        return true;
      }
    }

    return node.children.some(child => visit(child, contentTranslated));
  }

  function visit(node: Node, translated = false): boolean {
    // Angular component metadata stores inline HTML in a `template` property.
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "Component") {
      const metadata = node.arguments[0];
      if (metadata?.type === "ObjectExpression") {
        for (const property of metadata.properties) {
          if (property.type !== "ObjectProperty" || property.computed) continue;
          const key = property.key;
          if (!((key.type === "Identifier" && key.name === "template") ||
            (key.type === "StringLiteral" && key.value === "template"))) continue;
          const value = property.value;
          const template = value.type === "StringLiteral" ? value.value :
            value.type === "TemplateLiteral" ? value.quasis.map(part => part.value.cooked ?? part.value.raw).join("") : "";
          if (hasUntranslatedHtmlText(template, usagePatterns)) return true;
        }
      }
    }
    if (node.type === "JSXElement") return checkElement(node, translated);
    if (node.type === "JSXText") return !translated && hasWords(node.value);
    if (node.type === "JSXExpressionContainer" && !translated && literalExpression(node.expression)) {
      return true;
    }

    // Traverse syntax nodes only: unrelated source strings and comments are never UI text.
    for (const key of VISITOR_KEYS[node.type] ?? []) {
      const value: unknown = node[key as keyof Node];
      const children = Array.isArray(value) ? value : [value];
      for (const child of children) {
        if (child && typeof child === "object" && "type" in child && visit(child as Node, translated)) {
          return true;
        }
      }
    }
    return false;
  }

  return visit(ast);
}
