"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { COMPANY, WHATSAPP_URL } from "@/constants/company";
import { NAVIGATION } from "@/constants/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Moratta Imóveis">
          <Image src="/images/logo/logo-moratta.png" alt="Moratta Imóveis" width={154} height={52} className="h-10 w-auto object-contain" priority />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAVIGATION.map((item) => <Link key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 hover:text-blue-900">{item.label}</Link>)}
        </nav>
        <a href={`${WHATSAPP_URL}?text=${encodeURIComponent("Olá! Quero conhecer os imóveis da Moratta.")}`} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 md:flex"><MessageCircle size={17} /> Fale conosco</a>
        <button onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 hover:bg-slate-100 md:hidden" aria-label="Abrir menu">{open ? <X size={26} /> : <Menu size={26} />}</button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-1">{NAVIGATION.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100">{item.label}</Link>)}</nav>
          <a href={WHATSAPP_URL} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-950 px-5 py-3 font-bold text-white"><MessageCircle size={18} /> {COMPANY.phone}</a>
        </div>
      )}
    </header>
  );
}
