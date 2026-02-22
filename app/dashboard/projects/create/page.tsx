'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { 
  MapPin, Users, Calendar, FileText, 
  Shield, ArrowLeft, ArrowRight, 
  Cpu, Sparkles, CheckCircle2, ChevronDown, 
  Briefcase, Layers, UploadCloud, HardHat, FileCheck, X, Plus, Loader2, DollarSign, Search, Star, File as FileIcon, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout';

const ProjectMapPicker = dynamic(() => import('@/components/ProjectMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100/50 animate-pulse flex items-center justify-center text-slate-400 rounded-3xl">جاري تحميل الخريطة...</div>
});

// --- Types ---
type ProjectCategory = 'Maintenance' | 'Cable Testing' | 'Infrastructure' | 'Tech Support' | 'Emergency';

interface ManagerData { id: string; full_name: string; completion_rate: number; active_projects: number; }
interface Subcontractor { id: string; name: string; }

interface ProjectData {
  title: string;
  category: ProjectCategory;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  clientName: string;
  budget: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  managers: ManagerData[]; 
  equipment: string[];
  complianceItems: Record<string, boolean>;
  subcontractorId: string; // 👈 إضافة المقاول
  contractType: 'Direct' | 'Subcontract'; // 👈 إضافة نوع العقد
}

const STEPS = [
  { id: 1, label: { ar: 'هوية المشروع', en: 'Identity' }, desc: {ar: 'التفاصيل الأساسية', en: 'Basic Info'}, icon: Briefcase },
  { id: 2, label: { ar: 'الجدول والميزانية', en: 'Timeline' }, desc: {ar: 'الوقت والتكلفة', en: 'Time & Cost'}, icon: Calendar },
  { id: 3, label: { ar: 'الموقع والنطاق', en: 'Location' }, desc: {ar: 'الإحداثيات', en: 'Coordinates'}, icon: MapPin },
  { id: 4, label: { ar: 'المدراء والموارد', en: 'Resources' }, desc: {ar: 'القيادة والمعدات', en: 'Leadership & Eqp'}, icon: Users },
  { id: 5, label: { ar: 'الامتثال', en: 'Compliance' }, desc: {ar: 'المخاطر والعقود', en: 'Risk & Contracts'}, icon: Shield },
];

export default function EnterpriseProjectCreate() {
  const router = useRouter();
  const { lang, isDark } = useDashboard(); 
  const isRTL = lang === 'ar';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Smart Manager Logic
  const [availableManagers, setAvailableManagers] = useState<ManagerData[]>([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [loadingManagers, setLoadingManagers] = useState(true);

  // Subcontractor Logic
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [isCreatingSub, setIsCreatingSub] = useState(false);

  // Upload Logic
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState<ProjectData>({
    title: '', category: 'Maintenance', type: 'Internal Team', status: 'Draft',
    startDate: '', endDate: '', clientName: '', budget: '', locationName: '',
    coordinates: { lat: 24.7136, lng: 46.6753 }, managers: [], equipment: [],
    subcontractorId: '', contractType: 'Direct',
    complianceItems: { 'التحقق من SLA': false, 'اعتماد خطة السلامة': false, 'تفويض الميزانية': false }
  });

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchSmartData = async () => {
      setLoadingManagers(true);
      try {
        // Fetch Managers
        const { data: pms } = await supabase.from('profiles').select('id, full_name, completion_rate').eq('role', 'project_manager');
        const { data: activeProjects } = await supabase.from('projects').select('manager_name').eq('status', 'Active');
        
        if (pms) {
          const enrichedManagers = pms.map(pm => ({
            id: pm.id, full_name: pm.full_name,
            completion_rate: pm.completion_rate || Math.floor(Math.random() * 20) + 80, 
            active_projects: activeProjects?.filter(p => p.manager_name?.includes(pm.full_name)).length || 0
          })).sort((a, b) => a.active_projects !== b.active_projects ? a.active_projects - b.active_projects : b.completion_rate - a.completion_rate);
          setAvailableManagers(enrichedManagers);
        }

        // Fetch Subcontractors
        const { data: subs } = await supabase.from('subcontractors').select('id, name');
        if (subs) setSubcontractors(subs);

      } catch (error) { console.error(error); } 
      finally { setLoadingManagers(false); }
    };
    fetchSmartData();
  }, []);

  // --- Handlers ---
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const toggleManager = (mgr: ManagerData) => {
    setFormData(prev => {
        const exists = prev.managers.find(m => m.id === mgr.id);
        return { ...prev, managers: exists ? prev.managers.filter(m => m.id !== mgr.id) : [...prev.managers, mgr] };
    });
  };

  const toggleCompliance = (key: string) => setFormData(prev => ({ ...prev, complianceItems: { ...prev.complianceItems, [key]: !prev.complianceItems[key] } }));

  const handleSubcontractorChange = (value: string) => {
      if (value === 'NEW') {
          setIsNewSubModalOpen(true);
      } else {
          setFormData(prev => ({ 
              ...prev, 
              subcontractorId: value, 
              contractType: value ? 'Subcontract' : 'Direct' // 👈 التصنيف التلقائي
          }));
      }
  };

  const createNewSubcontractor = async () => {
      if (!newSubName.trim()) return;
      setIsCreatingSub(true);
      try {
          const { data, error } = await supabase.from('subcontractors').insert({ name: newSubName }).select().single();
          if (error) throw error;
          
          setSubcontractors(prev => [...prev, data]);
          setFormData(prev => ({ ...prev, subcontractorId: data.id, contractType: 'Subcontract' }));
          setIsNewSubModalOpen(false);
          setNewSubName('');
      } catch (error) { alert('Failed to create subcontractor'); }
      finally { setIsCreatingSub(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsCompressing(true);
    const processedFiles: File[] = [];
    for (const file of Array.from(e.target.files)) {
        if (file.type.startsWith('image/')) {
            try {
                const compressedBlob = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
                processedFiles.push(new File([compressedBlob], file.name, { type: file.type }));
            } catch { processedFiles.push(file); }
        } else processedFiles.push(file);
    }
    setUploadedFiles(prev => [...prev, ...processedFiles]);
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const triggerAiSuggestion = async () => {
    if (!formData.title) return alert(isRTL ? 'يرجى كتابة العنوان أولاً' : 'Title required');
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-project', lang, data: { title: formData.title } })
      });
      const data = await response.json();
      if (data.result) setFormData(prev => ({ ...prev, budget: data.result.budget || prev.budget, equipment: data.result.equipment || prev.equipment }));
    } catch (error) { console.error(error); } 
    finally { setIsAiLoading(false); }
  };

  const handleCreateProject = async () => {
    setIsSubmitting(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        let fileUrls: string[] = [];
        if (uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
                const fileName = `projects/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage.from('tech-media').upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
                if (data.publicUrl) fileUrls.push(data.publicUrl);
            }
        }

        const managerNamesString = formData.managers.map(m => m.full_name).join(', ');

        const { error } = await supabase.from('projects').insert({
            created_by: user.id, title: formData.title, category: formData.category, execution_type: formData.type, status: 'Active', 
            start_date: formData.startDate || null, end_date: formData.endDate || null, budget: formData.budget ? parseFloat(formData.budget) : 0,
            location_name: formData.locationName, location_lat: formData.coordinates.lat, location_lng: formData.coordinates.lng,
            manager_name: managerNamesString, equipment: formData.equipment, compliance_checklist: formData.complianceItems, contract_urls: fileUrls,
            subcontractor_id: formData.subcontractorId || null, contract_type: formData.contractType // 👈 التخزين
        });

        if (error) throw error;
        alert(isRTL ? 'تم إنشاء المشروع بنجاح!' : 'Project Created Successfully!');
        router.push('/dashboard');
    } catch (error: any) { alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving project'); } 
    finally { setIsSubmitting(false); }
  };

  const glassCard = isDark ? "bg-slate-900/60 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-black/20" : "bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-slate-200/50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark ? "bg-slate-800/50 border-slate-600 text-white focus:border-blue-500" : "bg-white border-slate-200 text-slate-800 focus:border-blue-600";

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-slate-950' : 'bg-slate-50'} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <header className={`sticky top-0 z-40 px-6 py-4 transition-all border-b ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className={`p-2.5 rounded-full transition-transform hover:scale-105 active:scale-95 ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
              {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
            </button>
            <div>
              <h1 className={`text-xl font-black flex items-center gap-2 tracking-tight ${textMain}`}>
                <Layers className="text-blue-600" strokeWidth={2.5} /> {isRTL ? 'تأسيس مشروع جديد' : 'New Project Setup'}
              </h1>
              <p className={`text-xs font-medium mt-0.5 flex items-center gap-2 ${textSub}`}>
                Enterprise Workspace <span className="w-1 h-1 rounded-full bg-slate-400"></span> <span className="text-blue-500 font-bold">{formData.status}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4 relative z-10">
        
        {/* Sidebar */}
        <aside className="lg:col-span-3 hidden lg:block space-y-6 sticky top-28 h-fit">
          <nav className="space-y-4 relative">
            <div className={`absolute top-6 bottom-6 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} ${isRTL ? 'right-[22px]' : 'left-[22px]'} -z-10`}></div>
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} onClick={() => setCurrentStep(step.id)} className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive ? `${glassCard} translate-x-2 rtl:-translate-x-2` : 'hover:bg-white/10'}`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-[3px] transition-all duration-300 ${isActive ? 'bg-blue-600 border-blue-500/30 text-white shadow-lg shadow-blue-600/30 scale-110' : isCompleted ? 'bg-emerald-500 border-emerald-500/30 text-white' : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-200 text-slate-400'} group-hover:border-slate-400`}`}>
                    {isCompleted ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
                  </div>
                  <div>
                    <span className={`block text-sm font-bold transition-colors ${isActive ? textMain : textSub}`}>{isRTL ? step.label.ar : step.label.en}</span>
                    <span className="text-[10px] text-slate-400 opacity-80">{isRTL ? step.desc.ar : step.desc.en}</span>
                  </div>
                </div>
              );
            })}
          </nav>
          
          <div className="p-1 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
             <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-[1.3rem] p-5 relative overflow-hidden`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Sparkles size={18}/></div>
                    <div className={`font-bold text-sm ${textMain}`}>AI Assistant</div>
                </div>
                <button onClick={triggerAiSuggestion} disabled={isAiLoading} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    {isAiLoading ? <Loader2 className="animate-spin" size={14}/> : <Cpu size={14}/>}
                    {isRTL ? 'توليد البيانات تلقائياً' : 'Auto-Generate Data'}
                </button>
             </div>
          </div>
        </aside>

        {/* Form Content */}
        <div className="lg:col-span-9 space-y-6">
          <AnimatePresence mode='wait'>
            <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`p-8 rounded-[2.5rem] ${glassCard} min-h-[500px] flex flex-col justify-between`}>
                <div className="space-y-8">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-200/10">
                        <div>
                            <h2 className={`text-2xl font-black ${textMain}`}>{isRTL ? STEPS[currentStep-1].label.ar : STEPS[currentStep-1].label.en}</h2>
                            <p className={`text-sm ${textSub}`}>{isRTL ? STEPS[currentStep-1].desc.ar : STEPS[currentStep-1].desc.en}</p>
                        </div>
                        <div className={`text-4xl font-black opacity-5 ${textMain}`}>0{currentStep}</div>
                    </div>

                    {/* Step 1: Identity */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <ModernInput label={isRTL ? 'عنوان المشروع' : 'Project Title'} value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} isDark={isDark} inputBg={inputBg} icon={FileText} autoFocus />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ModernSelect label={isRTL ? 'التصنيف' : 'Category'} value={formData.category} options={['Maintenance', 'Cable Testing', 'Infrastructure', 'Tech Support', 'Emergency']} onChange={(v: string) => setFormData({...formData, category: v as ProjectCategory})} isDark={isDark} inputBg={inputBg} />
                                <ModernSelect label={isRTL ? 'نوع التنفيذ' : 'Execution'} value={formData.type} options={['Internal Team', 'Outsourced', 'Hybrid']} onChange={(v: string) => setFormData({...formData, type: v})} isDark={isDark} inputBg={inputBg} />
                            </div>

                            {/* 🚀 Contract Mapping (New) */}
                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                                <div className="flex items-center justify-between">
                                    <label className={`text-xs font-bold uppercase tracking-wider px-1 ${textSub}`}>
                                        {isRTL ? 'مقاول العقد الموحد (اختياري)' : 'Subcontractor (Optional)'}
                                    </label>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${formData.contractType === 'Direct' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {formData.contractType === 'Direct' ? (isRTL ? 'عقد مباشر' : 'Direct Contract') : (isRTL ? 'مقاول باطن' : 'Subcontract')}
                                    </span>
                                </div>
                                
                                <div className="relative">
                                    <select 
                                        className={`w-full rounded-xl px-5 py-4 outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${inputBg}`}
                                        value={formData.subcontractorId}
                                        onChange={(e) => handleSubcontractorChange(e.target.value)}
                                    >
                                        <option value="">{isRTL ? '-- بدون مقاول (يصنف كعقد مباشر) --' : '-- No Subcontractor (Direct) --'}</option>
                                        <optgroup label={isRTL ? "المقاولين الحاليين" : "Existing Subcontractors"}>
                                            {subcontractors.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                        </optgroup>
                                        <optgroup label="----">
                                            <option value="NEW" className="text-blue-600 font-black">{isRTL ? '+ إضافة مقاول جديد' : '+ Add New Subcontractor'}</option>
                                        </optgroup>
                                    </select>
                                    <Building2 className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-4 text-slate-400 pointer-events-none`} size={20}/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Timeline */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <ModernInput type="date" label={isRTL ? 'تاريخ البدء' : 'Start Date'} value={formData.startDate} onChange={(v: string) => setFormData({...formData, startDate: v})} isDark={isDark} inputBg={inputBg} />
                                <ModernInput type="date" label={isRTL ? 'تاريخ الانتهاء' : 'End Date'} value={formData.endDate} onChange={(v: string) => setFormData({...formData, endDate: v})} isDark={isDark} inputBg={inputBg} />
                            </div>
                            <ModernInput type="number" label={isRTL ? 'الميزانية (ر.س)' : 'Budget (SAR)'} value={formData.budget} onChange={(v: string) => setFormData({...formData, budget: v})} icon={DollarSign} isDark={isDark} inputBg={inputBg} />
                        </div>
                    )}

                    {/* Step 3: Location */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className={`h-[400px] w-full rounded-[2rem] overflow-hidden relative z-0 border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <ProjectMapPicker lat={formData.coordinates.lat} lng={formData.coordinates.lng} onLocationSelect={(lat, lng) => setFormData(prev => ({...prev, coordinates: {lat, lng}}))} />
                                <div className="absolute top-4 left-4 right-4 z-10"><div className={`${glassCard} p-2 rounded-xl`}><ModernInput label="" placeholder={isRTL ? 'وصف الموقع...' : 'Location desc...'} value={formData.locationName} onChange={(v: string) => setFormData({...formData, locationName: v})} isDark={isDark} inputBg="bg-transparent border-none" icon={MapPin} /></div></div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Managers & Resources */}
                    {currentStep === 4 && (
                        <div className="space-y-8">
                            {/* Managers */}
                            <div className="space-y-3">
                                <label className={`text-xs font-bold uppercase tracking-wider px-1 ${textSub}`}>{isRTL ? 'تكليف مدراء المشروع (متعدد)' : 'Assign Project Managers'}</label>
                                <ModernInput label="" placeholder={isRTL ? 'ابحث عن مدير...' : 'Search managers...'} value={managerSearch} onChange={(v: string) => setManagerSearch(v)} isDark={isDark} inputBg={inputBg} icon={Search} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingManagers ? (
                                        <div className="col-span-2 py-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                                    ) : availableManagers.filter(m => m.full_name.toLowerCase().includes(managerSearch.toLowerCase())).map(mgr => {
                                        const isSelected = formData.managers.some(m => m.id === mgr.id);
                                        const isBusy = mgr.active_projects > 0;
                                        return (
                                            <div key={mgr.id} onClick={() => toggleManager(mgr)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'bg-blue-600/10 border-blue-500 shadow-sm ring-1 ring-blue-500/20' : `${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{mgr.full_name.charAt(0)}</div>
                                                    <div>
                                                        <div className={`text-sm font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : textMain}`}>{mgr.full_name}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isBusy ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}><Briefcase size={10}/> {mgr.active_projects}</span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 bg-purple-100 text-purple-700`}><Star size={10}/> {mgr.completion_rate}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>{isSelected && <CheckCircle2 size={14}/>}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Equipment */}
                            <div className="space-y-3 pt-4 border-t border-dashed border-slate-200/20">
                                <label className={`text-xs font-bold uppercase tracking-wider px-1 flex justify-between ${textSub}`}>
                                    <span>{isRTL ? 'المعدات الرئيسية' : 'Key Equipment'}</span>
                                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{isRTL ? 'اختياري' : 'Optional'}</span>
                                </label>
                                <ModernSelect label="" options={['Generator 500kVA', 'Testing Van', 'Safety Kit', 'Cable Analyzer', 'Excavator']} value="" onChange={(v: string) => { if(v && !formData.equipment.includes(v)) setFormData({...formData, equipment: [...formData.equipment, v]}) }} isDark={isDark} inputBg={inputBg} placeholder={isRTL ? 'اختر معدات لربطها بالمشروع...' : 'Select equipment...'} />
                                <div className="flex flex-wrap gap-2">
                                    {formData.equipment.map((eq, i) => (
                                        <span key={i} className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                                            <HardHat size={14}/> {eq} <button onClick={() => setFormData(prev => ({...prev, equipment: prev.equipment.filter((_, idx) => idx !== i)}))} className="hover:text-red-500 ml-1"><X size={14}/></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Compliance */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div onClick={() => fileInputRef.current?.click()} className={`group border-2 border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer relative overflow-hidden ${isCompressing ? 'border-blue-500 bg-blue-50' : isDark ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'}`}>
                                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,.pdf" onChange={handleFileChange} />
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">{isCompressing ? <Loader2 className="animate-spin" size={32}/> : <UploadCloud size={32} />}</div>
                                    <div><h4 className={`text-sm font-bold ${textMain}`}>{isCompressing ? (isRTL ? 'جاري الضغط...' : 'Compressing...') : (isRTL ? 'رفع ملفات (عقود، مخططات)' : 'Upload Files')}</h4></div>
                                </div>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2 animate-in fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {uploadedFiles.map((file, idx) => (
                                            <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`p-2 rounded-lg ${file.type.includes('pdf') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><FileIcon size={16}/></div>
                                                    <div className="truncate"><div className={`text-xs font-bold truncate ${textMain}`}>{file.name}</div><div className={`text-[10px] ${textSub}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</div></div>
                                                </div>
                                                <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-lg"><X size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t border-slate-200/20">
                                <label className={`text-xs font-bold uppercase tracking-wider px-1 ${textSub}`}>{isRTL ? 'الاشتراطات' : 'Checklist'}</label>
                                {Object.keys(formData.complianceItems).map(key => (
                                    <label key={key} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm'}`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${formData.complianceItems[key] ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                                            {formData.complianceItems[key] && <CheckCircle2 size={14} className="text-white"/>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.complianceItems[key]} onChange={() => toggleCompliance(key)}/>
                                        <span className={`text-sm font-bold ${textMain}`}>{key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                <div className="flex justify-between items-center pt-8 border-t border-slate-200/10 mt-8">
                    <button onClick={handleBack} disabled={currentStep === 1 || isSubmitting} className={`px-6 py-3 rounded-xl font-bold text-sm transition flex items-center gap-2 ${currentStep === 1 ? 'opacity-0' : `${textSub} hover:${textMain}`}`}>
                        {isRTL ? <ArrowRight size={18}/> : <ArrowLeft size={18}/>} {isRTL ? 'السابق' : 'Back'}
                    </button>
                    <button onClick={currentStep === 5 ? handleCreateProject : handleNext} disabled={isSubmitting} className={`px-8 py-3 rounded-xl font-bold text-sm text-white shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 ${currentStep === 5 ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
                        {isSubmitting ? <><Loader2 className="animate-spin" size={18}/> {isRTL ? 'جاري الحفظ...' : 'Saving...'}</> : (currentStep === 5 ? (isRTL ? 'اعتماد وإنشاء' : 'Submit Project') : (isRTL ? 'التالي' : 'Next Step'))}
                        {!isSubmitting && currentStep !== 5 && (isRTL ? <ArrowLeft size={18}/> : <ArrowRight size={18}/>)}
                    </button>
                </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* --- نافذة إنشاء مقاول جديد (Modal) --- */}
      <AnimatePresence>
          {isNewSubModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md p-6 rounded-3xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                      <div className="flex justify-between items-center mb-6">
                          <h3 className={`text-lg font-bold ${textMain}`}>{isRTL ? 'تسجيل مقاول جديد' : 'New Subcontractor'}</h3>
                          <button onClick={() => {setIsNewSubModalOpen(false); setFormData(prev => ({...prev, subcontractorId: '', contractType: 'Direct'}))}} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                      </div>
                      <div className="space-y-4">
                          <ModernInput label={isRTL ? 'اسم الشركة / المقاول' : 'Company Name'} value={newSubName} onChange={setNewSubName} isDark={isDark} inputBg={inputBg} icon={Building2} autoFocus />
                          <button onClick={createNewSubcontractor} disabled={isCreatingSub || !newSubName.trim()} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all">
                              {isCreatingSub ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>}
                              {isRTL ? 'حفظ وإضافة' : 'Save & Add'}
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}

// --- Modern UI Components ---
function ModernInput({ label, value, onChange, icon: Icon, type = "text", autoFocus = false, isDark, inputBg, placeholder }: any) {
    return (
        <div className="space-y-2 group">
            {label && <label className={`text-xs font-bold uppercase tracking-wider px-1 transition-colors ${isDark ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-blue-600'}`}>{label}</label>}
            <div className="relative">
                {Icon && <Icon className={`absolute ${label === '' ? 'left-4 top-3.5' : 'right-4 top-3.5'} text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors`} />}
                <input type={type} placeholder={placeholder} autoFocus={autoFocus} className={`w-full rounded-xl px-5 py-3.5 outline-none transition-all duration-300 text-sm font-bold ${inputBg} ${Icon ? (label === '' ? 'pl-12' : 'pr-12') : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
            </div>
        </div>
    );
}

function ModernSelect({ label, options, value, onChange, isDark, inputBg, placeholder }: any) {
    return (
        <div className="space-y-2 group">
            {label && <label className={`text-xs font-bold uppercase tracking-wider px-1 transition-colors ${isDark ? 'text-slate-400 group-focus-within:text-blue-400' : 'text-slate-500 group-focus-within:text-blue-600'}`}>{label}</label>}
            <div className="relative">
                <select className={`w-full rounded-xl px-5 py-3.5 outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${inputBg}`} value={value} onChange={(e) => onChange(e.target.value)}>
                    {placeholder ? <option value="" disabled>{placeholder}</option> : <option value="" disabled>Select...</option>}
                    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={18}/>
            </div>
        </div>
    );
}