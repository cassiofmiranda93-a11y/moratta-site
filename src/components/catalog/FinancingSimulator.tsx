"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/catalog";

export default function FinancingSimulator({ price }: { price: number | null }) {
  const [downPayment, setDownPayment] = useState(price ? Math.round(price * 0.2) : 0);
  const [months, setMonths] = useState(420);
  const [annualRate, setAnnualRate] = useState(9.5);
  const monthly = useMemo(() => {
    if (!price || price <= downPayment) return null;
    const financed = price - downPayment;
    const rate = annualRate / 100 / 12;
    if (!rate) return financed / months;
    return financed * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
  }, [price, downPayment, months, annualRate]);

  return <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5"><div className="flex items-center gap-2 text-blue-950"><Calculator size={20}/><h3 className="font-extrabold">Simulação aproximada</h3></div><p className="mt-2 text-xs leading-5 text-slate-500">Estimativa informativa. A aprovação, taxa e parcela final dependem da análise bancária.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm font-semibold">Entrada<input type="number" value={downPayment} onChange={(e)=>setDownPayment(Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"/></label><label className="text-sm font-semibold">Prazo<select value={months} onChange={(e)=>setMonths(Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"><option value={240}>240 meses</option><option value={360}>360 meses</option><option value={420}>420 meses</option></select></label><label className="text-sm font-semibold">Taxa anual<input type="number" step="0.1" value={annualRate} onChange={(e)=>setAnnualRate(Number(e.target.value))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3"/></label></div><div className="mt-4 rounded-xl bg-white p-4"><p className="text-xs text-slate-500">Parcela estimada</p><p className="text-2xl font-extrabold text-blue-950">{monthly ? formatCurrency(monthly) : "Consulte"}<span className="text-sm font-medium text-slate-500"> /mês</span></p></div></div>;
}
