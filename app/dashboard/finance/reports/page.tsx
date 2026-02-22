'use client';

import { useState } from 'react';
import { 
  LineChart, FileText, Download, CalendarDays, TrendingUp, 
  TrendingDown, BrainCircuit, TableProperties, FileBarChart
} from 'lucide-react';
import { useDashboard } from '../../layout';

export default function ReportsPage() {
  const { lang } = useDashboard();
  const isRTL = lang === 'ar';

  const [reportType, setReportType] = useState('income_statement');
  const [period, setPeriod] = useState('q1_2024');
  const [isGenerating, setIsGenerating] = useState(false);

  const t = {
    ar: {
      title: 'التقارير المالية الذكية',
      desc: 'تحويل البيانات الخام إلى ذكاء تنفيذي لمتخذي القرار.',
      generate: 'توليد التقرير',
      exportPdf: 'تصدير PDF',
      exportExcel: 'تصدير Excel',
      types: {
        income_statement: 'قائمة الدخل (P&L)',
        balance_sheet: 'الميزانية العمومية',
        cash_flow: 'التدفقات النقدية',
        tax_zakat: 'تقارير الزكاة والضريبة (VAT)'
      },
      periods: { q1_2024: 'الربع الأول 2024', q4_2023: 'الربع الرابع 2023', fy_2023: 'السنة المالية 2023' },
      aiAnalysis: 'التحليل الاستراتيجي:',
      columns: { account: 'الحساب', actual: 'الفعلي (SAR)', budget: 'الموازنة (SAR)', variance: 'التباين' }
    },
    en: {
      title: 'Smart Financial Reports',
      desc: 'Transforming raw data into executive intelligence.',
      generate: 'Generate Report',
      exportPdf: 'Export PDF',
      exportExcel: 'Export Excel',
      types: {
        income_statement: 'Income Statement (P&L)',
        balance_sheet: 'Balance Sheet',
        cash_flow: 'Cash Flow',
        tax_zakat: 'Zakat & VAT Reports'
      },
      periods: { q1_2024: 'Q1 2024', q4_2023: 'Q4 2023', fy_2023: 'FY 2023' },
      aiAnalysis: 'Strategic Analysis:',
      columns: { account: 'Account', actual: 'Actual (SAR)', budget: 'Budget (SAR)', variance: 'Variance' }
    }
  }[lang];

  // Dynamic factor to simulate data changing
  const factor = period === 'fy_2023' ? 4 : period === 'q4_2023' ? 1.2 : 1;

  const [reportData, setReportData] = useState([
    { id: 1, account: lang === 'ar' ? 'الإيرادات التشغيلية' : 'Operating Revenue', actual: 12500000 * factor, budget: 12000000 * factor, isHeader: true },
    { id: 2, account: lang === 'ar' ? 'تكلفة المبيعات (COGS)' : 'Cost of Goods Sold', actual: -7500000 * factor, budget: -7200000 * factor, isHeader: false },
    { id: 3, account: lang === 'ar' ? 'إجمالي الربح' : 'Gross Profit', actual: 5000000 * factor, budget: 4800000 * factor, isHeader: true, highlight: true },
    { id: 4, account: lang === 'ar' ? 'مصروفات الرواتب' : 'Payroll Expenses', actual: -1200000 * factor, budget: -1200000 * factor, isHeader: false },
    { id: 5, account: lang === 'ar' ? 'مصروفات التسويق' : 'Marketing Expenses', actual: -450000 * factor, budget: -300000 * factor, isHeader: false }, // Over budget
    { id: 6, account: lang === 'ar' ? 'صافي الدخل التشغيلي' : 'Net Operating Income', actual: 3350000 * factor, budget: 3300000 * factor, isHeader: true, highlight: true },
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReportData([
        { id: 1, account: lang === 'ar' ? 'الإيرادات التشغيلية' : 'Operating Revenue', actual: 12500000 * factor, budget: 12000000 * factor, isHeader: true },
        { id: 2, account: lang === 'ar' ? 'تكلفة المبيعات (COGS)' : 'Cost of Goods Sold', actual: -7500000 * factor, budget: -7200000 * factor, isHeader: false },
        { id: 3, account: lang === 'ar' ? 'إجمالي الربح' : 'Gross Profit', actual: 5000000 * factor, budget: 4800000 * factor, isHeader: true, highlight: true },
        { id: 4, account: lang === 'ar' ? 'مصروفات الرواتب' : 'Payroll Expenses', actual: -1200000 * factor, budget: -1200000 * factor, isHeader: false },
        { id: 5, account: lang === 'ar' ? 'مصروفات التسويق' : 'Marketing Expenses', actual: -450000 * factor, budget: -300000 * factor, isHeader: false },
        { id: 6, account: lang === 'ar' ? 'صافي الدخل التشغيلي' : 'Net Operating Income', actual: 3350000 * factor, budget: 3300000 * factor, isHeader: true, highlight: true },
      ]);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FileBarChart className="text-blue-600" size={32}/> {t.title}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{t.desc}</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition">
            <Download size={16}/> {t.exportExcel}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg transition">
            <FileText size={16}/> {t.exportPdf}
          </button>
        </div>
      </div>

      {/* Report Builder Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500">
            {Object.entries(t.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500">
            {Object.entries(t.periods).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={isGenerating} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50">
          {isGenerating ? '...' : t.generate}
        </button>
      </div>

      {/* AI Intelligence Block */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/30 blur-3xl rounded-full"></div>
        <h3 className="font-bold flex items-center gap-2 mb-2 text-blue-400"><BrainCircuit size={18}/> {t.aiAnalysis}</h3>
        <p className="text-slate-300 leading-relaxed max-w-4xl text-sm">
          {lang === 'ar' 
            ? `بناءً على نتائج الفترة المحددة، تجاوزت مصروفات التسويق الموازنة المعتمدة بنسبة تفوق 50%. في المقابل، إجمالي الربح يظهر تحسناً بنسبة 4.1% بفضل كفاءة تكلفة المبيعات. يُنصح بمراجعة عقود التسويق للربع القادم.`
            : `Based on selected period results, marketing expenses exceeded budget by over 50%. Conversely, Gross Profit shows a 4.1% improvement driven by COGS efficiency. Reviewing marketing contracts for next quarter is advised.`}
        </p>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-start">
            <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="p-5">{t.columns.account}</th>
                <th className="p-5 text-end">{t.columns.actual}</th>
                <th className="p-5 text-end">{t.columns.budget}</th>
                <th className="p-5 text-end">{t.columns.variance}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map(row => {
                const variance = row.actual - row.budget;
                const variancePct = (variance / Math.abs(row.budget)) * 100;
                // Determine if variance is good or bad (revenue vs expense)
                const isExpense = row.budget < 0;
                const isFavorable = isExpense ? variance > 0 : variance > 0;

                return (
                  <tr key={row.id} className={`${row.isHeader ? 'bg-slate-50/50' : 'hover:bg-slate-50'} transition`}>
                    <td className={`p-5 ${row.isHeader ? 'font-black text-slate-900 text-base' : 'font-medium text-slate-600 pl-10 rtl:pr-10'}`}>
                      {row.account}
                    </td>
                    <td className={`p-5 text-end font-mono ${row.highlight ? 'font-black text-slate-900 text-lg border-t-2 border-slate-300' : 'text-slate-700'}`}>
                      {row.actual.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="p-5 text-end font-mono text-slate-500">
                      {row.budget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="p-5 text-end">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {isFavorable ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                        {Math.abs(variancePct).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}