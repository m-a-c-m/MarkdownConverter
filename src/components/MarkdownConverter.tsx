"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FiCopy,
  FiCheck,
  FiTrash2,
  FiDownload,
  FiUpload,
  FiEye,
  FiCode,
} from "react-icons/fi";
import { MdSwapHoriz } from "react-icons/md";

interface Props {
  locale?: string;
}

// ─── Markdown → HTML (pure JS, zero deps) ────────────────────────────────────

function mdToHtml(md: string): string {
  let html = md;

  // Escape HTML entities first (only in non-code contexts — we handle code separately)
  // We'll process code blocks before anything else
  const codeBlocks: string[] = [];
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  const inlineCodes: string[] = [];
  html = html.replace(/`[^`]+`/g, (match) => {
    inlineCodes.push(match);
    return `\x00INLINE${inlineCodes.length - 1}\x00`;
  });

  // Escape HTML outside code
  html = html
    .replace(/&(?![a-zA-Z#\d]+;)/g, "&amp;")
    .replace(/<(?!\/?(b|i|em|strong|u|s|del|ins|br|hr|code|pre|a|ul|ol|li|h[1-6]|p|blockquote|table|thead|tbody|tr|th|td|div|span)\b)/g, "&lt;");

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Horizontal rule
  html = html.replace(/^(?:[-*_]){3,}\s*$/gm, "<hr />");

  // Blockquote
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered list items
  html = html.replace(/^\s*[-*+]\s+(.+)$/gm, "<li>$1</li>");
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)(\n(?!<li>)|$)/g, (_, g1) => {
    const wrapped = g1.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m: string) => `<ul>${m}</ul>`);
    return wrapped;
  });

  // Ordered list items
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, "<oli>$1</oli>");
  html = html.replace(/(<oli>[\s\S]*?<\/oli>\n?)+/g, (m) => {
    return `<ol>${m.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>")}</ol>`;
  });

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Tables
  html = html.replace(
    /^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/gm,
    (_, header, rows) => {
      const ths = header
        .split("|")
        .filter((c: string) => c.trim())
        .map((c: string) => `<th>${c.trim()}</th>`)
        .join("");
      const trs = rows
        .trim()
        .split("\n")
        .map((row: string) => {
          const tds = row
            .split("|")
            .filter((c: string) => c.trim())
            .map((c: string) => `<td>${c.trim()}</td>`)
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }
  );

  // Restore inline code
  inlineCodes.forEach((code, i) => {
    const inner = code.slice(1, -1).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(`\x00INLINE${i}\x00`, `<code>${inner}</code>`);
  });

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    const langMatch = block.match(/^```(\w*)/);
    const lang = langMatch?.[1] ?? "";
    const inner = block
      .replace(/^```\w*\n?/, "")
      .replace(/```$/, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(
      `\x00CODE${i}\x00`,
      `<pre><code${lang ? ` class="language-${lang}"` : ""}>${inner}</code></pre>`
    );
  });

  // Paragraphs — wrap blocks not already wrapped
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|table)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

// ─── HTML → Markdown (pure JS) ────────────────────────────────────────────────

function htmlToMd(html: string): string {
  // Create a temporary DOM node to leverage the browser's HTML parser
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  function nodeToMd(node: Node, depth = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? "").replace(/\n+/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map((c) => nodeToMd(c, depth)).join("");

    switch (tag) {
      case "h1": return `# ${children}\n\n`;
      case "h2": return `## ${children}\n\n`;
      case "h3": return `### ${children}\n\n`;
      case "h4": return `#### ${children}\n\n`;
      case "h5": return `##### ${children}\n\n`;
      case "h6": return `###### ${children}\n\n`;
      case "p": return `${children}\n\n`;
      case "br": return `\n`;
      case "hr": return `---\n\n`;
      case "strong":
      case "b": return `**${children}**`;
      case "em":
      case "i": return `*${children}*`;
      case "del":
      case "s": return `~~${children}~~`;
      case "code": {
        if (el.parentElement?.tagName.toLowerCase() === "pre") return children;
        return `\`${children}\``;
      }
      case "pre": {
        const codeEl = el.querySelector("code");
        const lang = codeEl?.className.replace("language-", "") ?? "";
        const content = codeEl?.textContent ?? children;
        return `\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
      }
      case "blockquote": return children.split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
      case "ul": return children + "\n";
      case "ol": {
        let idx = 0;
        return Array.from(el.children)
          .map((li) => `${++idx}. ${nodeToMd(li, depth)}`)
          .join("\n") + "\n\n";
      }
      case "li": return `- ${children}\n`;
      case "a": return `[${children}](${el.getAttribute("href") ?? ""})`;
      case "img": return `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})`;
      case "table": {
        const rows = Array.from(el.querySelectorAll("tr"));
        if (!rows.length) return "";
        const header = Array.from(rows[0].querySelectorAll("th,td"))
          .map((c) => c.textContent?.trim() ?? "")
          .join(" | ");
        const sep = Array.from(rows[0].querySelectorAll("th,td"))
          .map(() => "---")
          .join(" | ");
        const body = rows
          .slice(1)
          .map((r) =>
            Array.from(r.querySelectorAll("td"))
              .map((c) => c.textContent?.trim() ?? "")
              .join(" | ")
          )
          .join("\n");
        return `| ${header} |\n| ${sep} |\n${body ? body.split("\n").map((r) => `| ${r} |`).join("\n") + "\n" : ""}`;
      }
      default: return children;
    }
  }

  return Array.from(div.childNodes).map((n) => nodeToMd(n)).join("").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── DOCX generation (pure JS, no deps) ──────────────────────────────────────
// Generates a minimal .docx (Office Open XML) without any library.
// Structure: ZIP containing word/document.xml + minimal relationships.

function generateDocx(md: string): Blob {
  interface DocParagraph {
    style: string;
    runs: { text: string; bold?: boolean; italic?: boolean; strike?: boolean; code?: boolean }[];
    list?: { ordered: boolean; level: number };
    isHr?: boolean;
    isTable?: boolean;
    tableData?: string[][];
  }

  const paragraphs: DocParagraph[] = [];

  const lines = md.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      paragraphs.push({
        style: "Code",
        runs: [{ text: codeLines.join("\n"), code: true }],
      });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      paragraphs.push({ style: `Heading${level}`, runs: parseInline(text) });
      i++;
      continue;
    }

    // HR
    if (/^(?:[-*_]){3,}\s*$/.test(line)) {
      paragraphs.push({ style: "Normal", isHr: true, runs: [] });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      paragraphs.push({ style: "Quote", runs: parseInline(line.slice(2)) });
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const level = Math.floor((line.match(/^(\s*)/)?.[1].length ?? 0) / 2);
      const text = line.replace(/^\s*[-*+]\s+/, "");
      paragraphs.push({
        style: "ListBullet",
        runs: parseInline(text),
        list: { ordered: false, level },
      });
      i++;
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const level = Math.floor((line.match(/^(\s*)/)?.[1].length ?? 0) / 2);
      const text = line.replace(/^\s*\d+\.\s+/, "");
      paragraphs.push({
        style: "ListNumber",
        runs: parseInline(text),
        list: { ordered: true, level },
      });
      i++;
      continue;
    }

    // Table
    if (line.startsWith("|") && i + 1 < lines.length && /^\|[-| :]+\|/.test(lines[i + 1])) {
      const tableLines: string[] = [line];
      i += 2; // skip separator
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const tableData = tableLines.map((r) =>
        r.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim())
      );
      paragraphs.push({ style: "Normal", isTable: true, tableData, runs: [] });
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Normal paragraph
    paragraphs.push({ style: "Normal", runs: parseInline(line) });
    i++;
  }

  function parseInline(text: string) {
    const runs: { text: string; bold?: boolean; italic?: boolean; strike?: boolean; code?: boolean }[] = [];
    const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|___[^_]+___|~~[^~]+~~|\*\*[^*]+\*\*|__[^_]+__|[*_][^*_]+[*_])/g;
    let last = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) runs.push({ text: text.slice(last, match.index) });
      const m = match[0];
      if (m.startsWith("`")) runs.push({ text: m.slice(1, -1), code: true });
      else if (m.startsWith("***") || m.startsWith("___")) runs.push({ text: m.slice(3, -3), bold: true, italic: true });
      else if (m.startsWith("~~")) runs.push({ text: m.slice(2, -2), strike: true });
      else if (m.startsWith("**") || m.startsWith("__")) runs.push({ text: m.slice(2, -2), bold: true });
      else runs.push({ text: m.slice(1, -1), italic: true });
      last = match.index + m.length;
    }
    if (last < text.length) runs.push({ text: text.slice(last) });
    return runs.filter((r) => r.text);
  }

  // Build word/document.xml
  function escapeXml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function runXml(run: { text: string; bold?: boolean; italic?: boolean; strike?: boolean; code?: boolean }) {
    const rPr = [
      run.bold ? "<w:b/>" : "",
      run.italic ? "<w:i/>" : "",
      run.strike ? "<w:strike/>" : "",
      run.code
        ? '<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/>'
        : "",
    ]
      .filter(Boolean)
      .join("");
    const text = escapeXml(run.text);
    const space = run.text.startsWith(" ") || run.text.endsWith(" ") ? ' xml:space="preserve"' : "";
    return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ""}<w:t${space}>${text}</w:t></w:r>`;
  }

  function paragraphXml(p: DocParagraph): string {
    if (p.isHr) {
      return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="AAAAAA"/></w:pBdr></w:pPr></w:p>`;
    }
    if (p.isTable && p.tableData) {
      const rows = p.tableData
        .map(
          (row, ri) =>
            `<w:tr>${row
              .map(
                (cell) =>
                  `<w:tc><w:tcPr>${ri === 0 ? "<w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"E8E8E8\"/>" : ""}</w:tcPr><w:p><w:r><w:rPr>${ri === 0 ? "<w:b/>" : ""}</w:rPr><w:t>${escapeXml(cell)}</w:t></w:r></w:p></w:tc>`
              )
              .join("")}</w:tr>`
        )
        .join("");
      return `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${rows}</w:tbl>`;
    }

    const styleMap: Record<string, string> = {
      Heading1: "Heading1",
      Heading2: "Heading2",
      Heading3: "Heading3",
      Heading4: "Heading4",
      Heading5: "Heading5",
      Heading6: "Heading6",
      Normal: "Normal",
      Quote: "Quote",
      ListBullet: "ListBullet",
      ListNumber: "ListNumber",
      Code: "Code",
    };
    const styleId = styleMap[p.style] ?? "Normal";
    const numPr =
      p.list
        ? `<w:numPr><w:ilvl w:val="${p.list.level}"/><w:numId w:val="${p.list.ordered ? 2 : 1}"/></w:numPr>`
        : "";
    const pPr = `<w:pPr><w:pStyle w:val="${styleId}"/>${numPr}</w:pPr>`;
    const runs = p.runs.map(runXml).join("");
    return `<w:p>${pPr}${runs}</w:p>`;
  }

  const bodyXml = paragraphs.map(paragraphXml).join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:mv="urn:schemas-microsoft-com:mac:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="480" w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="52"/><w:color w:val="1a1a2e"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="400" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/><w:color w:val="1a1a2e"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="320" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="333366"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading5"><w:name w:val="heading 5"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="heading 6"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:i/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/><w:spacing w:before="160" w:after="160"/></w:pPr><w:rPr><w:i/><w:color w:val="666666"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/><w:ind w:left="360"/><w:spacing w:before="160" w:after="160"/></w:pPr><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/><w:color w:val="333333"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="ListNumber"><w:name w:val="List Number"/><w:basedOn w:val="Normal"/></w:style>
</w:styles>`;

  const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
    <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="◦"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
    <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%2."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

  const appRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;

  // Minimal ZIP builder (store, no compression)
  function str2ab(str: string): Uint8Array {
    const enc = new TextEncoder();
    return enc.encode(str);
  }

  function u32le(n: number): Uint8Array {
    return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
  }
  function u16le(n: number): Uint8Array {
    return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
  }

  function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    for (const byte of data) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function concat(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
      result.set(a, offset);
      offset += a.length;
    }
    return result;
  }

  const files: { name: string; data: Uint8Array }[] = [
    { name: "[Content_Types].xml", data: str2ab(contentTypesXml) },
    { name: "_rels/.rels", data: str2ab(appRelsXml) },
    { name: "word/document.xml", data: str2ab(documentXml) },
    { name: "word/styles.xml", data: str2ab(stylesXml) },
    { name: "word/numbering.xml", data: str2ab(numberingXml) },
    { name: "word/_rels/document.xml.rels", data: str2ab(relsXml) },
  ];

  const localHeaders: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const localHeader = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // sig
      u16le(20), // version needed
      u16le(0), // flags
      u16le(0), // compression: store
      u16le(0), u16le(0), // mod time/date
      u32le(crc),
      u32le(file.data.length),
      u32le(file.data.length),
      u16le(nameBytes.length),
      u16le(0), // extra field length
      nameBytes
    );
    offsets.push(offset);
    localHeaders.push(concat(localHeader, file.data));
    offset += localHeader.length + file.data.length;
  }

  const centralDir: Uint8Array[] = [];
  files.forEach((file, idx) => {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    centralDir.push(
      concat(
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // sig
        u16le(20), u16le(20), // versions
        u16le(0), u16le(0), // flags, compression
        u16le(0), u16le(0), // mod time/date
        u32le(crc),
        u32le(file.data.length),
        u32le(file.data.length),
        u16le(nameBytes.length),
        u16le(0), u16le(0), // extra, comment
        u16le(0), u16le(0), // disk start, int attrs
        u32le(0), // ext attrs
        u32le(offsets[idx]),
        nameBytes
      )
    );
  });

  const centralDirData = concat(...centralDir);
  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16le(0), u16le(0),
    u16le(files.length), u16le(files.length),
    u32le(centralDirData.length),
    u32le(offset),
    u16le(0)
  );

  const zipData = concat(...localHeaders, centralDirData, eocd);
  return new Blob([zipData.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

// ─── Sample Markdown ──────────────────────────────────────────────────────────

const SAMPLE_MD = `# Mi Documento de Ejemplo

## Introducción

Este es un ejemplo completo de Markdown. Puedes usar **negrita**, *cursiva* o ~~tachado~~ en cualquier párrafo.

## Características principales

- Soporte para listas con viñetas
- Múltiples niveles de anidamiento
  - Elemento secundario
  - Otro elemento secundario
- Integración con Word (.docx)

## Pasos numerados

1. Escribe tu Markdown en el panel izquierdo
2. Visualiza el resultado en tiempo real
3. Descarga como **.docx** o copia el HTML

## Código

Código en línea: \`npm install next\`

\`\`\`typescript
function greet(name: string): string {
  return \`Hola, \${name}!\`;
}
\`\`\`

## Tabla de comparación

| Formato | Soporte | Tamaño |
| ------- | ------- | ------ |
| .docx   | ✅ Word  | Medio  |
| .html   | ✅ Web   | Pequeño |
| .md     | ✅ Todo  | Mínimo |

> Esta herramienta procesa todo en tu navegador. Ningún dato se envía a servidores.

---

**Hecho con ❤ por MACM · miguelacm.es**
`;

// ─── Stats ────────────────────────────────────────────────────────────────────

interface MdStats {
  words: number;
  chars: number;
  lines: number;
  headings: number;
  links: number;
  images: number;
  codeBlocks: number;
  tables: number;
}

function analyzeMd(md: string): MdStats {
  return {
    words: md.trim() ? md.trim().split(/\s+/).length : 0,
    chars: md.length,
    lines: md.split("\n").length,
    headings: (md.match(/^#{1,6}\s/gm) ?? []).length,
    links: (md.match(/\[.+?\]\(.+?\)/g) ?? []).length,
    images: (md.match(/!\[.+?\]\(.+?\)/g) ?? []).length,
    codeBlocks: (md.match(/```[\s\S]*?```/g) ?? []).length,
    tables: (md.match(/^\|.+\|$/gm) ?? []).filter((_, i, a) => i === 0 || !/^\|[-| :]+\|/.test(a[i - 1])).length,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

type Mode = "md-to-docx" | "docx-to-md";
type View = "preview" | "html";

export default function MarkdownConverter({ locale = "es" }: Props) {
  const isEs = locale === "es";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("md-to-docx");
  const [mdInput, setMdInput] = useState("");
  const [view, setView] = useState<View>("preview");
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Rendered HTML from markdown
  const renderedHtml = useMemo(() => {
    if (!mdInput.trim()) return "";
    return mdToHtml(mdInput);
  }, [mdInput]);

  // Stats
  const stats = useMemo(() => analyzeMd(mdInput), [mdInput]);

  // Copy markdown
  const copyMd = useCallback(async () => {
    if (!mdInput) return;
    try {
      await navigator.clipboard.writeText(mdInput);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch { /* ignore */ }
  }, [mdInput]);

  // Copy HTML
  const copyHtml = useCallback(async () => {
    if (!renderedHtml) return;
    try {
      await navigator.clipboard.writeText(renderedHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch { /* ignore */ }
  }, [renderedHtml]);

  // Download .docx
  const downloadDocx = useCallback(() => {
    if (!mdInput.trim()) return;
    setDownloading(true);
    try {
      const blob = generateDocx(mdInput);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "documento.docx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  }, [mdInput]);

  // Download .md
  const downloadMd = useCallback(() => {
    if (!mdInput.trim()) return;
    const blob = new Blob([mdInput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documento.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [mdInput]);

  // Import .docx → .md using mammoth-like extraction
  const importDocx = useCallback(async (file: File) => {
    setImportError(null);
    try {
      // We extract text using a ZIP reader + parse word/document.xml
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Find word/document.xml in ZIP (simple store/inflate search)
      const decoder = new TextDecoder();
      const zipStr = decoder.decode(bytes);
      const docStart = zipStr.indexOf("word/document.xml");
      if (docStart === -1) throw new Error("No se encontró word/document.xml");

      // Find the actual XML content after the local file header
      // Local header: signature(4) + version(2) + flags(2) + method(2) + time(2) + date(2) + crc(4) + compSize(4) + uncompSize(4) + nameLen(2) + extraLen(2) = 30 bytes
      const sigOffset = docStart - 26; // approximate — walk back to find 0x504b0304
      let xmlStart = -1;
      for (let j = Math.max(0, sigOffset - 50); j < docStart + 100; j++) {
        if (bytes[j] === 0x50 && bytes[j + 1] === 0x4b && bytes[j + 2] === 0x03 && bytes[j + 3] === 0x04) {
          const nameLen = bytes[j + 26] | (bytes[j + 27] << 8);
          const extraLen = bytes[j + 28] | (bytes[j + 29] << 8);
          xmlStart = j + 30 + nameLen + extraLen;
          break;
        }
      }

      if (xmlStart === -1) throw new Error("No se pudo leer el archivo .docx");

      const compSize = bytes[j18(bytes, docStart - 10)] | (bytes[j18(bytes, docStart - 10) + 1] << 8);
      void compSize;

      // Search for the XML content directly in the full bytes
      const fullStr = decoder.decode(bytes.slice(xmlStart, xmlStart + 500000));
      const xmlTagStart = fullStr.indexOf("<w:document");
      const xmlTagEnd = fullStr.indexOf("</w:document>");
      if (xmlTagStart === -1 || xmlTagEnd === -1) throw new Error("Formato .docx no reconocido");

      const xmlContent = fullStr.slice(xmlTagStart, xmlTagEnd + "</w:document>".length);

      // Parse XML and extract text
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

      const md = xmlDocToMd(xmlDoc);
      setMdInput(md);
      setMode("md-to-docx");
    } catch (err) {
      setImportError(isEs ? "Error al leer el archivo. Asegúrate de que es un .docx válido." : "Error reading file. Make sure it is a valid .docx file.");
      console.error(err);
    }
  }, [isEs]);

  function j18(_bytes: Uint8Array, _offset: number) { return _offset; }

  function xmlDocToMd(xmlDoc: Document): string {
    const paragraphs = xmlDoc.querySelectorAll("w\\:p, p");
    const lines: string[] = [];

    paragraphs.forEach((p) => {
      // Get style
      const styleEl = p.querySelector("w\\:pStyle, pStyle");
      const style = styleEl?.getAttribute("w:val") ?? "";

      // Get text runs
      const runs = p.querySelectorAll("w\\:r, r");
      let text = "";
      runs.forEach((run) => {
        const tEl = run.querySelector("w\\:t, t");
        if (tEl) {
          const bold = run.querySelector("w\\:b, b");
          const italic = run.querySelector("w\\:i, i");
          let t = tEl.textContent ?? "";
          if (italic) t = `*${t}*`;
          if (bold) t = `**${t}**`;
          text += t;
        }
      });

      if (!text.trim()) return;

      const styleMap: Record<string, string> = {
        Heading1: "# ",
        "heading 1": "# ",
        "Heading 1": "# ",
        Heading2: "## ",
        "heading 2": "## ",
        "Heading 2": "## ",
        Heading3: "### ",
        "heading 3": "### ",
        "Heading 3": "### ",
        Heading4: "#### ",
        Heading5: "##### ",
        Heading6: "###### ",
        ListBullet: "- ",
        "List Bullet": "- ",
        ListNumber: "1. ",
        "List Number": "1. ",
        Quote: "> ",
      };

      const prefix = styleMap[style] ?? "";
      lines.push(`${prefix}${text}`);
    });

    return lines.join("\n\n");
  }

  // Handle file drop / input
  const handleFile = useCallback(
    async (file: File) => {
      if (file.name.endsWith(".docx")) {
        await importDocx(file);
      } else if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const text = await file.text();
        setMdInput(text);
      }
    },
    [importDocx]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Reset import error on input change
  useEffect(() => {
    if (importError) setImportError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mdInput]);

  const hasContent = mdInput.trim().length > 0;

  return (
    <>
      <style>{`
        .md-preview h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #f1f5f9; line-height: 1.2; }
        .md-preview h2 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.625rem; color: #f1f5f9; }
        .md-preview h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #e2e8f0; }
        .md-preview h4, .md-preview h5, .md-preview h6 { font-weight: 600; margin: 0.75rem 0 0.375rem; color: #e2e8f0; }
        .md-preview p { margin: 0.625rem 0; line-height: 1.7; color: #94a3b8; }
        .md-preview ul { margin: 0.5rem 0; padding-left: 1.5rem; list-style: disc; color: #94a3b8; }
        .md-preview ol { margin: 0.5rem 0; padding-left: 1.5rem; list-style: decimal; color: #94a3b8; }
        .md-preview li { margin: 0.25rem 0; }
        .md-preview blockquote { border-left: 3px solid #00d4ff; padding-left: 1rem; margin: 0.75rem 0; color: #64748b; font-style: italic; }
        .md-preview pre { background: rgba(15,15,25,0.8); border: 1px solid rgba(30,41,59,0.6); border-radius: 0.5rem; padding: 1rem; margin: 0.75rem 0; overflow-x: auto; }
        .md-preview code { font-family: 'Courier New', monospace; font-size: 0.85em; }
        .md-preview pre code { color: #a78bfa; font-size: 0.85rem; }
        .md-preview :not(pre) > code { background: rgba(167,139,250,0.1); color: #a78bfa; padding: 0.15em 0.4em; border-radius: 0.25rem; }
        .md-preview a { color: #00d4ff; text-decoration: underline; text-underline-offset: 2px; }
        .md-preview hr { border: none; border-top: 1px solid rgba(30,41,59,0.6); margin: 1.25rem 0; }
        .md-preview strong { color: #f1f5f9; font-weight: 600; }
        .md-preview em { font-style: italic; }
        .md-preview del { text-decoration: line-through; color: #64748b; }
        .md-preview table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.875rem; }
        .md-preview th { background: rgba(167,139,250,0.1); color: #f1f5f9; padding: 0.5rem 0.75rem; text-align: left; border: 1px solid rgba(30,41,59,0.5); font-weight: 600; }
        .md-preview td { padding: 0.5rem 0.75rem; border: 1px solid rgba(30,41,59,0.5); color: #94a3b8; }
        .md-preview img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
      `}</style>

      <div className="flex flex-col gap-4">
        {/* Mode selector + toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center rounded-lg border border-border/40 overflow-hidden text-xs">
            <button
              onClick={() => setMode("md-to-docx")}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                mode === "md-to-docx"
                  ? "bg-primary/20 text-primary"
                  : "bg-surface/60 text-text-muted hover:text-text"
              }`}
            >
              MD → DOCX
            </button>
            <button
              onClick={() => setMode("docx-to-md")}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                mode === "docx-to-md"
                  ? "bg-primary/20 text-primary"
                  : "bg-surface/60 text-text-muted hover:text-text"
              }`}
            >
              <MdSwapHoriz className="text-sm" />
              DOCX → MD
            </button>
          </div>

          {/* Load sample */}
          <button
            onClick={() => setMdInput(SAMPLE_MD)}
            className="rounded-lg border border-border/40 bg-surface/60 px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/40 hover:text-text"
          >
            {isEs ? "Ejemplo" : "Sample"}
          </button>

          {/* Import file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-surface/60 px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/40 hover:text-text"
          >
            <FiUpload className="text-xs" />
            {isEs ? "Importar .docx / .md" : "Import .docx / .md"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.md,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          {/* Clear */}
          <button
            onClick={() => { setMdInput(""); setImportError(null); }}
            className="flex items-center gap-1 rounded-lg border border-border/40 bg-surface/60 px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
          >
            <FiTrash2 className="text-xs" />
            {isEs ? "Limpiar" : "Clear"}
          </button>
        </div>

        {/* Import error */}
        {importError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            ⚠ {importError}
          </div>
        )}

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* INPUT panel */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-text-muted/60 font-medium uppercase tracking-wider px-1">
              {isEs ? "Markdown (entrada)" : "Markdown (input)"}
            </div>
            <textarea
              value={mdInput}
              onChange={(e) => setMdInput(e.target.value)}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              placeholder={
                mode === "docx-to-md"
                  ? (isEs ? "Importa un .docx con el botón de arriba, o pega tu Markdown aquí…" : "Import a .docx with the button above, or paste your Markdown here…")
                  : (isEs ? "Escribe o pega tu Markdown aquí… o arrastra un archivo .md / .docx" : "Write or paste your Markdown here… or drag a .md / .docx file")
              }
              spellCheck={false}
              className="min-h-[420px] w-full resize-y rounded-xl border border-border/30 bg-surface/40 p-4 font-mono text-sm text-text leading-relaxed placeholder:text-text-muted/40 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            {/* Input footer */}
            <div className="flex items-center justify-between text-xs text-text-muted/60">
              <span>{hasContent ? `${stats.words} ${isEs ? "palabras" : "words"} · ${stats.chars} chars` : ""}</span>
              <button
                onClick={copyMd}
                disabled={!hasContent}
                className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:text-text disabled:opacity-30"
              >
                {copiedMd ? <FiCheck className="text-green-400" /> : <FiCopy />}
                {isEs ? "Copiar MD" : "Copy MD"}
              </button>
            </div>
          </div>

          {/* OUTPUT panel */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-text-muted/60 font-medium uppercase tracking-wider px-1">
              {view === "preview"
                ? (isEs ? "Vista previa" : "Preview")
                : "HTML"}
            </div>
            <div className="min-h-[420px] overflow-auto rounded-xl border border-border/30 bg-surface/40 p-4">
              {!hasContent ? (
                <span className="text-sm text-text-muted/40">
                  {isEs ? "La vista previa aparecerá aquí…" : "Preview will appear here…"}
                </span>
              ) : view === "preview" ? (
                <div
                  className="md-preview text-sm"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <pre className="font-mono text-xs text-emerald-400/80 whitespace-pre-wrap break-all leading-relaxed">
                  {renderedHtml}
                </pre>
              )}
            </div>
            {/* Output footer */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-text-muted/60">
              {/* Preview / HTML toggle */}
              <div className="flex items-center rounded-lg border border-border/40 overflow-hidden text-xs">
                <button
                  onClick={() => setView("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    view === "preview"
                      ? "bg-primary/20 text-primary"
                      : "bg-surface/60 text-text-muted hover:text-text"
                  }`}
                >
                  <FiEye className="text-xs" />
                  {isEs ? "Preview" : "Preview"}
                </button>
                <button
                  onClick={() => setView("html")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    view === "html"
                      ? "bg-primary/20 text-primary"
                      : "bg-surface/60 text-text-muted hover:text-text"
                  }`}
                >
                  <FiCode className="text-xs" />
                  HTML
                </button>
              </div>

              {/* Copy HTML + Download buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={copyHtml}
                  disabled={!hasContent}
                  className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:text-text disabled:opacity-30"
                >
                  {copiedHtml ? <FiCheck className="text-green-400" /> : <FiCopy />}
                  {isEs ? "Copiar HTML" : "Copy HTML"}
                </button>
                <button
                  onClick={downloadMd}
                  disabled={!hasContent}
                  className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:text-text disabled:opacity-30"
                >
                  <FiDownload />
                  .md
                </button>
                <button
                  onClick={downloadDocx}
                  disabled={!hasContent || downloading}
                  className="flex items-center gap-1 rounded px-2 py-1 transition-colors hover:text-primary disabled:opacity-30 font-medium text-primary/80"
                >
                  <FiDownload />
                  {downloading ? (isEs ? "Generando…" : "Generating…") : ".docx"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {hasContent && (
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-muted">
              <span><span className="text-primary font-medium">{stats.words}</span> {isEs ? "palabras" : "words"}</span>
              <span><span className="text-primary font-medium">{stats.chars}</span> chars</span>
              <span><span className="text-primary font-medium">{stats.lines}</span> {isEs ? "líneas" : "lines"}</span>
              <span><span className="text-primary font-medium">{stats.headings}</span> {isEs ? "títulos" : "headings"}</span>
              {stats.links > 0 && <span><span className="text-primary font-medium">{stats.links}</span> links</span>}
              {stats.images > 0 && <span><span className="text-primary font-medium">{stats.images}</span> {isEs ? "imágenes" : "images"}</span>}
              {stats.codeBlocks > 0 && <span><span className="text-primary font-medium">{stats.codeBlocks}</span> {isEs ? "bloques código" : "code blocks"}</span>}
              {stats.tables > 0 && <span><span className="text-primary font-medium">{stats.tables}</span> {isEs ? "tablas" : "tables"}</span>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
