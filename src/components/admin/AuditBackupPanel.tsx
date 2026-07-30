"use client";

import { useEffect, useState } from "react";
import { ArchiveRestore, Download, FileClock, ShieldCheck, Trash2 } from "lucide-react";
import { createCrmBackup, subscribeToAuditLogs } from "@/services/adminService";
import { cleanupAuditLogs } from "@/services/integrationService";
import type { AuditLogRecord } from "@/types/admin";

export default function AuditBackupPanel() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToAuditLogs(setLogs, (error) => setMessage(error.message)), []);

  async function applyRetention() {
    if (!window.confirm("Excluir registros de auditoria anteriores ao prazo definido em Segurança?")) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await cleanupAuditLogs();
      setMessage(`Política aplicada: ${result.deleted} registro(s) removido(s), preservando os últimos ${result.retentionDays} dias.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível aplicar a retenção.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadBackup() {
    setBusy(true);
    setMessage("");
    try {
      const backup = await createCrmBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moratta-backup-${backup.generatedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup completo exportado. Guarde o arquivo em local seguro.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível exportar o backup.");
    } finally {
      setBusy(false);
    }
  }

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-bold text-blue-800"><ShieldCheck size={17}/> GOVERNANÇA</p><h1 className="text-3xl font-extrabold text-slate-950">Auditoria e backup</h1><p className="mt-2 text-slate-500">Acompanhe alterações importantes e exporte uma cópia dos dados operacionais.</p></div><div className="flex flex-wrap gap-2"><button onClick={applyRetention} disabled={busy} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 disabled:opacity-60"><Trash2 size={18}/> Aplicar retenção</button><button onClick={downloadBackup} disabled={busy} className="flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 font-bold text-white disabled:opacity-60"><Download size={18}/>{busy ? "Preparando..." : "Exportar backup JSON"}</button></div></div>
    {message && <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{message}</p>}
    <div className="mt-6 grid gap-4 md:grid-cols-2"><Info icon={<ArchiveRestore/>} title="Recuperação" text="O arquivo contém clientes, equipe, vendas e configurações. A restauração deve ser feita por administrador após conferência do arquivo."/><Info icon={<FileClock/>} title="Rastro de alterações" text="Cadastros, etapas, responsáveis, vendas, acessos e configurações passam a gerar registros de auditoria."/></div>
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Data</th><th className="p-4">Ação</th><th className="p-4">Registro</th><th className="p-4">Responsável</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t border-slate-100"><td className="p-4 text-sm text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString("pt-BR") : "Processando"}</td><td className="p-4 font-bold text-slate-800">{log.action}</td><td className="p-4"><p className="font-semibold text-slate-700">{log.entityLabel || log.entityId}</p><p className="text-xs uppercase text-slate-400">{log.entityType}</p></td><td className="p-4 text-sm text-slate-600">{log.actorEmail || "Sistema"}</td></tr>)}</tbody></table></div>{logs.length === 0 && <div className="py-14 text-center text-slate-400">Nenhum registro de auditoria ainda.</div>}</div>
  </section>;
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <article className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-900">{icon}</span><h2 className="font-extrabold">{title}</h2></div><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></article>; }
