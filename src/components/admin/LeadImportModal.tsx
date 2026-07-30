"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import * as XLSX from "xlsx";
import { buildCrmImportPreview, normalizeImportKey } from "@/lib/crmImport";
import { importCrmData } from "@/services/adminService";
import type { CrmImportPreview } from "@/types/admin";

function rowsFromSheet(sheet: XLSX.WorkSheet, expectedHeaders: string[]) {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
  const expected = expectedHeaders.map(normalizeImportKey);
  const headerIndex = rows.findIndex((row) => {
    const values = Array.isArray(row) ? row.map(normalizeImportKey) : [];
    return expected.some((header) => values.includes(header));
  });
  if (headerIndex < 0) return [];
  const headers = (rows[headerIndex] as unknown[]).map((value) => String(value ?? "").trim());
  return rows.slice(headerIndex + 1).map((values, index) => {
    const row = (Array.isArray(values) ? values : []).reduce<Record<string, unknown>>((result, value, column) => {
      const header = headers[column];
      if (header) result[header] = value;
      return result;
    }, {});
    row.__rowNumber = headerIndex + index + 2;
    return row;
  });
}

export default function LeadImportModal({ onClose, onImported }: { onClose: () => void; onImported: (message: string) => void }) {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<CrmImportPreview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const summary = useMemo(() => ({
    leads: preview?.leads.length ?? 0,
    sales: preview?.sales.length ?? 0,
    issues: preview?.issues.length ?? 0,
  }), [preview]);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setPreview(null);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const clientSheet = workbook.Sheets.Clientes ?? workbook.Sheets[workbook.SheetNames[0]];
      const saleSheet = workbook.Sheets.Vendas_Recebimentos;
      if (!clientSheet) throw new Error("A planilha não possui uma aba com clientes.");
      const clientRows = rowsFromSheet(clientSheet, ["Nome completo", "WhatsApp com DDD"]);
      const saleRows = saleSheet ? rowsFromSheet(saleSheet, ["WhatsApp do cliente", "Nome do cliente"]) : [];
      const nextPreview = buildCrmImportPreview(clientRows, saleRows);
      if (nextPreview.leads.length === 0) throw new Error("Nenhum cliente foi encontrado. Use o modelo da Moratta sem alterar os títulos das colunas.");
      setPreview(nextPreview);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível ler a planilha.");
    }
  }

  async function confirmImport() {
    if (!preview || preview.issues.length > 0) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await importCrmData(preview);
      const resultMessage = [
        `${result.leadsCreated} cliente${result.leadsCreated === 1 ? "" : "s"} cadastrado${result.leadsCreated === 1 ? "" : "s"}`,
        `${result.leadsSkipped} duplicado${result.leadsSkipped === 1 ? "" : "s"} ignorado${result.leadsSkipped === 1 ? "" : "s"}`,
        `${result.salesCreated} venda${result.salesCreated === 1 ? "" : "s"} importada${result.salesCreated === 1 ? "" : "s"}`,
      ].join(" · ");
      onImported(resultMessage);
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível importar os dados.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/60 p-4">
      <div className="mx-auto my-6 w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><FileSpreadsheet/></span><div><p className="text-xs font-bold uppercase text-emerald-700">Importação em lote</p><h2 className="text-2xl font-extrabold text-slate-950">Clientes, etapas e vendas</h2></div></div>
          <button onClick={onClose} className="rounded-xl bg-slate-100 p-3"><X/></button>
        </header>

        <div className="p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-600">
              <UploadCloud className="text-blue-800" size={32}/>
              <p className="mt-3 font-extrabold text-slate-900">Selecione a planilha preenchida</p>
              <p className="mt-1 text-sm text-slate-500">Formatos aceitos: XLSX, XLS e CSV</p>
              {fileName && <p className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">{fileName}</p>}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={readFile} className="hidden"/>
            </label>
            <a href="/modelos/Modelo_Importacao_Clientes_Moratta.xlsx" download className="flex min-w-52 items-center justify-center gap-2 rounded-2xl border border-blue-950 px-5 py-4 font-bold text-blue-950"><Download size={18}/> Baixar modelo</a>
          </div>

          {message && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{message}</p>}

          {preview && (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Summary label="Clientes encontrados" value={summary.leads}/>
                <Summary label="Vendas encontradas" value={summary.sales}/>
                <Summary label="Erros para corrigir" value={summary.issues} alert={summary.issues > 0}/>
              </div>

              {preview.issues.length > 0 ? (
                <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2 text-amber-800"><AlertTriangle/><h3 className="font-extrabold">Corrija a planilha antes de importar</h3></div>
                  <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                    {preview.issues.slice(0, 100).map((item, index) => <p key={`${item.sheet}-${item.row}-${index}`} className="rounded-xl bg-white p-3 text-sm text-slate-700"><strong>{item.sheet}, linha {item.row}, {item.field}:</strong> {item.message}</p>)}
                  </div>
                  {preview.issues.length > 100 && <p className="mt-3 text-sm text-amber-800">Mais {preview.issues.length - 100} erros não exibidos.</p>}
                </section>
              ) : (
                <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2 text-emerald-800"><CheckCircle2/><h3 className="font-extrabold">Planilha validada</h3></div>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">Somente nome e WhatsApp são obrigatórios. Campos vazios serão aceitos e a etapa vazia será cadastrada como Novo lead. Clientes com o mesmo WhatsApp já existentes serão ignorados.</p>
                </section>
              )}

              <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Linha</th><th className="p-3">Cliente</th><th className="p-3">WhatsApp</th><th className="p-3">Etapa</th><th className="p-3">Corretor</th><th className="p-3">Interesse</th></tr></thead><tbody>{preview.leads.slice(0, 12).map((item) => <tr key={`${item.rowNumber}-${item.lead.phone}`} className="border-t border-slate-100"><td className="p-3">{item.rowNumber}</td><td className="p-3 font-bold">{item.lead.name}</td><td className="p-3">{item.lead.phone}</td><td className="p-3">{item.lead.stage}</td><td className="p-3">{item.lead.assignedTo || "Sem responsável"}</td><td className="p-3">{item.lead.propertyInterest || "Não informado"}</td></tr>)}</tbody></table></div>
                {preview.leads.length > 12 && <p className="border-t border-slate-100 p-3 text-center text-xs text-slate-500">Prévia das primeiras 12 linhas de {preview.leads.length} clientes.</p>}
              </section>
            </>
          )}

          <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">Cancelar</button><button onClick={confirmImport} disabled={!preview || preview.issues.length > 0 || busy} className="rounded-xl bg-blue-950 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Importando..." : "Confirmar importação"}</button></div>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return <div className={`rounded-2xl p-4 ${alert ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-800"}`}><p className="text-xs font-semibold uppercase">{label}</p><p className="mt-1 text-3xl font-extrabold">{value}</p></div>;
}
