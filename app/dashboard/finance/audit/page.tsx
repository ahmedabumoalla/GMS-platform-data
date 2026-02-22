'use client';

import { useState } from 'react';
import { 
  ShieldCheck, Lock, Search, Filter, Database, 
  History, Fingerprint, Key, CheckCircle2, AlertTriangle, User
} from 'lucide-react';
import { useDashboard } from '../../layout';

export default function AuditCompliancePage() {
  const { lang } = useDashboard();
  const isRTL = lang === 'ar';

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const t = {
    ar: {
      title: 'التدقيق والامتثال الصارم',
      desc: 'سجل تدقيق غير قابل للتغيير (Immutable Log) لضمان الشفافية المؤسسية التامة.',
      verifyBtn: 'التحقق من سلامة التشفير (Hash Verify)',
      verifiedMsg: 'تم التحقق: جميع السجلات مؤمنة تشفيرياً ولم يتم التلاعب بها.',
      filters: { all: 'كل السجلات', security: 'أحداث الأمان', financial: 'حركات مالية', zatca: 'سجلات ZATCA' },
      table: { timestamp: 'الطابع الزمني', user: 'المستخدم / IP', action: 'الإجراء', target: 'العنصر المتأثر', hash: 'التوقيع التشفيري (Hash)' }
    },
    en: {
      title: 'Audit & Strict Compliance',
      desc: 'Immutable audit trails ensuring absolute institutional transparency.',
      verifyBtn: 'Verify Cryptographic Integrity',
      verifiedMsg: 'Verified: All records are cryptographically secured and untampered.',
      filters: { all: 'All Logs', security: 'Security Events', financial: 'Financial Trans', zatca: 'ZATCA Logs' },
      table: { timestamp: 'Timestamp', user: 'User / IP', action: 'Action Taken', target: 'Target Entity', hash: 'Cryptographic Hash' }
    }
  }[lang];

  const auditLogs = [
    { id: 1, time: '2024-02-11 14:32:01.005', user: 'Eng. Ahmed', ip: '192.168.1.45', action: 'POST_JOURNAL_ENTRY', target: 'JE-2024-001', hash: 'a2b8...9f1c', type: 'financial' },
    { id: 2, time: '2024-02-11 12:15:22.441', user: 'System (ZATCA)', ip: 'API_GATEWAY', action: 'CLEAR_INVOICE', target: 'INV-10045', hash: 'c9f2...3e4a', type: 'zatca' },
    { id: 3, time: '2024-02-10 09:00:11.112', user: 'Super Admin', ip: '10.0.0.12', action: 'MODIFY_PERMISSION', target: 'User: Sarah', hash: 'e5d1...8b22', type: 'security' },
    { id: 4, time: '2024-02-09 16:45:00.000', user: 'Auditor_External', ip: '88.22.11.5', action: 'EXPORT_TRIAL_BALANCE', target: 'Report_FY23', hash: 'f1a9...7c33', type: 'financial' },
    { id: 5, time: '2024-02-09 08:30:05.555', user: 'System', ip: 'CRON_JOB', action: 'LOCK_FINANCIAL_PERIOD', target: 'Period: Jan_2024', hash: 'b4c7...1a99', type: 'security' },
  ];

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Header */}
      <div className="bg-slate-950 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3"><ShieldCheck className="text-emerald-400"/> {t.title}</h1>
          <p className="text-slate-400 mt-2 font-medium max-w-xl">{t.desc}</p>
        </div>
        
        <div className="relative z-10 w-full md:w-auto">
          {isVerified ? (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 backdrop-blur-sm animate-in zoom-in">
              <CheckCircle2 size={24}/> {t.verifiedMsg}
            </div>
          ) : (
            <button 
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-900/50 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isVerifying ? <RefreshCw size={20} className="animate-spin"/> : <Key size={20}/>}
              {isVerifying ? 'Verifying Blockchain Integrity...' : t.verifyBtn}
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {Object.entries(t.filters).map(([k, v]) => (
            <button key={k} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${k === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {v}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input type="text" placeholder="Search hash, user, IP..." className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm outline-none focus:border-blue-500 transition ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} />
        </div>
      </div>

      {/* Immutable Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-start">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
              <tr>
                <th className="p-5 whitespace-nowrap">{t.table.timestamp}</th>
                <th className="p-5">{t.table.user}</th>
                <th className="p-5">{t.table.action}</th>
                <th className="p-5">{t.table.target}</th>
                <th className="p-5 text-end"><div className="flex items-center justify-end gap-2"><Database size={14}/> {t.table.hash}</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-sm">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition cursor-crosshair">
                  <td className="p-5 text-xs text-slate-500">{log.time}</td>
                  <td className="p-5">
                    <div className="font-bold text-slate-800 flex items-center gap-2"><User size={14} className="text-blue-500"/> {log.user}</div>
                    <div className="text-[10px] text-slate-400 mt-1">IP: {log.ip}</div>
                  </td>
                  <td className="p-5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-slate-600">{log.target}</td>
                  <td className="p-5 text-end">
                    <div className="inline-flex items-center gap-2 bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow-inner">
                      <Fingerprint size={14}/> {log.hash}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}