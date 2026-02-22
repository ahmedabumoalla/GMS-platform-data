'use client';

import { useState, useEffect } from 'react';
import { 
  Landmark, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Search, Filter, Plus, CalendarDays, BrainCircuit, 
  CheckCircle2, AlertTriangle, Wallet, CreditCard, Building2, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout';

export default function TreasuryPage() {
  const { lang } = useDashboard();
  const isRTL = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'overview' | 'reconciliation'>('overview');
  const [period, setPeriod] = useState('this_month');
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [reconciledCount, setReconciledCount] = useState(0);

  const t = {
    ar: {
      title: 'النقد والخزينة',
      desc: 'إدارة السيولة، الحسابات البنكية، والمطابقة الذكية للتدفقات النقدية.',
      totalCash: 'إجمالي النقد المتاح',
      inflow: 'التدفقات الداخلة',
      outflow: 'التدفقات الخارجة',
      aiForecast: 'توقع السيولة (30 يوم)',
      tabs: { overview: 'نظرة عامة على الحسابات', recon: 'المطابقة البنكية (Reconciliation)' },
      periods: { today: 'اليوم', week: 'هذا الأسبوع', this_month: 'هذا الشهر', quarter: 'الربع الحالي' },
      banks: 'الحسابات البنكية المربوطة',
      reconTitle: 'الحركات المعلقة للمطابقة',
      runAiMatch: 'مطابقة ذكية بالذكاء الاصطناعي',
      matchedSuccess: 'تمت مطابقة السجلات بنجاح',
      table: { date: 'التاريخ', desc: 'البيان', amount: 'المبلغ', type: 'النوع', action: 'إجراء' },
    },
    en: {
      title: 'Cash & Treasury',
      desc: 'Liquidity management, bank accounts, and smart cash flow reconciliation.',
      totalCash: 'Total Available Cash',
      inflow: 'Cash Inflow',
      outflow: 'Cash Outflow',
      aiForecast: 'Liquidity Forecast (30 Days)',
      tabs: { overview: 'Accounts Overview', recon: 'Bank Reconciliation' },
      periods: { today: 'Today', week: 'This Week', this_month: 'This Month', quarter: 'This Quarter' },
      banks: 'Connected Bank Accounts',
      reconTitle: 'Pending Transactions for Match',
      runAiMatch: 'Run AI Smart Match',
      matchedSuccess: 'Records matched successfully',
      table: { date: 'Date', desc: 'Description', amount: 'Amount', type: 'Type', action: 'Action' },
    }
  }[lang];

  // Dynamic values based on period selection to simulate real data logic
  const multiplier = period === 'today' ? 0.1 : period === 'week' ? 0.25 : period === 'this_month' ? 1 : 3;

  const [pendingTrans, setPendingTrans] = useState([
    { id: 'TRX-01', date: '2024-02-11', desc: 'دفعة العميل - شركة أرامكو', amount: 150000 * multiplier, type: 'in' },
    { id: 'TRX-02', date: '2024-02-10', desc: 'رسوم صيانة سحابة AWS', amount: 12500 * multiplier, type: 'out' },
    { id: 'TRX-03', date: '2024-02-09', desc: 'تحويل رواتب شهر يناير', amount: 450000 * multiplier, type: 'out' },
    { id: 'TRX-04', date: '2024-02-08', desc: 'تمويل المشروع B', amount: 300000 * multiplier, type: 'in' },
  ]);

  useEffect(() => {
    // Reset data when period changes
    setReconciledCount(0);
    setPendingTrans([
      { id: 'TRX-01', date: '2024-02-11', desc: 'دفعة العميل - شركة أرامكو', amount: 150000 * multiplier, type: 'in' },
      { id: 'TRX-02', date: '2024-02-10', desc: 'رسوم صيانة سحابة AWS', amount: 12500 * multiplier, type: 'out' },
      { id: 'TRX-03', date: '2024-02-09', desc: 'تحويل رواتب شهر يناير', amount: 450000 * multiplier, type: 'out' },
      { id: 'TRX-04', date: '2024-02-08', desc: 'تمويل المشروع B', amount: 300000 * multiplier, type: 'in' },
    ]);
  }, [period]);

  const handleAiMatch = () => {
    setIsAiMatching(true);
    setTimeout(() => {
      setPendingTrans([]);
      setReconciledCount(4);
      setIsAiMatching(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3"><Landmark className="text-blue-400"/> {t.title}</h1>
            <p className="text-slate-400 mt-2 font-medium">{t.desc}</p>
          </div>
          <div className="flex gap-3 items-center bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-md">
            <CalendarDays size={18} className="text-slate-400 ml-2"/>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-transparent text-white font-bold outline-none cursor-pointer text-sm pr-4">
              {Object.entries(t.periods).map(([k, v]) => <option key={k} value={k} className="text-slate-900">{v}</option>)}
            </select>
          </div>
        </div>

        {/* Global Liquidity KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 relative z-10">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.totalCash}</div>
            <div className="text-3xl font-mono font-black text-white">{(12450000 * multiplier).toLocaleString('en-US')} <span className="text-sm font-normal opacity-50">SAR</span></div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><ArrowUpRight size={14}/> {t.inflow}</div>
            <div className="text-2xl font-mono font-black text-emerald-500">+{(850000 * multiplier).toLocaleString('en-US')}</div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><ArrowDownRight size={14}/> {t.outflow}</div>
            <div className="text-2xl font-mono font-black text-rose-500">-{(462500 * multiplier).toLocaleString('en-US')}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-md">
            <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><BrainCircuit size={14}/> {t.aiForecast}</div>
            <div className="text-2xl font-mono font-black text-blue-400">Stable</div>
            <div className="text-[10px] text-blue-300/70 mt-1">Projected positive variance of 12%</div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          {t.tabs.overview}
        </button>
        <button onClick={() => setActiveTab('reconciliation')} className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'reconciliation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          {t.tabs.recon}
          {pendingTrans.length > 0 && <span className="bg-rose-100 text-rose-600 py-0.5 px-2 rounded-full text-[10px]">{pendingTrans.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BankCard name="Al Rajhi Bank" acc="**** 8832" type="Corporate Current" balance={8500000 * multiplier} color="blue"/>
            <BankCard name="SNB (AlAhli)" acc="**** 1099" type="Payroll Account" balance={1250000 * multiplier} color="emerald"/>
            <BankCard name="Riyad Bank" acc="**** 4421" type="Investment" balance={2700000 * multiplier} color="purple"/>
          </motion.div>
        )}

        {activeTab === 'reconciliation' && (
          <motion.div key="recon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><RefreshCw size={18} className="text-blue-600"/> {t.reconTitle}</h3>
              <button 
                onClick={handleAiMatch}
                disabled={isAiMatching || pendingTrans.length === 0}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <BrainCircuit size={16} className={isAiMatching ? 'animate-pulse text-blue-400' : ''}/>
                {isAiMatching ? 'Processing...' : t.runAiMatch}
              </button>
            </div>

            {reconciledCount > 0 && pendingTrans.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={40}/>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{t.matchedSuccess}</h3>
                <p className="text-slate-500 font-medium">AI successfully reconciled {reconciledCount} transactions with the general ledger.</p>
              </div>
            ) : (
              <table className="w-full text-start">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">{t.table.date}</th>
                    <th className="p-4">{t.table.desc}</th>
                    <th className="p-4">{t.table.type}</th>
                    <th className="p-4 text-end">{t.table.amount}</th>
                    <th className="p-4 text-center">{t.table.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingTrans.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-sm font-mono text-slate-500">{trx.date}</td>
                      <td className="p-4 text-sm font-bold text-slate-800">{trx.desc}</td>
                      <td className="p-4">
                        {trx.type === 'in' ? <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowDownRight size={14}/> Inflow</span> : <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit"><ArrowUpRight size={14}/> Outflow</span>}
                      </td>
                      <td className="p-4 text-end font-mono font-bold text-slate-900">{trx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-center">
                        <button className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">Match Manually</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BankCard({ name, acc, type, balance, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-2 ${colors[color].split(' ')[0]}`}></div>
      <div className="flex justify-between items-start mb-6 pt-2">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Building2 size={24}/>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{type}</div>
          <div className="font-mono font-bold text-slate-700">{acc}</div>
        </div>
      </div>
      <h3 className="font-black text-xl text-slate-900 mb-1">{name}</h3>
      <div className="text-3xl font-mono font-black text-slate-800 mt-4">{balance.toLocaleString('en-US')} <span className="text-sm text-slate-400">SAR</span></div>
    </div>
  );
}