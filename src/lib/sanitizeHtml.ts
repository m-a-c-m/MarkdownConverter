const ALLOWED_TAGS = new Set([
  "b", "i", "em", "strong", "u", "s", "del", "ins", "br", "hr", "code", "pre",
  "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td", "div", "span", "img",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

const LINK_SCHEMES = new Set(["http", "https", "mailto", "tel"]);
const SRC_SCHEMES = new Set(["http", "https"]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  tab: "\t", newline: "\n", colon: ":", sol: "/", lpar: "(", rpar: ")",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);?/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "�";
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function urlScheme(value: string): string | null {
  const normalized = value.replace(/[\u0000- \u007f]/g, "").toLowerCase();
  const match = normalized.match(/^([a-z][a-z0-9+.-]*):/);
  return match ? match[1] : null;
}

function isSafeLink(value: string): boolean {
  const scheme = urlScheme(value);
  return scheme === null || LINK_SCHEMES.has(scheme);
}

function isSafeSrc(value: string): boolean {
  const scheme = urlScheme(value);
  if (scheme === "data") return /^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)[;,]/i.test(value);
  return scheme === null || SRC_SCHEMES.has(scheme);
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripDangerousBlocks(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/<object[\s\S]*?<\/object\s*>/gi, "")
    .replace(/<form[\s\S]*?<\/form\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

// Sigue la tokenización de HTML: un valor entrecomillado puede contener < y >, y una etiqueta
// sin cerrar no es etiqueta. La salida solo lleva etiquetas reconstruidas aquí; el resto es texto.
function parseTag(html: string, start: number): { end: number; html: string } | null {
  const closing = html.startsWith("</", start);
  const nameStart = start + (closing ? 2 : 1);
  const nameMatch = /^[a-zA-Z][a-zA-Z0-9]*/.exec(html.slice(nameStart, nameStart + 64));
  if (!nameMatch) return null;
  const name = nameMatch[0].toLowerCase();
  const attrs: [string, string][] = [];
  let i = nameStart + nameMatch[0].length;

  while (i < html.length) {
    const c = html[i];
    if (/[\s/]/.test(c)) {
      i++;
      continue;
    }
    if (c === ">") {
      if (!ALLOWED_TAGS.has(name)) return null;
      if (closing) return { end: i + 1, html: VOID_TAGS.has(name) ? "" : `</${name}>` };
      return { end: i + 1, html: `<${name}${serializeAttrs(name, attrs)}>` };
    }
    let j = i + 1;
    while (j < html.length && !/[\s"'>/=]/.test(html[j])) j++;
    const attrName = html.slice(i, j).toLowerCase();
    i = j;
    while (i < html.length && /\s/.test(html[i])) i++;
    let value = "";
    if (html[i] === "=") {
      i++;
      while (i < html.length && /\s/.test(html[i])) i++;
      const quote = html[i];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        if (close === -1) return null;
        value = html.slice(i + 1, close);
        i = close + 1;
      } else {
        let k = i;
        while (k < html.length && !/[\s>]/.test(html[k])) k++;
        value = html.slice(i, k);
        i = k;
      }
    }
    attrs.push([attrName, decodeEntities(value)]);
  }
  return null;
}

function serializeAttrs(name: string, attrs: [string, string][]): string {
  const allowed = ALLOWED_ATTRS[name];
  if (!allowed) return "";
  const seen = new Set<string>();
  let out = "";
  for (const [attr, raw] of attrs) {
    if (seen.has(attr)) continue;
    seen.add(attr);
    if (!allowed.has(attr)) continue;
    const value = raw.trim();
    if (attr === "href" && !isSafeLink(value)) continue;
    if (attr === "src" && !isSafeSrc(value)) continue;
    out += ` ${attr}="${escapeAttr(value)}"`;
  }
  return out;
}

export function sanitizeHtml(html: string): string {
  const input = stripDangerousBlocks(html);
  let out = "";
  let i = 0;
  while (i < input.length) {
    const lt = input.indexOf("<", i);
    if (lt === -1) {
      out += input.slice(i);
      break;
    }
    out += input.slice(i, lt);
    const tag = parseTag(input, lt);
    if (tag) {
      out += tag.html;
      i = tag.end;
    } else {
      out += "&lt;";
      i = lt + 1;
    }
  }
  return out;
}
