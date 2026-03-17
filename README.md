# 📝 Markdown Converter

Free online Markdown editor with real-time preview and Word (.docx) export. No sign-up, no ads, 100% client-side. Convert Markdown to .docx or import a .docx to Markdown instantly — all in the browser with pure JavaScript, zero dependencies.

🌐 **Demo en vivo / Live demo:** [miguelacm.es/tools/markdown-converter](https://miguelacm.es/tools/markdown-converter)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![License MIT](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 📝 **Editor Markdown / Markdown editor** — escribe o pega Markdown con vista previa en tiempo real / write or paste Markdown with real-time preview
- 📄 **MD → DOCX** — exporta a Word compatible con Microsoft Word, LibreOffice y Google Docs / export to Word compatible with Microsoft Word, LibreOffice and Google Docs
- 🔄 **DOCX → MD** — importa un .docx existente y obtén Markdown limpio / import an existing .docx and get clean Markdown
- 🌐 **Vista HTML / HTML view** — copia el HTML generado para cualquier web o CMS / copy the generated HTML for any website or CMS
- 📊 **Estadísticas del documento / Document stats** — palabras, líneas, títulos, links, tablas / words, lines, headings, links, tables
- ⬇️ **Descarga .docx y .md / Download .docx and .md** — guarda el resultado en el formato que necesites / save the result in the format you need
- 🖱️ **Drag & drop** — arrastra archivos .md o .docx sobre el editor / drag .md or .docx files onto the editor
- 🔒 **100% privado / 100% private** — ningún dato sale de tu navegador / no data leaves your browser
- ⚡ **Sin dependencias externas / Zero external dependencies** — JavaScript puro, carga instantánea / pure JavaScript, instant load
- 📦 **Embebible / Embeddable** — iframe listo para cualquier web / iframe ready for any website

---

## 🚀 Quick start

```bash
git clone https://github.com/m-a-c-m/MarkdownConverter.git
cd MarkdownConverter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Optional env vars:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com/tools/markdown-converter
NEXT_PUBLIC_EMBED_URL=https://yourdomain.com/embed/markdown-converter
```

---

## 📦 Embed on your website

```html
<iframe
  src="https://miguelacm.es/embed/markdown-converter"
  width="100%"
  height="700"
  frameborder="0"
  title="Markdown Converter"
></iframe>
```

Or link with attribution:

```markdown
[Markdown Converter by MACM](https://miguelacm.es/tools/markdown-converter)
```

> **Tip:** linking back helps keep these tools free and open source. Thank you!

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
| --- | --- | --- |
| Next.js | 16.1.6 | React framework, SSG |
| React | 19 | UI components |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| react-icons | 5 | Icons |
| Pure JS | — | MD→HTML, HTML→MD, ZIP/DOCX generation |

---

## 📐 How the DOCX generation works

The `.docx` is generated entirely in the browser **without any library**:

1. Parses Markdown into a list of typed paragraphs (headings, lists, tables, code, quotes…)
2. Builds the Open XML (`word/document.xml`, `word/styles.xml`, `word/numbering.xml`)
3. Packages everything into a ZIP file using a custom pure-JS ZIP builder with CRC32
4. Delivers the result as a `Blob` download — no server, no npm package

The output includes proper Word paragraph styles, numbered lists, code blocks with monospaced font, bordered quotes and tables with highlighted headers.

---

## 📄 License

MIT © [Miguel Ángel Colorado Marin](https://miguelacm.es)

[Portfolio](https://miguelacm.es) · [LinkedIn](https://linkedin.com/in/macm) · [GitHub](https://github.com/m-a-c-m)
