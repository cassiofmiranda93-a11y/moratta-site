import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { Container } from "@/components/ui";
import { COMPANY, WHATSAPP_URL } from "@/constants/company";
import { SOCIAL } from "@/constants/social";

export default function Footer() {
  return (
    <footer id="contato" className="bg-slate-950 text-white">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[1.25fr_1fr_0.8fr]">
          <div className="max-w-md">
            <Image
              src="/images/logo/logo-moratta.png"
              alt="Moratta Imóveis"
              width={190}
              height={70}
              className="h-12 w-auto rounded bg-white p-2 object-contain"
            />

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Imóveis e financiamento com atendimento próximo em Gravataí e
              Região Metropolitana.
            </p>
          </div>

          <div>
            <h3 className="mb-5 font-bold">Contato</h3>

            <div className="space-y-3 text-sm text-slate-300">
              <a href={WHATSAPP_URL} className="flex items-center gap-3">
                <Phone size={18} />
                {COMPANY.phone}
              </a>

              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-3"
              >
                <Mail size={18} />
                {COMPANY.email}
              </a>

              <div className="flex items-center gap-3">
                <MapPin size={18} />
                {COMPANY.city} - {COMPANY.state}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-bold">Acompanhe</h3>

            <div className="flex gap-3">
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-lg bg-slate-800 p-2.5 hover:bg-pink-700"
              >
                <FaInstagram size={20} />
              </a>

              <a
                href={SOCIAL.facebook || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-lg bg-slate-800 p-2.5 hover:bg-blue-700"
              >
                <FaFacebookF size={20} />
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-lg bg-green-600 p-2.5 hover:bg-green-500"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>

            <nav className="mt-6 flex flex-col gap-2 text-sm text-slate-400">
              <Link href="/empreendimentos">Empreendimentos</Link>
              <Link href="/#sobre">Sobre a Moratta</Link>
            </nav>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-800 py-5 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Moratta Imóveis.</span>
          <span>CRECI/RS</span>
        </div>
      </Container>
    </footer>
  );
}
