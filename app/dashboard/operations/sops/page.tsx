'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, FileText, Download, Eye, ShieldCheck, Zap, 
  Search, Filter, CheckCircle2, History, 
  AlertTriangle, FileBadge, Globe, ArrowRight, List,
  Plus, Trash2, X, Save, UploadCloud
} from 'lucide-react';
// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout'; 

// --- Types ---
type SOPStatus = 'Draft' | 'Approved' | 'Archived' | 'Under Review';
type Category = 'Safety' | 'Operations' | 'HR' | 'Quality' | 'Forms';

interface SOP {
  id: string;
  code: string;
  title: string;
  category: Category;
  version: string;
  status: SOPStatus;
  updatedAt: string;
  author: string;
  description: string;
  scope: string;
  roles: string[];
  safetyReqs: string[];
  fileType: 'PDF' | 'DOCX' | 'XLSX';
  fileSize: string;
  fileName: string;
}

export default function SOPsPage() {
  // ✅ استخدام اللغة من النظام العام
  const { lang } = useDashboard();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New SOP Form State
  const [newSOP, setNewSOP] = useState<{
    title: string;
    category: Category;
    description: string;
    scope: string;
    roles: string; // Comma separated for input
    safetyReqs: string; // Comma separated for input
    file: File | null;
  }>({
    title: '',
    category: 'Operations',
    description: '',
    scope: '',
    roles: '',
    safetyReqs: '',
    file: null
  });

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true); // إعادة تفعيل اللودينج عند تغيير اللغة
    setTimeout(() => {
      setSops([
        { 
          id: 'SOP-001', code: 'SOP-SAF-01', title: lang === 'ar' ? 'دليل السلامة في المواقع الإنشائية' : 'Site Safety Manual',
          category: 'Safety', version: 'V2.1', status: 'Approved', updatedAt: '2024-02-01', author: 'Safety Dept',
          description: lang === 'ar' ? 'الإجراءات القياسية للعمل الآمن في المواقع الإنشائية والتعامل مع المخاطر.' : 'Standard procedures for safe work in construction sites.',
          scope: 'All active construction sites', roles: ['Site Engineer', 'Safety Officer', 'Workers'],
          safetyReqs: ['PPE Required', 'Daily Briefing', 'Fall Protection'], fileType: 'PDF', fileSize: '2.4 MB', fileName: 'safety_manual_v2.pdf'
        },
        { 
          id: 'SOP-002', code: 'SOP-OPS-04', title: lang === 'ar' ? 'إجراءات تشغيل المولدات' : 'Generator Ops Procedure',
          category: 'Operations', version: 'V1.0', status: 'Under Review', updatedAt: '2024-02-05', author: 'Eng. Ahmed',
          description: lang === 'ar' ? 'خطوات التشغيل والصيانة الدورية للمولدات الكهربائية في المواقع.' : 'Steps for operation and routine maintenance of generators.',
          scope: 'Maintenance Team', roles: ['Technician', 'Supervisor'],
          safetyReqs: ['High Voltage Training', 'Insulated Gloves'], fileType: 'PDF', fileSize: '1.1 MB', fileName: 'gen_ops_v1.pdf'
        },
        { 
          id: 'SOP-003', code: 'SOP-HR-09', title: lang === 'ar' ? 'لائحة الجزاءات والمخالفات' : 'Penalties Regulation',
          category: 'HR', version: 'V3.0', status: 'Approved', updatedAt: '2024-01-20', author: 'HR Manager',
          description: lang === 'ar' ? 'لائحة تنظيم العمل والجزاءات المعتمدة من وزارة الموارد البشرية.' : 'Work regulation and penalties list.',
          scope: 'All Employees', roles: ['HR', 'Managers'],
          safetyReqs: [], fileType: 'PDF', fileSize: '5.0 MB', fileName: 'hr_regulations.pdf'
        },
      ]);
      setLoading(false);
    }, 600);
  }, [lang]); // ✅ التحديث عند تغيير اللغة

  // --- Actions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewSOP({ ...newSOP, file: e.target.files[0] });
    }
  };

  const handleSaveSOP = () => {
    if (!newSOP.title || !newSOP.description || !newSOP.file) {
        alert(lang === 'ar' ? 'يرجى تعبئة جميع الحقول وإرفاق الملف' : 'Please fill all fields and upload a file');
        return;
    }
    
    const createdSOP: SOP = {
        id: `SOP-${Math.floor(Math.random() * 1000)}`,
        code: `SOP-${newSOP.category.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 100)}`,
        title: newSOP.title,
        category: newSOP.category,
        version: 'V1.0',
        status: 'Draft',
        updatedAt: new Date().toISOString().split('T')[0],
        author: lang === 'ar' ? 'مستخدم حالي' : 'Current User',
        description: newSOP.description,
        scope: newSOP.scope || 'General',
        roles: newSOP.roles.split(',').map(s => s.trim()).filter(s => s !== ''),
        safetyReqs: newSOP.safetyReqs.split(',').map(s => s.trim()).filter(s => s !== ''),
        fileType: 'PDF', // Simulated
        fileSize: (newSOP.file.size / 1024 / 1024).toFixed(2) + ' MB',
        fileName: newSOP.file.name
    };

    setSops([createdSOP, ...sops]);
    setIsUploadOpen(false);
    setNewSOP({ title: '', category: 'Operations', description: '', scope: '', roles: '', safetyReqs: '', file: null });
  };

  const handleDeleteSOP = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من أرشفة هذا الإجراء؟' : 'Archive this SOP?')) {
        setSops(sops.map(s => s.id === id ? { ...s, status: 'Archived' } : s));
        setIsDetailsOpen(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: SOPStatus) => {
    setSops(sops.map(s => s.id === id ? { ...s, status: newStatus } : s));
    if (selectedSOP && selectedSOP.id === id) {
        setSelectedSOP({ ...selectedSOP, status: newStatus });
    }
  };

  // --- Helpers ---
  const getCategoryColor = (cat: Category) => {
    switch(cat) {
        case 'Safety': return 'text-green-600 bg-green-50 border-green-100';
        case 'Operations': return 'text-blue-600 bg-blue-50 border-blue-100';
        case 'HR': return 'text-purple-600 bg-purple-50 border-purple-100';
        case 'Quality': return 'text-amber-600 bg-amber-50 border-amber-100';
        default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusBadge = (status: SOPStatus) => {
    switch(status) {
        case 'Approved': return <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200"><CheckCircle2 size={10}/> {status}</span>;
        case 'Draft': return <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200"><FileText size={10}/> {status}</span>;
        case 'Under Review': return <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200"><History size={10}/> {status}</span>;
        default: return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200"><AlertTriangle size={10}/> {status}</span>;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: SOP Library Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="text-blue-600" />
              {lang === 'ar' ? 'مكتبة الإجراءات القياسية (SOPs)' : 'SOPs Library & Governance'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'المرجع الموحد للسياسات، أدلة التشغيل، وبروتوكولات السلامة' : 'Central repository for operational procedures, safety protocols, and policies'}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsUploadOpen(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Plus size={16}/> {lang === 'ar' ? 'إجراء جديد' : 'New SOP'}
             </button>
          </div>
        </div>

        {/* Filters & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-3">
                <StatBadge label={lang === 'ar' ? 'إجمالي الوثائق' : 'Total Docs'} value={sops.length} icon={FileText} color="blue"/>
                <StatBadge label={lang === 'ar' ? 'معتمد' : 'Approved'} value={sops.filter(s => s.status === 'Approved').length} icon={CheckCircle2} color="green"/>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder={lang === 'ar' ? 'بحث بالعنوان، الكود...' : 'Search title, code...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                    <Filter size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* --- Section 2: SOP Cards --- */}
      <div className="p-6">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل المكتبة...' : 'Loading library...'}</div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {sops.map((sop) => (
                    <div key={sop.id} onClick={() => { setSelectedSOP(sop); setIsDetailsOpen(true); }} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer relative overflow-hidden">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${sop.status === 'Approved' ? 'bg-green-500' : 'bg-slate-300'}`}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl border ${getCategoryColor(sop.category)}`}>
                                {sop.category === 'Safety' && <ShieldCheck size={20}/>}
                                {sop.category === 'Operations' && <Zap size={20}/>}
                                {sop.category === 'HR' && <BookOpen size={20}/>}
                                {(sop.category === 'Quality' || sop.category === 'Forms') && <FileBadge size={20}/>}
                            </div>
                            <div className="text-right">
                                {getStatusBadge(sop.status)}
                                <div className="text-[10px] text-slate-400 mt-1 font-mono">{sop.code}</div>
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight group-hover:text-blue-700 transition line-clamp-2 h-14">
                            {sop.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                            <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{sop.version}</span>
                            <span>• {sop.updatedAt}</span>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase">{sop.fileType}</span>
                                <span className="text-[10px] text-slate-400">{sop.fileSize}</span>
                            </div>
                            <div className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                                <ArrowRight size={16} className={lang === 'ar' ? 'rotate-180' : ''}/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- Section 3: Detailed SOP Modal --- */}
      {isDetailsOpen && selectedSOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{selectedSOP.code}</span>
                            {getStatusBadge(selectedSOP.status)}
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{selectedSOP.category}</span>
                        </div>
                        <h3 className="font-bold text-2xl text-slate-900">{selectedSOP.title}</h3>
                    </div>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-lg transition"><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    {/* Meta Grid */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'الإصدار' : 'Version'}</div>
                            <div className="font-mono font-bold text-slate-800">{selectedSOP.version}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'تاريخ التحديث' : 'Last Updated'}</div>
                            <div className="font-bold text-slate-800">{selectedSOP.updatedAt}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'المؤلف' : 'Author'}</div>
                            <div className="font-bold text-slate-800">{selectedSOP.author}</div>
                        </div>
                    </div>

                    {/* Description & Scope */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2 border-b pb-2">{lang === 'ar' ? 'الوصف والنطاق' : 'Description & Scope'}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">{selectedSOP.description}</p>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                            <span className="font-bold">{lang === 'ar' ? 'النطاق:' : 'Scope:'}</span> {selectedSOP.scope}
                        </div>
                    </div>

                    {/* Roles & Requirements */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-2 border-b pb-2">{lang === 'ar' ? 'الأدوار والمسؤوليات' : 'Roles & Responsibilities'}</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                {selectedSOP.roles.map((role, i) => <li key={i}>{role}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-2 border-b pb-2">{lang === 'ar' ? 'متطلبات السلامة' : 'Safety Requirements'}</h4>
                            {selectedSOP.safetyReqs.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                    {selectedSOP.safetyReqs.map((req, i) => <li key={i}>{req}</li>)}
                                </ul>
                            ) : (
                                <span className="text-xs text-slate-400 italic">No specific safety requirements.</span>
                            )}
                        </div>
                    </div>

                    {/* File Attachment */}
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-red-500 shadow-sm">
                            <FileText size={24}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 text-sm">{selectedSOP.fileName}</div>
                            <div className="text-xs text-slate-400">{selectedSOP.fileSize}</div>
                        </div>
                        <button className="text-blue-600 hover:underline text-xs font-bold">{lang === 'ar' ? 'معاينة' : 'Preview'}</button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button onClick={() => handleDeleteSOP(selectedSOP.id)} className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition" title="Archive">
                        <Trash2 size={18}/>
                    </button>
                    
                    {selectedSOP.status !== 'Approved' && (
                        <button onClick={() => handleUpdateStatus(selectedSOP.id, 'Approved')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center justify-center gap-2">
                            <CheckCircle2 size={18}/> {lang === 'ar' ? 'اعتماد الإجراء' : 'Approve SOP'}
                        </button>
                    )}

                    <button onClick={() => alert('Download Started')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2">
                        <Download size={18}/> {lang === 'ar' ? 'تحميل الملف' : 'Download File'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- Upload SOP Modal (Fully Functional) --- */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'رفع إجراء جديد' : 'Upload New SOP'}</h3>
                    <button onClick={() => setIsUploadOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* File Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer relative"
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2"><UploadCloud size={24}/></div>
                            {newSOP.file ? (
                                <div className="text-sm font-bold text-green-600 flex items-center gap-2">
                                    <CheckCircle2 size={16}/> {newSOP.file.name}
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-slate-700">{lang === 'ar' ? 'اضغط لرفع ملف الإجراء' : 'Click to upload SOP file'}</span>
                                    <span className="text-xs text-slate-400">PDF, DOCX (Max 10MB)</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'عنوان الإجراء' : 'SOP Title'}</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
                                value={newSOP.title}
                                onChange={(e) => setNewSOP({...newSOP, title: e.target.value})}
                                placeholder="e.g. Site Safety Protocol"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'الفئة' : 'Category'}</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm cursor-pointer"
                                value={newSOP.category}
                                onChange={(e) => setNewSOP({...newSOP, category: e.target.value as Category})}
                            >
                                <option value="Operations">Operations</option>
                                <option value="Safety">Safety</option>
                                <option value="HR">HR</option>
                                <option value="Quality">Quality</option>
                                <option value="Forms">Forms</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'الوصف المختصر' : 'Short Description'}</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm h-20 resize-none"
                            value={newSOP.description}
                            onChange={(e) => setNewSOP({...newSOP, description: e.target.value})}
                            placeholder="Summary of the procedure..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'النطاق (أين يطبق؟)' : 'Scope'}</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm"
                                value={newSOP.scope}
                                onChange={(e) => setNewSOP({...newSOP, scope: e.target.value})}
                                placeholder="e.g. All sites"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'الأدوار (مفصول بفاصلة)' : 'Roles (comma separated)'}</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm"
                                value={newSOP.roles}
                                onChange={(e) => setNewSOP({...newSOP, roles: e.target.value})}
                                placeholder="e.g. Manager, Engineer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'متطلبات السلامة (مفصول بفاصلة)' : 'Safety Reqs (comma separated)'}</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm"
                            value={newSOP.safetyReqs}
                            onChange={(e) => setNewSOP({...newSOP, safetyReqs: e.target.value})}
                            placeholder="e.g. PPE, Gloves"
                        />
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button onClick={() => setIsUploadOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button onClick={handleSaveSOP} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2">
                        <Save size={16}/> {lang === 'ar' ? 'حفظ ونشر' : 'Save & Publish'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatBadge({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
    };
    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${colors[color]}`}>
            <Icon size={18} />
            <div>
                <div className="text-lg font-black leading-none">{value}</div>
                <div className="text-[10px] font-bold opacity-70">{label}</div>
            </div>
        </div>
    );
}