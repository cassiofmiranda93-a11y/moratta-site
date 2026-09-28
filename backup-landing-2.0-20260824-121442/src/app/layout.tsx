import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://morattaimoveis.com.br"),
  title: {
    default: "Moratta Imóveis | Seu novo lar começa aqui",
    template: "%s | Moratta Imóveis",
  },
  description: "Imóveis em Gravataí e Região Metropolitana com análise de crédito, financiamento Caixa, FGTS e acompanhamento completo.",
  openGraph: {
    title: "Moratta Imóveis",
    description: "Você sonha. A gente realiza.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-slate-900">{children}</body>
    </html>
  );
}
