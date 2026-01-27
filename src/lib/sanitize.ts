import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to remove dangerous HTML/JS while preserving safe formatting.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  
  return DOMPurify.sanitize(dirty, {
    // Allow safe HTML elements for newsletter content
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "hr",
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "target", "rel",
      "style", "class", "id",
      "width", "height",
      "colspan", "rowspan",
    ],
    // Force all links to have safe targets
    ADD_ATTR: ["target"],
    // Configure link behavior
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}

/**
 * Sanitize plain text content, escaping HTML special characters.
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
