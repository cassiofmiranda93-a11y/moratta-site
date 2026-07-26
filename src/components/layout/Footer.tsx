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
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/images/logo/logo-moratta.png"
              alt="Moratta Imóveis"
              width={190}
              height={70}
              className="h-14 w-auto rounded bg-white p-2 object-contain"
            />

            <p className="mt-5 leading-7 text-slate-300">
              Especialistas em imóveis financiados pela Caixa, Minha Casa Minha
              Vida e imóveis residenciais na Região Metropolitana de Porto Alegre.
            </p>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">Contato</h3>

            <div className="space-y-4 text-slate-300">
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
            <h3 className="mb-6 text-lg font-semibold">Navegação</h3>

            <nav className="flex flex-col gap-3 text-slate-300">
              <Link href="/">Início</Link>
              <Link href="/empreendimentos">Empreendimentos</Link>
              <Link href="/#sobre">Sobre</Link>
              <Link href="/#contato">Contato</Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">Redes sociais</h3>

            <div className="flex gap-4">
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full bg-slate-800 p-3 hover:bg-pink-700"
              >
                <FaInstagram size={20} />
              </a>

              <a
                href={SOCIAL.facebook || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full bg-slate-800 p-3 hover:bg-blue-700"
              >
                <FaFacebookF size={20} />
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-full bg-green-600 p-3 hover:bg-green-500"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>

            <p className="mt-8 text-sm text-slate-400">CRECI/RS</p>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Moratta Imóveis. Todos os direitos
          reservados.
        </div>
      </Container>
    </footer>
  );
}
