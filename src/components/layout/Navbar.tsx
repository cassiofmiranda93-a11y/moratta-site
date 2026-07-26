"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { COMPANY, WHATSAPP_URL } from "@/constants/company";
import { NAVIGATION } from "@/constants/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="Moratta Imóveis">
          <Image src="/images/logo/logo-moratta.png" alt="Moratta Imóveis" width={170} height={58} className="h-12 w-auto object-contain" priority />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAVIGATION.map((item) => <Link key={item.href} href={item.href} className="font-medium text-slate-700 hover:text-blue-800">{item.label}</Link>)}
        </nav>
        <a href={`${WHATSAPP_URL}?text=${encodeURIComponent("Olá! Quero conhecer os imóveis da Moratta.")}`} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-semibold text-white hover:bg-blue-800 md:flex"><Phone size={18} /> WhatsApp</a>
        <button onClick={() => setOpen((value) => !value)} className="rounded-xl p-2 hover:bg-slate-100 md:hidden" aria-label="Abrir menu">{open ? <X size={28} /> : <Menu size={28} />}</button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-1">{NAVIGATION.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100">{item.label}</Link>)}</nav>
          <a href={WHATSAPP_URL} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white"><Phone size={18} /> {COMPANY.phone}</a>
        </div>
      )}
    </header>
  );
}
