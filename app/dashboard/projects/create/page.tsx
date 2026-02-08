'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  MapPin, Users, Calendar, FileText, 
  Shield, ArrowLeft, ArrowRight, 
  Cpu, Sparkles, CheckCircle2, ChevronDown, 
  Briefcase, Globe, Layers, Save, UploadCloud, HardHat, FileCheck, X, Plus, Loader2
} from 'lucide-react';

// استدعاء الخريطة ديناميكياً لتجنب مشاكل المتصفح والسيرفر
// ملاحظة: تم إضافة loading fallback لتظهر أثناء تحميل ملف الخريطة الضخم
const ProjectMapPicker = dynamic(() => import('@/components/ProjectMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 rounded-2xl">جاري تهيئة الخريطة...</div>
});

// --- الأنواع ---
type ProjectCategory = 'Maintenance' | 'Cable Testing' | 'Infrastructure' | 'Tech Support' | 'Emergency';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// تعريف نوع عضو الفريق بدقة لتجنب أخطاء React
interface TeamMember {
  name: string;
  role: string;
}

interface ProjectData {
  title: string;
  category: ProjectCategory;
  type: string;
  risk: RiskLevel;
  status: string;
  startDate: string;
  endDate: string;
  clientName: string;
  budget: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  manager: string;
  team: TeamMember[]; // استخدام النوع المعرف
  equipment: string[];
  complianceItems: Record<string, boolean>;
}

const STEPS = [
  { id: 1, label: { ar: 'هوية المشروع', en: 'Project Identity' }, icon: Briefcase },
  { id: 2, label: { ar: 'الجدول الزمني', en: 'Timeline' }, icon: Calendar },
  { id: 3, label: { ar: 'الموقع والنطاق', en: 'Location & Scope' }, icon: MapPin },
  { id: 4, label: { ar: 'الفريق والموارد', en: 'Team & Resources' }, icon: Users },
  { id: 5, label: { ar: 'المخاطر والامتثال', en: 'Risk & Compliance' }, icon: Shield },
];

export default function EnterpriseProjectCreate() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [currentStep, setCurrentStep] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [newTeamMember, setNewTeamMember] = useState('');

  const [formData, setFormData] = useState<ProjectData>({
    title: '',
    category: 'Maintenance',
    type: 'Internal Team',
    risk: 'Low',
    status: 'Draft',
    startDate: '',
    endDate: '',
    clientName: '',
    budget: '',
    locationName: '',
    coordinates: { lat: 24.7136, lng: 46.6753 },
    manager: '',
    team: [],
    equipment: [],
    complianceItems: {
        'التحقق من SLA': false,
        'اعتماد خطة السلامة': false,
        'تفويض الميزانية': false
    }
  });

  // --- Handlers ---
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const addTeamMember = () => {
    if (newTeamMember.trim()) {
        const memberObj: TeamMember = { name: newTeamMember, role: lang === 'ar' ? 'عضو فريق' : 'Team Member' };
        setFormData(prev => ({ ...prev, team: [...prev.team, memberObj] }));
        setNewTeamMember('');
    }
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({ ...prev, team: prev.team.filter((_, i) => i !== index) }));
  };

  const toggleCompliance = (key: string) => {
      setFormData(prev => ({
          ...prev,
          complianceItems: { ...prev.complianceItems, [key]: !prev.complianceItems[key] }
      }));
  };

  // --- تشغيل الذكاء الاصطناعي ---
  const triggerAiSuggestion = async () => {
    if (!formData.title) {
        alert(lang === 'ar' ? 'يرجى كتابة عنوان المشروع أولاً' : 'Please enter project title first');
        return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-project',
          lang,
          data: { title: formData.title }
        })
      });

      const data = await response.json();
      
      if (data.result) {
          const aiTeam = Array.isArray(data.result.team) 
            ? data.result.team.map((m: any) => typeof m === 'string' ? { name: m, role: 'Suggested' } : m)
            : [];

          setFormData((prev) => ({
            ...prev,
            ...data.result,
            team: [...prev.team, ...aiTeam],
            coordinates: prev.coordinates
          }));
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert(lang === 'ar' ? 'فشل الاتصال بخدمة الذكاء الاصطناعي' : 'AI Service Error');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 hover:bg-slate-100 rounded-full text-slate-500 transition-transform hover:scale-105 active:scale-95">
              {lang === 'ar' ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <Layers className="text-blue-600" strokeWidth={2.5} />
                {lang === 'ar' ? 'تخطيط مشروع جديد' : 'New Project Planning'}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                نظام GMS الذكي &bull; <span className="text-blue-600 font-bold">{formData.status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition">
              <Globe size={16} /> {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-300 transition-all active:scale-95">
              {lang === 'ar' ? 'إنشاء المشروع' : 'Create Project'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Left Column: Navigation */}
        <aside className="lg:col-span-3 hidden lg:block space-y-6 sticky top-28 h-fit">
          <nav className="space-y-2 relative">
            <div className={`absolute top-5 bottom-5 w-0.5 bg-slate-200 ${lang === 'ar' ? 'right-[22px]' : 'left-[22px]'} -z-10`}></div>
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div 
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive ? 'bg-white shadow-lg shadow-blue-50 border border-blue-100 translate-x-2 rtl:-translate-x-2' : 'hover:bg-white/60'}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-[3px] transition-all duration-300 ${
                    isActive ? 'bg-blue-600 border-blue-100 text-white shadow-md scale-110' : 
                    isCompleted ? 'bg-green-500 border-green-100 text-white' : 
                    'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} strokeWidth={2} />}
                  </div>
                  <div>
                    <span className={`block text-sm font-bold transition-colors ${isActive ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      {lang === 'ar' ? step.label.ar : step.label.en}
                    </span>
                    {isActive && <span className="text-[10px] text-blue-600 font-bold animate-pulse">{lang === 'ar' ? 'الخطوة الحالية' : 'Current Step'}</span>}
                  </div>
                </div>
              );
            })}
          </nav>
          
          {/* Summary Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ملخص سريع</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-slate-400">الميزانية المقدرة</span>
                <span className="font-mono font-bold text-emerald-400 text-lg">{formData.budget ? `${Number(formData.budget).toLocaleString()} ر.س` : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">مستوى المخاطر</span>
                <span className={`font-bold px-3 py-1 rounded-full text-xs border ${
                  formData.risk === 'High' ? 'bg-red-500/20 border-red-500/50 text-red-300' : 
                  formData.risk === 'Medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                  'bg-blue-500/20 border-blue-500/50 text-blue-300'
                }`}>{formData.risk}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Forms */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
              <SectionHeader title={lang === 'ar' ? 'بيانات وهوية المشروع' : 'Project Identity'} desc={lang === 'ar' ? 'حدد التفاصيل الأساسية، يمكن للذكاء الاصطناعي مساعدتك هنا' : 'Define core details, AI can help you here'} />
              
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                <ModernInput 
                  label={lang === 'ar' ? 'عنوان المشروع' : 'Project Title'} 
                  placeholder={lang === 'ar' ? 'مثال: صيانة مولدات الطوارئ - المربع 4' : 'e.g. Backup Generator Maint...'}
                  value={formData.title}
                  onChange={(v) => setFormData({...formData, title: v})}
                  icon={FileText}
                  autoFocus
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ModernSelect 
                    label={lang === 'ar' ? 'تصنيف المشروع' : 'Category'}
                    options={['Maintenance', 'Cable Testing', 'Infrastructure', 'Tech Support', 'Emergency']}
                    value={formData.category}
                    onChange={(v) => setFormData({...formData, category: v as ProjectCategory})}
                  />
                  <ModernSelect 
                    label={lang === 'ar' ? 'نموذج التنفيذ' : 'Execution Model'}
                    options={['Internal Team', 'Outsourced', 'Hybrid']}
                    value={formData.type}
                    onChange={(v) => setFormData({...formData, type: v})}
                  />
                </div>

                {/* Risk Selector */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{lang === 'ar' ? 'تقييم المخاطر الأولي' : 'Initial Risk Assessment'}</label>
                  <div className="flex gap-3 p-1.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                    {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                      <button 
                        key={level} 
                        onClick={() => setFormData({...formData, risk: level as RiskLevel})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                          formData.risk === level 
                          ? level === 'High' || level === 'Critical' 
                            ? 'bg-white border border-red-200 text-red-600 shadow-md shadow-red-100' 
                            : 'bg-white border border-blue-200 text-blue-600 shadow-md shadow-blue-100'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Timeline */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
              <SectionHeader title={lang === 'ar' ? 'الجدول الزمني' : 'Timeline'} desc={lang === 'ar' ? 'تحديد الإطار الزمني للتنفيذ' : 'Set execution timeframe'} />
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <ModernInput type="date" label={lang === 'ar' ? 'تاريخ البدء' : 'Start Date'} value={formData.startDate} onChange={(v) => setFormData({...formData, startDate: v})} icon={Calendar} />
                  <ModernInput type="date" label={lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'} value={formData.endDate} onChange={(v) => setFormData({...formData, endDate: v})} icon={Calendar} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
                <SectionHeader title={lang === 'ar' ? 'الموقع الجغرافي' : 'Location'} desc={lang === 'ar' ? 'اضغط على الخريطة لتحديد إحداثيات الموقع بدقة' : 'Pinpoint location on map'} />
                
                <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative group">
                    <div className="h-[450px] w-full rounded-[1.5rem] overflow-hidden relative z-0">
                        <ProjectMapPicker 
                            lat={formData.coordinates.lat} 
                            lng={formData.coordinates.lng} 
                            onLocationSelect={(lat, lng) => setFormData(prev => ({...prev, coordinates: {lat, lng}}))}
                        />
                    </div>
                    
                    {/* Floating Address Input */}
                    <div className="absolute bottom-6 left-6 right-6 z-10">
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50">
                            <ModernInput 
                                label={lang === 'ar' ? 'وصف العنوان' : 'Address Description'}
                                placeholder={lang === 'ar' ? 'الرياض، حي الملقا، شارع...' : 'Riyadh, Al-Malqa...'}
                                value={formData.locationName}
                                onChange={(v) => setFormData({...formData, locationName: v})}
                                icon={MapPin}
                                transparent={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Step 4: Team */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
                <SectionHeader title={lang === 'ar' ? 'الفريق والموارد' : 'Team & Resources'} desc={lang === 'ar' ? 'بناء فريق العمل وتجهيز المعدات' : 'Build team & allocate assets'} />
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                    {/* Manager Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{lang === 'ar' ? 'مدير المشروع' : 'Project Manager'}</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['م. أحمد', 'م. عمر', 'أ. سارة'].map((mgr) => (
                                <div key={mgr} onClick={() => setFormData({...formData, manager: mgr})}
                                    className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center gap-2 transition-all duration-300 ${
                                        formData.manager === mgr 
                                        ? 'bg-blue-50 border-blue-500/50 text-blue-700 shadow-md ring-1 ring-blue-500/20' 
                                        : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-md'
                                    }`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${formData.manager === mgr ? 'bg-blue-200 text-blue-800' : 'bg-white border border-slate-200 text-slate-500'}`}>{mgr.charAt(0)}</div>
                                    <span className="text-sm font-bold">{mgr}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Members Input */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{lang === 'ar' ? 'أعضاء الفريق الفني' : 'Technical Team'}</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder={lang === 'ar' ? 'أدخل اسم الموظف واضغط إضافة...' : 'Type name and add...'}
                                value={newTeamMember}
                                onChange={(e) => setNewTeamMember(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
                            />
                            <button onClick={addTeamMember} className="bg-slate-900 text-white w-12 rounded-2xl hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center shadow-lg">
                                <Plus size={22} />
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                            {/* تم إصلاح عرض الكائن هنا */}
                            {formData.team.map((member, idx) => (
                                <span key={idx} className="bg-white pl-4 pr-2 py-2 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-3 border border-slate-200 shadow-sm animate-in zoom-in duration-300">
                                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex flex-col items-center justify-center text-[10px] leading-tight">
                                        <Users size={12}/>
                                    </span>
                                    <div className="flex flex-col text-left">
                                        <span>{member.name}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">{member.role}</span>
                                    </div>
                                    <button onClick={() => removeTeamMember(idx)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition"><X size={14}/></button>
                                </span>
                            ))}
                            {formData.team.length === 0 && <span className="text-slate-400 text-sm italic px-2 py-2">{lang === 'ar' ? 'لم يتم إضافة أعضاء بعد' : 'No members added yet'}</span>}
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="space-y-3 pt-6 border-t border-dashed border-slate-200">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{lang === 'ar' ? 'تخصيص المعدات' : 'Equipment Allocation'}</label>
                        <ModernSelect 
                            label=""
                            options={['Generator 500kVA', 'Testing Van', 'Safety Kit', 'Cable Analyzer', 'Drill Set']}
                            value=""
                            onChange={(v) => { if(v && !formData.equipment.includes(v)) setFormData({...formData, equipment: [...formData.equipment, v]}) }}
                            placeholder={lang === 'ar' ? 'اختر المعدات لإضافتها...' : 'Select equipment to add...'}
                        />
                        <div className="flex flex-wrap gap-2">
                            {formData.equipment.map((eq, idx) => (
                                <span key={idx} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-bottom-2">
                                    <HardHat size={12} className="text-yellow-400"/> {eq}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Step 5: Compliance */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
                <SectionHeader title={lang === 'ar' ? 'المخاطر والامتثال' : 'Risk & Compliance'} desc={lang === 'ar' ? 'الوثائق والتحقق من الاشتراطات' : 'Docs & Verification'} />
                
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8">
                    {/* Upload */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center hover:bg-slate-50 hover:border-blue-400 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={() => alert('تم رفع الملف بنجاح (محاكاة)')} />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">
                                <UploadCloud size={32} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{lang === 'ar' ? 'اضغط لرفع ملفات العقد والمخططات' : 'Click to Upload Docs'}</h4>
                                <p className="text-xs text-slate-400 mt-1">PDF, DWG, JPG (Max 20MB)</p>
                            </div>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{lang === 'ar' ? 'قائمة التحقق الإلزامية' : 'Mandatory Checklist'}</label>
                        {Object.keys(formData.complianceItems).map((key) => (
                            <label key={key} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all duration-200 select-none group">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${formData.complianceItems[key] ? 'bg-blue-600 border-blue-600 scale-110' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                    {formData.complianceItems[key] && <div className="text-white"><CheckCircle2 size={16}/></div>}
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.complianceItems[key]} onChange={() => toggleCompliance(key)} />
                                <span className={`flex-1 text-sm font-bold transition-colors ${formData.complianceItems[key] ? 'text-slate-800' : 'text-slate-500'}`}>{key}</span>
                                <FileCheck size={18} className={`transition-colors ${formData.complianceItems[key] ? 'text-blue-600' : 'text-slate-300'}`}/>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-8">
            <button 
                onClick={handleBack} 
                disabled={currentStep === 1} 
                className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-white hover:shadow-md disabled:opacity-0 transition-all flex items-center gap-3"
            >
              {lang === 'ar' ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>} 
              {lang === 'ar' ? 'السابق' : 'Back'}
            </button>
            
            <button 
                onClick={handleNext} 
                className={`px-10 py-4 rounded-2xl font-bold text-white shadow-xl shadow-slate-300 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 ${currentStep === 5 ? 'bg-green-600 hover:bg-green-500 shadow-green-200' : 'bg-slate-900 hover:bg-slate-800'}`}
            >
              {currentStep === 5 ? (lang === 'ar' ? 'اعتماد المشروع' : 'Submit Project') : (lang === 'ar' ? 'التالي' : 'Next Step')}
              {currentStep !== 5 && (lang === 'ar' ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>)}
            </button>
          </div>

        </div>

        {/* Right Column: AI Assistant (Floating) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="sticky top-32">
            <div className="bg-white border border-purple-100 rounded-[1.5rem] shadow-xl shadow-purple-100/50 overflow-hidden relative group">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">مساعد الذكاء الاصطناعي</h3>
                    </div>
                    
                    <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                        {lang === 'ar' 
                        ? 'أدخل عنوان المشروع فقط، وسأقوم بتوليد الميزانية، الجدول الزمني، وتقييم المخاطر والمعدات تلقائياً.'
                        : 'Enter the project title, and I will auto-generate budget, timeline, risks, and equipment for you.'}
                    </p>

                    <button 
                        onClick={triggerAiSuggestion}
                        disabled={isAiLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                    >
                        {isAiLoading ? <Loader2 className="animate-spin" size={16}/> : <Cpu size={16} className="group-hover/btn:animate-pulse"/>}
                        {isAiLoading ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'توليد تلقائي ذكي' : 'Auto-Generate Details')}
                    </button>
                </div>
                
                {/* Decorative Bottom */}
                <div className="bg-purple-50/50 p-4 border-t border-purple-100">
                    <div className="flex items-center gap-2 text-[10px] text-purple-400 font-bold justify-center">
                        <Sparkles size={10} /> POWERED BY OPENAI
                    </div>
                </div>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}

// --- Modern UI Components ---

function SectionHeader({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="mb-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">{desc}</p>
        </div>
    );
}

interface ModernInputProps { label: string; placeholder?: string; value: string; onChange: (v: string) => void; icon?: any; type?: string; transparent?: boolean; autoFocus?: boolean; }
function ModernInput({ label, placeholder, value, onChange, icon: Icon, type = "text", transparent = false, autoFocus = false }: ModernInputProps) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 transition-colors group-focus-within:text-blue-600">{label}</label>
            <div className="relative">
                {Icon && <Icon className="absolute right-5 top-4 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />}
                <input 
                    type={type}
                    autoFocus={autoFocus}
                    className={`w-full rounded-2xl px-5 py-4 outline-none transition-all duration-300 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal
                    ${transparent ? 'bg-white/80 backdrop-blur border border-white focus:bg-white shadow-sm' : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}
                    ${Icon ? 'pr-14' : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

interface ModernSelectProps { label: string; options: string[]; value: string; onChange: (v: string) => void; placeholder?: string; }
function ModernSelect({ label, options, value, onChange, placeholder }: ModernSelectProps) {
    return (
        <div className="space-y-2 group">
            {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 transition-colors group-focus-within:text-blue-600">{label}</label>}
            <div className="relative">
                <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-slate-800 appearance-none cursor-pointer"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute left-5 top-4 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform duration-300" size={20}/>
            </div>
        </div>
    );
}