import type { Metadata } from "next";
import MarkdownConverter from "@/components/MarkdownConverter";
import { MdDescription } from "react-icons/md";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://miguelacm.es/tools/markdown-converter";
const EMBED_URL =
  process.env.NEXT_PUBLIC_EMBED_URL || "https://miguelacm.es/embed/markdown-converter";

export const metadata: Metadata = {
  title: "Convertidor Markdown a Word Online Gratis",
  description:
    "Convierte Markdown a .docx (Word) al instante. Editor con vista previa en tiempo real, importa .docx, descarga .md. Sin registro, 100% en el navegador.",
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Convertidor Markdown a Word Online Gratis",
  url: SITE_URL,
  description:
    "Convierte Markdown a .docx (Word) al instante. Editor con vista previa en tiempo real, importa .docx, descarga .md. Sin registro, 100% en el navegador.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  inLanguage: "es-ES",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  author: {
    "@type": "Person",
    name: "Miguel Ángel Colorado Marin",
    url: "https://miguelacm.es",
  },
  featureList: [
    "Editor Markdown con vista previa HTML en tiempo real",
    "Conversión Markdown a .docx (Word) 100% en el navegador",
    "Importación de archivos .docx existentes a Markdown",
    "Soporte completo: títulos H1-H6, negrita, cursiva, listas, tablas, código, citas",
    "Vista HTML del resultado para copiar en cualquier web",
    "Descarga como .docx o .md",
    "Panel de estadísticas: palabras, líneas, títulos, links, tablas",
    "Arrastra y suelta archivos .md o .docx",
    "Sin dependencias externas — JavaScript puro",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <MdDescription className="text-base" />
              Herramienta gratuita · Código abierto
            </div>
            <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl">
              Convertidor Markdown
            </h1>
            <p className="mb-2 text-lg text-text-muted">
              Editor Markdown con preview. Convierte a Word (.docx) o importa un .docx a Markdown.
            </p>
            <p className="text-sm text-text-muted/60">
              Hecho por{" "}
              <a
                href="https://miguelacm.es"
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-text font-medium hover:opacity-80 transition-opacity"
              >
                MACM
              </a>{" "}
              · Sin registro · Sin anuncios · 100% en el navegador
            </p>
          </div>

          {/* Tool */}
          <div className="glass rounded-2xl border border-border/20 p-6 md:p-8">
            <MarkdownConverter />
          </div>

          {/* How to use */}
          <div className="mt-12 glass rounded-2xl border border-border/20 p-8">
            <h2 className="mb-6 text-2xl font-bold text-white">
              ¿Cómo usar el convertidor Markdown?
            </h2>
            <ol className="space-y-5">
              {[
                {
                  n: "1",
                  t: "Escribe o pega tu Markdown",
                  d: "Escribe directamente en el panel izquierdo o pega cualquier texto en formato Markdown. Pulsa Ejemplo para cargar un documento de muestra con todos los elementos soportados. Si tienes un archivo .md o .docx en tu ordenador, arrástralo directamente sobre el editor.",
                },
                {
                  n: "2",
                  t: "Visualiza el resultado en tiempo real",
                  d: "El panel derecho muestra la vista previa renderizada del Markdown a medida que escribes, sin necesidad de pulsar ningún botón. Cambia al modo HTML para ver el código fuente generado, listo para copiar en cualquier web o CMS.",
                },
                {
                  n: "3",
                  t: "Importa un archivo Word (.docx)",
                  d: "Pulsa Importar .docx / .md para abrir un archivo Word existente. El convertidor extrae el texto y la estructura del documento y lo transforma a Markdown limpio. Ideal para migrar documentos de Word a sistemas como GitHub, Notion, Hugo o Obsidian.",
                },
                {
                  n: "4",
                  t: "Descarga como .docx o .md",
                  d: "Pulsa .docx para descargar el documento como archivo Word compatible con Microsoft Word, LibreOffice y Google Docs. Pulsa .md para guardar el Markdown como archivo de texto. El .docx incluye estilos de título, listas, código, citas y tablas correctamente formateados.",
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">{step.t}</h3>
                    <p className="text-sm leading-relaxed text-text-muted">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* FAQ */}
          <div className="mt-8 glass rounded-2xl border border-border/20 p-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Preguntas frecuentes</h2>
            <div className="space-y-6">
              {[
                {
                  q: "¿El .docx generado es compatible con Microsoft Word?",
                  a: "Sí. El archivo sigue el estándar Office Open XML (OOXML), compatible con Word 2007+, LibreOffice 4+ y Google Docs. Los estilos de título se mapean correctamente para que el documento tenga una estructura de estilos real.",
                },
                {
                  q: "¿Por qué el resultado del DOCX → MD no es perfecto?",
                  a: "La calidad depende de cómo esté estructurado el Word original. Si usa estilos de párrafo nativos (Título 1, Título 2, Lista con viñetas, etc.), el resultado es muy limpio. Si el formato se aplicó manualmente, la información semántica se pierde.",
                },
                {
                  q: "¿Qué elementos Markdown soporta?",
                  a: "Soporta los elementos más comunes de CommonMark: títulos H1-H6, negrita, cursiva, tachado, listas, listas anidadas, tablas, bloques de código con lenguaje, código en línea, citas, separadores y enlaces.",
                },
                {
                  q: "¿Puedo importar un .docx con imágenes?",
                  a: "El conversor extrae texto y estructura. Las imágenes incrustadas no se exportan como archivos independientes porque están codificadas en binario dentro del .docx. El texto alternativo sí se preserva cuando está disponible.",
                },
                {
                  q: "¿Se envía mi documento a algún servidor?",
                  a: "No. Todo el proceso ocurre completamente en tu navegador mediante JavaScript puro. Ningún dato abandona tu dispositivo en ningún momento.",
                },
              ].map((item) => (
                <div key={item.q}>
                  <h3 className="mb-2 font-semibold text-white">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Embed section */}
          <div className="mt-8 glass rounded-2xl border border-border/20 p-8">
            <h2 className="mb-4 text-xl font-bold text-white">
              Incrusta el convertidor en tu web
            </h2>
            <p className="mb-4 text-sm text-text-muted">
              Puedes integrar este convertidor Markdown en cualquier página web con un simple iframe:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-surface/80 p-4 text-xs text-text-muted">
              <code>{`<iframe\n  src="${EMBED_URL}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  title="Markdown Converter"\n></iframe>`}</code>
            </pre>
          </div>
        </div>
      </main>
    </>
  );
}
