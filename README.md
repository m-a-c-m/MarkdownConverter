# 📝 Markdown Converter — MD to Word Online

**Free Markdown Editor & Converter.** Write or paste Markdown, see a real-time preview, and export to Word (.docx) instantly. Import existing .docx files and get clean Markdown. No sign-up, no ads, 100% client-side.

🌐 **Demo en vivo / Live demo:** [miguelacm.es/tools/markdown-converter](https://miguelacm.es/tools/markdown-converter)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

- 📝 **Editor Markdown / Markdown editor:** escribe o pega Markdown con vista previa renderizada en tiempo real / write or paste Markdown with rendered real-time preview
- 📄 **MD → DOCX:** exporta a Word compatible con Microsoft Word, LibreOffice y Google Docs / export to Word compatible with Microsoft Word, LibreOffice and Google Docs
- 🔄 **DOCX → MD:** importa un .docx existente y obtén Markdown limpio / import an existing .docx and get clean Markdown
- 🌐 **Vista HTML / HTML view:** copia el HTML generado listo para cualquier web o CMS / copy the generated HTML ready for any website or CMS
- 📊 **Estadísticas / Document stats:** palabras, líneas, títulos, links, imágenes, tablas, bloques de código / words, lines, headings, links, images, tables, code blocks
- ⬇️ **Descarga / Download:** guarda el resultado como .docx o .md / save the result as .docx or .md
- 🖱️ **Drag & drop:** arrastra archivos .md o .docx sobre el editor / drag .md or .docx files onto the editor
- ⚡ **Zero dependencies:** generación .docx puro JS (Open XML + ZIP sin librerías) / pure JS .docx generation (Open XML + ZIP without libraries)
- 🔒 **Privacidad total / Full privacy:** ningún dato sale de tu navegador / no data leaves your browser
- 📦 **Embebible / Embeddable:** iframe listo para cualquier web / iframe ready for any website

---

## 🚀 Quick start

```bash
git clone https://github.com/m-a-c-m/MarkdownConverter.git
cd MarkdownConverter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (optional)

```env
NEXT_PUBLIC_SITE_URL=https://miguelacm.es/tools/markdown-converter
NEXT_PUBLIC_EMBED_URL=https://miguelacm.es/embed/markdown-converter
```

---

## 📦 Embed on your website

### Iframe (plug & play)

```html
<iframe
  src="https://miguelacm.es/embed/markdown-converter"
  width="100%"
  height="700"
  style="border:none;border-radius:12px;"
  title="Markdown Converter — miguelacm.es"
  loading="lazy"
></iframe>
```

### Link with attribution (recommended for backlink)

```html
<a href="https://miguelacm.es/tools/markdown-converter" target="_blank" rel="noopener">
  Convertidor Markdown a Word gratis por MACM
</a>
```

> 💡 The link option generates a real backlink that benefits the project. Recommended if your platform supports custom HTML.

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | React framework + SSG |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Styling |
| [react-icons](https://react-icons.github.io/react-icons/) | 5 | Icons |
| Pure JS | — | MD→HTML, DOCX generation (Open XML + ZIP), DOCX→MD parser |

---

## 📄 License

MIT © [Miguel Ángel Colorado Marin (MACM)](https://miguelacm.es)

Built with ❤️ by **[MACM](https://miguelacm.es)** — Full Stack Developer & Cybersecurity Specialist from Guadalajara, Spain.

- 🌐 Portfolio: [miguelacm.es](https://miguelacm.es)
- 💼 LinkedIn: [linkedin.com/in/macm](https://www.linkedin.com/in/macm/)
- 🐙 GitHub: [github.com/m-a-c-m](https://github.com/m-a-c-m)
