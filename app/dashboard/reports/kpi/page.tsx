'use client';

import { useState, useEffect } from 'react';
import { 
  Target, TrendingDown, TrendingUp, AlertCircle, Calendar, 
  Filter, Download, Share2, Info, ChevronDown, ArrowUpRight, 
  ArrowDownRight, Loader2, Activity, ShieldAlert, BarChart3, 
  Globe, X, RefreshCw
} from 'lucide-react';

// --- Types ---
type TrendDirection = 'up' | 'down' | 'stable';
type KPIStatus = 'Excellent' | 'Stable' | 'Needs Improvement' | 'Critical';
type Category = 'Finance' | 'Delivery' | 'Quality' | 'Safety';

interface KPIData {
  id: string;
  title: string;
  category: Category;
  value: string;
  target: string;
  unit: string;
  status: KPIStatus;
  trendValue: string;
  trendDirection: TrendDirection;
  owner: string;
  lastUpdated: string;
  definition: string;
  breakdown: { label: string; value: number }[];
  history: { date: string; value: number }[];
}

export default function KPIPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [period, setPeriod] = useState('Feb 2026');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [selectedKPI, setSelectedKPI] = useState<KPIData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [filterProject, setFilterProject] = useState('All');

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setKpis([
        { 
          id: 'KPI-001', title: lang === 'ar' ? 'الالتزام بالميزانية' : 'Budget Adherence', 
          category: 'Finance', value: '94', unit: '%', target: '90', status: 'Excellent', 
          trendValue: '+4%', trendDirection: 'up', owner: 'Finance Dept', lastUpdated: '10 mins ago',
          definition: 'Actual spend vs planned budget ratio.',
          breakdown: [{ label: 'Material', value: 40 }, { label: 'Labor', value: 35 }, { label: 'Overhead', value: 25 }],
          history: [{ date: 'Jan', value: 90 }, { date: 'Feb', value: 94 }]
        },
        { 
          id: 'KPI-002', title: lang === 'ar' ? 'تسليم المشاريع في الوقت' : 'On-time Delivery', 
          category: 'Delivery', value: '82', unit: '%', target: '85', status: 'Needs Improvement', 
          trendValue: '-3%', trendDirection: 'down', owner: 'PMO', lastUpdated: '1 hour ago',
          definition: 'Percentage of milestones completed on or before due date.',
          breakdown: [{ label: 'Project A', value: 90 }, { label: 'Project B', value: 70 }],
          history: [{ date: 'Jan', value: 85 }, { date: 'Feb', value: 82 }]
        },
        { 
          id: 'KPI-003', title: lang === 'ar' ? 'رضا العملاء' : 'Client Satisfaction', 
          category: 'Quality', value: '4.8', unit: '/5', target: '4.5', status: 'Excellent', 
          trendValue: '+0.2', trendDirection: 'up', owner: 'Quality Dept', lastUpdated: 'Yesterday',
          definition: 'Average score from client feedback forms.',
          breakdown: [{ label: 'Service', value: 4.9 }, { label: 'Speed', value: 4.6 }, { label: 'Communication', value: 4.8 }],
          history: [{ date: 'Jan', value: 4.6 }, { date: 'Feb', value: 4.8 }]
        },
        { 
          id: 'KPI-004', title: lang === 'ar' ? 'حوادث السلامة' : 'Safety Incidents', 
          category: 'Safety', value: '0', unit: '', target: '0', status: 'Excellent', 
          trendValue: '0', trendDirection: 'stable', owner: 'HSE Dept', lastUpdated: 'Today',
          definition: 'Count of recordable safety incidents per month.',
          breakdown: [{ label: 'Near Miss', value: 2 }, { label: 'Injury', value: 0 }],
          history: [{ date: 'Jan', value: 0 }, { date: 'Feb', value: 0 }]
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang, period]);

  // --- Actions ---
  const handleOpenDrawer = (kpi: KPIData) => {
    setSelectedKPI(kpi);
    setIsDrawerOpen(true);
  };

  const handleExport = () => {
    alert(lang === 'ar' ? 'جاري تصدير تقرير المؤشرات (PDF)...' : 'Exporting KPI Report (PDF)...');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  // --- Helpers ---
  const getStatusColor = (status: KPIStatus) => {
    switch(status) {
        case 'Excellent': return 'bg-green-100 text-green-700 border-green-200';
        case 'Stable': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Needs Improvement': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTrendColor = (dir: TrendDirection) => {
      if (dir === 'up') return 'text-green-600';
      if (dir === 'down') return 'text-red-600';
      return 'text-slate-500';
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Command Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Target className="text-red-600" />
              {lang === 'ar' ? 'مؤشرات الأداء الرئيسية (KPIs)' : 'Strategic KPIs & Governance'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'لوحة القيادة الاستراتيجية لمراقبة الأداء المؤسسي والحوكمة' : 'Strategic dashboard for corporate performance monitoring and governance'}
            </p>
          </div>
          
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <div className="bg-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-slate-200">
                <Calendar size={14} className="text-slate-500"/>
                <span className="text-xs font-bold text-slate-700">{period}</span>
                <ChevronDown size={14} className="text-slate-400 cursor-pointer"/>
             </div>
             <button onClick={handleRefresh} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition" title="Refresh">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
             </button>
             <button onClick={handleExport} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> {lang === 'ar' ? 'تصدير التقرير' : 'Export Report'}
             </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-1">
            {['All Projects', 'Al-Wurud', 'Sector 7', 'Main HQ'].map(f => (
                <button 
                    key={f} 
                    onClick={() => setFilterProject(f)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${filterProject === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* --- Section 2: KPI Grid --- */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحليل المؤشرات...' : 'Analyzing KPIs...'}</div>
        ) : kpis.map(kpi => (
            <div 
                key={kpi.id} 
                onClick={() => handleOpenDrawer(kpi)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 cursor-pointer transition group relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">{kpi.category}</span>
                        <h3 className="font-bold text-slate-800 text-sm mt-2 group-hover:text-blue-700 transition">{kpi.title}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${getStatusColor(kpi.status)}`}>
                        {kpi.status}
                    </span>
                </div>

                {/* Value */}
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black text-slate-900">{kpi.value}<span className="text-lg text-slate-400 font-medium ml-1">{kpi.unit}</span></span>
                </div>
                
                {/* Target & Trend */}
                <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-50 mt-4">
                    <div className="text-slate-500">
                        {lang === 'ar' ? 'الهدف:' : 'Target:'} <span className="font-bold text-slate-700">{kpi.target}{kpi.unit}</span>
                    </div>
                    <div className={`flex items-center gap-1 font-bold ${getTrendColor(kpi.trendDirection)}`}>
                        {kpi.trendDirection === 'up' ? <TrendingUp size={14}/> : kpi.trendDirection === 'down' ? <TrendingDown size={14}/> : <Activity size={14}/>}
                        {kpi.trendValue}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* --- Section 3: Analytics & Governance (Visual Placeholder for Real Charts) --- */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      <BarChart3 className="text-blue-600"/> {lang === 'ar' ? 'تحليل الاتجاهات' : 'Trend Analysis'}
                  </h3>
                  <select className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 outline-none">
                      <option>Last 30 Days</option>
                      <option>Last Quarter</option>
                  </select>
              </div>
              <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                  {lang === 'ar' ? 'مخطط بياني تفاعلي (سيتم ربطه بالبيانات الحقيقية)' : 'Interactive Chart (Data Binding)'}
              </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldAlert className="text-amber-600"/> {lang === 'ar' ? 'ملخص المخاطر' : 'Risk Summary'}
              </h3>
              <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="text-xs font-bold text-red-800 mb-1">{lang === 'ar' ? 'تجاوز الميزانية' : 'Budget Drift'}</div>
                      <p className="text-xs text-red-600">Project B is 4% over budget due to material costs.</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="text-xs font-bold text-amber-800 mb-1">{lang === 'ar' ? 'تأخير التسليم' : 'Delivery Delay'}</div>
                      <p className="text-xs text-amber-600">Site 4 timeline at risk due to permit delays.</p>
                  </div>
              </div>
              <button className="w-full mt-4 py-2 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100 border border-slate-200">
                  {lang === 'ar' ? 'عرض سجل المخاطر' : 'View Risk Register'}
              </button>
          </div>
      </div>

      {/* --- Section 4: KPI Detail Drawer --- */}
      {isDrawerOpen && selectedKPI && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{selectedKPI.category}</div>
                        <h3 className="font-bold text-lg text-slate-800">{selectedKPI.title}</h3>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {/* Main Metric */}
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-5xl font-black text-slate-900 mb-2">{selectedKPI.value}<span className="text-2xl text-slate-400">{selectedKPI.unit}</span></div>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${getTrendColor(selectedKPI.trendDirection)} bg-white shadow-sm border border-slate-100`}>
                            {selectedKPI.trendDirection === 'up' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            {selectedKPI.trendValue} vs prev. period
                        </div>
                    </div>

                    {/* Definition */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-sm">{lang === 'ar' ? 'التعريف والمصدر' : 'Definition & Source'}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100">{selectedKPI.definition}</p>
                    </div>

                    {/* Breakdown */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 text-sm">{lang === 'ar' ? 'توزيع الأداء' : 'Performance Breakdown'}</h4>
                        <div className="space-y-3">
                            {selectedKPI.breakdown.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">{item.label}</span>
                                    <div className="flex items-center gap-3 flex-1 justify-end">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-800 rounded-full" style={{ width: `${item.value}%` }}></div>
                                        </div>
                                        <span className="font-bold text-slate-900 w-8 text-right">{item.value}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Owner & Meta */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                            <div className="text-xs text-slate-400 mb-1">{lang === 'ar' ? 'المسؤول' : 'Owner'}</div>
                            <div className="text-sm font-bold text-slate-800">{selectedKPI.owner}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 mb-1">{lang === 'ar' ? 'آخر تحديث' : 'Last Updated'}</div>
                            <div className="text-sm font-bold text-slate-800">{selectedKPI.lastUpdated}</div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => setIsDrawerOpen(false)} className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100">
                        {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}