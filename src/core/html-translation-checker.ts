import { parseDocument } from "htmlparser2";
import { hasLiteralExpression, hasWords, TEXT_ATTRIBUTES } from "./rendered-text.js";

const IGNORED_ELEMENTS = new Set(["script", "style"]);

function translatesContent(attributes: Record<string, string>): boolean {
  return Object.hasOwn(attributes, "i18n") ||
    Object.hasOwn(attributes, "v-t") ||
    Object.hasOwn(attributes, "[translate]") ||
    Object.hasOwn(attributes, "transloco") ||
    Object.hasOwn(attributes, "[transloco]") ||
    (Object.hasOwn(attributes, "translate") &&
      !/^(?:yes|no)$/i.test(attributes.translate ?? ""));
}

/** Detect literal UI text; runtime values cannot be resolved by a static scan. */
export function hasUntranslatedHtmlText(
  html: string,
  usagePatterns: RegExp[] = [],
  templateOnly = false
): boolean {
  // Mask template expressions before parsing: comparisons and string literals
  // may contain HTML delimiters. Literal expressions still need translation.
  const source = html.replace(/{{([\s\S]*?)}}/g, (_match, expression: string) =>
    hasLiteralExpression(expression, usagePatterns) ? "UNTRANSLATED" : ""
  );
  const document = parseDocument(source, { recognizeSelfClosing: true });
  type Node = (typeof document.children)[number];

  function visit(node: Node, translated = false): boolean {
    if (node.type === "text") return !translated && hasWords(node.data);
    if (!("children" in node)) return false;

    let contentTranslated = translated;
    if ("attribs" in node) {
      if (IGNORED_ELEMENTS.has(node.name)) return false;
      const attributes = node.attribs;

      for (const [name, value] of Object.entries(attributes)) {
        const angularBinding = name.startsWith("[") && name.endsWith("]");
        const vueBinding = name.startsWith(":") || name.startsWith("v-bind:");
        const contentBinding = ["v-text", "v-html", "[textcontent]", "[innerhtml]"].includes(name);
        const bound = angularBinding || vueBinding || contentBinding;
        const attribute = angularBinding ? name.slice(1, -1).replace(/^attr\./, "") :
          vueBinding ? name.replace(/^(?:v-bind:|:)/, "") : name;
        const buttonValue = attribute === "value" && node.name === "input" &&
          /^(?:button|submit|reset)$/i.test(attributes.type ?? "");

        if (!TEXT_ATTRIBUTES.has(attribute) && !buttonValue && !contentBinding) continue;
        if (Object.hasOwn(attributes, `i18n-${attribute}`)) continue;
        if (bound ? hasLiteralExpression(value, usagePatterns) : hasWords(value)) {
          return true;
        }
      }

      contentTranslated ||= translatesContent(attributes) || node.name === "i18n-t";
    }

    return node.children.some(child => visit(child, contentTranslated));
  }

  const roots = templateOnly
    ? document.children.filter(node => "name" in node && node.name === "template")
    : document.children;
  for (const root of roots) {
    if (templateOnly && "attribs" in root && root.attribs.lang && root.attribs.lang !== "html") {
      throw new Error(`Unsupported Vue template language "${root.attribs.lang}". Only HTML templates can be checked.`);
    }
  }
  return roots.some(node => visit(node));
}
