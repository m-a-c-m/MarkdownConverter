import type { Metadata } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://miguelacm.es/tools/markdown-converter";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Convertidor Markdown a Word Online Gratis",
    template: "%s | Markdown Converter",
  },
  description:
    "Convierte Markdown a .docx (Word) al instante. Editor con vista previa en tiempo real, importa .docx, descarga .md. Sin registro, gratis, 100% en el navegador.",
  keywords: [
    "markdown to word",
    "markdown to docx",
    "convertidor markdown",
    "md to docx",
    "markdown editor online",
    "markdown converter",
    "markdown to word online",
    "editor markdown gratis",
    "convertir markdown a word",
    "markdown online editor",
  ],
  authors: [{ name: "Miguel Ángel Colorado Marin", url: "https://miguelacm.es" }],
  creator: "Miguel Ángel Colorado Marin",
  openGraph: {
    title: "Convertidor Markdown a Word Online Gratis",
    description:
      "Convierte Markdown a .docx (Word). Editor con preview en tiempo real, importa .docx, descarga .md. Sin registro. Por MACM.",
    url: SITE_URL,
    siteName: "Markdown Converter — MACM",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertidor Markdown a Word Online Gratis",
    description: "Convierte Markdown a .docx gratis. Sin registro. Por MACM · miguelacm.es",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="author" href="https://miguelacm.es" />
        <meta name="author" content="Miguel Ángel Colorado Marin" />
        <meta name="copyright" content="Miguel Ángel Colorado Marin — miguelacm.es" />
      </head>
      <body className="antialiased">
        {children}
        <footer className="pb-8 text-center text-xs text-text-muted/40">
          ⚡ por{" "}
          <a
            href="https://miguelacm.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted/60 transition-colors hover:text-text-muted underline-offset-2 hover:underline"
          >
            MACM · miguelacm.es
          </a>
          {" · "}
          <a
            href="https://github.com/m-a-c-m/MarkdownConverter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted/60 transition-colors hover:text-text-muted underline-offset-2 hover:underline"
          >
            Código abierto
          </a>
        </footer>
      </body>
    </html>
  );
}
