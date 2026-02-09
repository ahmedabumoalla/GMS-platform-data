'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, 
  Search, Filter, FileText, Eye, AlertOctagon, 
  Activity, Calendar, User, ShieldAlert, X, FileBadge, Globe
} from 'lucide-react';
// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout';

// --- Types ---
type InspectionStatus = 'Scheduled' | 'Conducted' | 'Under Review' | 'Passed' | 'Failed' | 'Closed';
type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

interface Inspection {
  id: string;
  project: string;
  type: string;
  inspector: string;
  date: string;
  status: InspectionStatus;
  score: number;
  severity?: Severity;
  standards: string;
  notes: string;
  attachments: number;
  correctiveAction?: string;
}

export default function QualityPage() {
  // ✅ استخدام اللغة من النظام العام
  const { lang } = useDashboard();
  
  const [activeTab, setActiveTab] = useState<'All' | InspectionStatus>('All');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Detail States
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true); // إعادة تفعيل اللودينج عند تغيير اللغة
    setTimeout(() => {
      setInspections([
        { 
          id: 'INS-2024-101', project: lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project', 
          type: lang === 'ar' ? 'فحص قوة الخرسانة' : 'Concrete Strength Test', 
          status: 'Passed', inspector: 'Eng. Omar Farouk', date: '2024-02-05', score: 98,
          standards: 'ASTM C39 / SASO 202', 
          notes: lang === 'ar' ? 'النتائج مطابقة للمواصفات القياسية. العينات تجاوزت الحد الأدنى للتحمل.' : 'Results compliant with standards. Samples exceeded minimum endurance.',
          attachments: 3 
        },
        { 
          id: 'INS-2024-102', project: lang === 'ar' ? 'تمديدات الكهرباء' : 'Electrical Wiring', 
          type: lang === 'ar' ? 'اختبار الجهد العالي' : 'High Voltage Test', 
          status: 'Failed', inspector: 'Saeed Al-Qahtani', date: '2024-02-04', score: 45, severity: 'Critical',
          standards: 'IEC 60502 / SEC Standards', 
          notes: lang === 'ar' ? 'انخفاض حاد في العزل عند النقطة ب. خطر التماس كهربائي.' : 'Severe insulation drop at point B. Short circuit risk.',
          attachments: 5, 
          correctiveAction: lang === 'ar' ? 'استبدال الكابل المتضرر بالكامل وإعادة الفحص.' : 'Replace damaged cable and re-test.'
        },
        { 
          id: 'INS-2024-103', project: lang === 'ar' ? 'محطة الضخ' : 'Pumping Station', 
          type: lang === 'ar' ? 'فحص سلامة المعدات' : 'Equipment Safety Check', 
          status: 'Under Review', inspector: 'Yasser Al-Harbi', date: '2024-02-03', score: 75, severity: 'Medium',
          standards: 'OSHA 1910 / ISO 45001', 
          notes: lang === 'ar' ? 'بعض صمامات الأمان تحتاج لمعايرة. تم طلب تقرير المعايرة من المقاول.' : 'Some safety valves need calibration. Calibration report requested.',
          attachments: 2 
        },
        { 
          id: 'INS-2024-104', project: lang === 'ar' ? 'مشروع الاتصالات' : 'Telecom Project', 
          type: lang === 'ar' ? 'فحص الألياف الضوئية' : 'Fiber Optic Check', 
          status: 'Scheduled', inspector: 'Mohammed Ali', date: '2024-02-10', score: 0,
          standards: 'ITU-T G.652', 
          notes: lang === 'ar' ? 'موعد الفحص المجدول.' : 'Scheduled inspection date.',
          attachments: 0 
        },
      ]);
      setLoading(false);
    }, 600);
  }, [lang]); // ✅ التحديث عند تغيير اللغة

  // --- Actions ---
  const handleDownloadReport = () => {
    alert(lang === 'ar' ? 'جاري تحميل تقرير الجودة الشامل...' : 'Downloading Comprehensive QC Report...');
  };

  const handleCreateNCR = () => {
    alert(lang === 'ar' ? 'تم إنشاء تذكرة صيانة (NCR) وإسنادها للمقاول.' : 'Non-Conformance Report (NCR) created and assigned.');
  };

  const handleUpdateStatus = (id: string, newStatus: InspectionStatus) => {
    const confirmMsg = newStatus === 'Passed' 
      ? (lang === 'ar' ? 'هل أنت متأكد من اعتماد هذا الفحص؟' : 'Approve this inspection?')
      : (lang === 'ar' ? 'هل أنت متأكد من رفض هذا الفحص؟' : 'Reject this inspection?');

    if (confirm(confirmMsg)) {
        setInspections(prev => prev.map(ins => ins.id === id ? { ...ins, status: newStatus } : ins));
        setIsDetailsOpen(false); // إغلاق النافذة بعد التحديث
    }
  };

  // --- Helpers ---
  const getStatusBadge = (status: InspectionStatus) => {
    switch(status) {
        case 'Passed': return <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-lg text-xs font-bold border border-green-200"><CheckCircle2 size={14}/> {lang === 'ar' ? 'ناجح' : 'Passed'}</span>;
        case 'Failed': return <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-200"><XCircle size={14}/> {lang === 'ar' ? 'راسب' : 'Failed'}</span>;
        case 'Under Review': return <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200"><AlertTriangle size={14}/> {lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}</span>;
        case 'Scheduled': return <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200"><Calendar size={14}/> {lang === 'ar' ? 'مجدول' : 'Scheduled'}</span>;
        default: return <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200"><Activity size={14}/> {status}</span>;
    }
  };

  const getSeverityColor = (severity?: Severity) => {
    if (!severity) return '';
    switch(severity) {
        case 'Critical': return 'text-red-600 bg-red-100 border-red-200';
        case 'High': return 'text-orange-600 bg-orange-100 border-orange-200';
        case 'Medium': return 'text-amber-600 bg-amber-100 border-amber-200';
        default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const filteredInspections = inspections.filter(ins => activeTab === 'All' ? true : ins.status === activeTab);

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Overview Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="text-blue-600" />
              {lang === 'ar' ? 'مراقبة الجودة والتفتيش' : 'Quality Control & Inspection'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'نظام حوكمة الفحص والامتثال للمواصفات' : 'Inspection governance and compliance system'}
            </p>
          </div>
          <div className="flex gap-2">
             {/* تم إزالة زر تبديل اللغة */}
             <button 
                onClick={handleDownloadReport}
                className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95"
             >
                <FileBadge size={16}/> {lang === 'ar' ? 'تقرير الجودة' : 'QC Report'}
             </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'إجمالي الفحوصات' : 'Total Inspections'} value={inspections.length} color="blue" icon={FileText} />
            <StatCard label={lang === 'ar' ? 'نسبة النجاح' : 'Success Rate'} value="82%" color="green" icon={Activity} />
            <StatCard label={lang === 'ar' ? 'مخالفات حرجة' : 'Critical Defects'} value={inspections.filter(i => i.severity === 'Critical').length} color="red" icon={AlertOctagon} />
            <StatCard label={lang === 'ar' ? 'قيد المراجعة' : 'Under Review'} value={inspections.filter(i => i.status === 'Under Review').length} color="amber" icon={Search} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                {['All', 'Passed', 'Failed', 'Under Review', 'Scheduled'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab === 'All' ? (lang === 'ar' ? 'الكل' : 'All') : tab}
                    </button>
                ))}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder={lang === 'ar' ? 'بحث برقم الفحص، المشروع...' : 'Search ID, Project...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                    <Filter size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* --- Section 2: Inspections Table --- */}
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                        <th className="p-5">{lang === 'ar' ? 'رقم الفحص' : 'Inspection ID'}</th>
                        <th className="p-5">{lang === 'ar' ? 'المشروع & النوع' : 'Project & Type'}</th>
                        <th className="p-5">{lang === 'ar' ? 'المفتش' : 'Inspector'}</th>
                        <th className="p-5">{lang === 'ar' ? 'النتيجة' : 'Score'}</th>
                        <th className="p-5">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="p-5 text-end">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading...</td></tr>
                    ) : filteredInspections.map(ins => (
                        <tr key={ins.id} className="hover:bg-slate-50 transition group cursor-default">
                            <td className="p-5 font-mono text-xs text-slate-500 font-bold">{ins.id}</td>
                            <td className="p-5">
                                <div className="font-bold text-slate-800 text-sm">{ins.project}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{ins.type}</div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <User size={14} className="text-slate-400"/> {ins.inspector}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{ins.date}</div>
                            </td>
                            <td className="p-5">
                                {ins.status !== 'Scheduled' ? (
                                    <span className={`font-black text-sm ${ins.score >= 90 ? 'text-green-600' : ins.score >= 70 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {ins.score}%
                                    </span>
                                ) : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(ins.status)}
                                    {ins.severity && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getSeverityColor(ins.severity)}`}>
                                            <AlertTriangle size={10}/> {ins.severity}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-5 text-end">
                                <button 
                                    onClick={() => { setSelectedInspection(ins); setIsDetailsOpen(true); }}
                                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                                >
                                    <Eye size={14}/> {lang === 'ar' ? 'عرض' : 'View'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- Section 3: Detailed Drill-Down Modal --- */}
      {isDetailsOpen && selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{selectedInspection.id}</span>
                            {getStatusBadge(selectedInspection.status)}
                        </div>
                        <h3 className="font-bold text-xl text-slate-900">{selectedInspection.type}</h3>
                        <p className="text-xs text-slate-500 font-medium">{selectedInspection.project}</p>
                    </div>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-lg transition"><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    
                    {/* Score & Standards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'الدرجة المقاسة' : 'Measured Score'}</div>
                            <div className={`text-2xl font-black ${selectedInspection.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedInspection.score}%
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'المعيار المرجعي' : 'Standard Ref'}</div>
                            <div className="text-sm font-bold text-slate-800">{selectedInspection.standards}</div>
                        </div>
                    </div>

                    {/* Inspector Notes */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-blue-600"/> {lang === 'ar' ? 'ملاحظات المفتش' : 'Inspector Notes'}
                        </h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                            {selectedInspection.notes}
                        </div>
                    </div>

                    {/* Corrective Action (If Failed) */}
                    {selectedInspection.status === 'Failed' && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                                <ShieldAlert size={16}/> {lang === 'ar' ? 'الإجراء التصحيحي المطلوب' : 'Required Corrective Action'}
                            </h4>
                            <p className="text-sm text-red-700 leading-relaxed">{selectedInspection.correctiveAction}</p>
                            
                            {/* زر إنشاء NCR */}
                            <button 
                                onClick={handleCreateNCR}
                                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition w-full active:scale-95"
                            >
                                {lang === 'ar' ? 'إنشاء تذكرة صيانة (NCR)' : 'Create Non-Conformance Report'}
                            </button>
                        </div>
                    )}

                    {/* Attachments */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3">{lang === 'ar' ? 'المرفقات والأدلة' : 'Evidence & Attachments'}</h4>
                        <div className="flex gap-3">
                            {[...Array(selectedInspection.attachments)].map((_, i) => (
                                <div key={i} className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition">
                                    <FileText size={24} />
                                    <span className="text-[10px] mt-1 font-bold">Doc {i+1}</span>
                                </div>
                            ))}
                            {selectedInspection.attachments === 0 && <span className="text-xs text-slate-400 italic">No attachments</span>}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button onClick={() => setIsDetailsOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">
                        {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    
                    {selectedInspection.status === 'Under Review' && (
                        <>
                            <button 
                                onClick={() => handleUpdateStatus(selectedInspection.id, 'Failed')}
                                className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition active:scale-95"
                            >
                                {lang === 'ar' ? 'رفض' : 'Reject'}
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus(selectedInspection.id, 'Passed')}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg transition active:scale-95"
                            >
                                {lang === 'ar' ? 'اعتماد' : 'Approve'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// ... (StatCard Component remains the same)
function StatCard({ label, value, color, icon: Icon }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs font-bold text-slate-400">{label}</div>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}