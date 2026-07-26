"use client";

import { Link2, Share2 } from "lucide-react";

export default function ShareButtons({ title }: { title: string }) {
  async function copy() { await navigator.clipboard.writeText(window.location.href); }
  async function share() { if (navigator.share) await navigator.share({ title, url: window.location.href }); else await copy(); }
  return <div className="mt-5 flex gap-2"><button onClick={share} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"><Share2 size={16}/> Compartilhar</button><button onClick={copy} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"><Link2 size={16}/> Copiar link</button></div>;
}
