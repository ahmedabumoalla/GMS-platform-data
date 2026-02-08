'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; // استيراد ديناميكي للخريطة
import { 
  MapPin, Users, Calendar, FileText, 
  Shield, ArrowLeft, ArrowRight, 
  Cpu, Sparkles, AlertTriangle, CheckCircle2, ChevronDown, 
  Briefcase, Globe, Layers, Save, UploadCloud, HardHat, FileCheck, X, Plus
} from 'lucide-react';

// استدعاء الخريطة ديناميكياً لتجنب مشاكل الـ Server Side Rendering
const ProjectMapPicker = dynamic(() => import('@/components/ProjectMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">جاري تحميل الخريطة...</div>
});

// --- Types & Interfaces ---
type ProjectCategory = 'Maintenance' | 'Cable Testing' | 'Infrastructure' | 'Tech Support' | 'Emergency';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

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
  team: string[];
  equipment: string[];
  complianceItems: Record<string, boolean>; // لتخزين حالة الامتثال
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
  
  // حالة لإدخال عضو فريق جديد
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
    coordinates: { lat: 24.7136, lng: 46.6753 }, // إحداثيات افتراضية (الرياض)
    manager: '',
    team: [],
    equipment: [],
    complianceItems: {
        'SLA Compliance Verified': false,
        'Safety Plan Approved': false,
        'Budget Authorization': false
    }
  });

  // --- Handlers ---
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  // إضافة عضو للفريق
  const addTeamMember = () => {
    if (newTeamMember.trim()) {
        setFormData(prev => ({ ...prev, team: [...prev.team, newTeamMember] }));
        setNewTeamMember('');
    }
  };

  // حذف عضو من الفريق
  const removeTeamMember = (index: number) => {
    setFormData(prev => ({ ...prev, team: prev.team.filter((_, i) => i !== index) }));
  };

  // تبديل حالة الامتثال
  const toggleCompliance = (key: string) => {
      setFormData(prev => ({
          ...prev,
          complianceItems: {
              ...prev.complianceItems,
              [key]: !prev.complianceItems[key]
          }
      }));
  };

  // محاكاة الذكاء الاصطناعي
  const triggerAiSuggestion = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        title: lang === 'ar' ? 'صيانة محطة التحويل الرئيسية - القطاع الشمالي' : 'Main Substation Maintenance - Northern Sector',
        risk: 'High',
        budget: '450,000',
        equipment: ['Testing Van #4', 'Thermal Camera', 'Safety Gear Class A'],
        manager: 'Eng. Ahmed Al-Ghamdi',
        team: ['Saeed (Tech)', 'Yasser (Driver)', 'Mohammed (Engineer)'],
        startDate: '2024-03-01',
        endDate: '2024-03-15',
        locationName: 'الرياض، المحطة الشمالية، مخرج 7'
      }));
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition">
              {lang === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers className="text-blue-600" />
                {lang === 'ar' ? 'تخطيط مشروع جديد' : 'New Project Planning'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                GMS Enterprise Resource Planning &bull; <span className="text-blue-600">{formData.status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
              <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <button className="px-6 py-2 bg-blue-900 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-900/20">
              {lang === 'ar' ? 'إنشاء المشروع' : 'Create Project'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stepper */}
        <aside className="lg:col-span-3 hidden lg:block space-y-6">
          <nav className="space-y-1 relative">
            <div className={`absolute top-4 bottom-4 w-0.5 bg-slate-200 ${lang === 'ar' ? 'right-[19px]' : 'left-[19px]'} -z-10`}></div>
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div 
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 ${isActive ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-slate-100/50'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                    isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 
                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    'bg-slate-50 border-slate-300 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={18} />}
                  </div>
                  <div>
                    <span className={`block text-sm font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                      {lang === 'ar' ? step.label.ar : step.label.en}
                    </span>
                  </div>
                </div>
              );
            })}
          </nav>
          
          {/* Stats Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ملخص المشروع</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">الميزانية</span>
                <span className="font-mono font-bold text-emerald-400">{formData.budget || '0'} SAR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">المخاطر</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  formData.risk === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>{formData.risk}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Forms */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title={lang === 'ar' ? 'بيانات وهوية المشروع' : 'Project Identity'} desc={lang === 'ar' ? 'تحديد المعلومات الأساسية وتصنيف نوع العمل' : 'Define core information'} />
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <FormInput 
                  label={lang === 'ar' ? 'عنوان المشروع' : 'Project Title'} 
                  placeholder={lang === 'ar' ? 'مثال: صيانة المولدات...' : 'e.g. Backup Generator...'}
                  value={formData.title}
                  onChange={(v) => setFormData({...formData, title: v})}
                  icon={FileText}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect 
                    label={lang === 'ar' ? 'الفئة' : 'Category'}
                    options={['Maintenance', 'Cable Testing', 'Infrastructure', 'Tech Support']}
                    value={formData.category}
                    onChange={(v) => setFormData({...formData, category: v as ProjectCategory})}
                  />
                  <FormSelect 
                    label={lang === 'ar' ? 'نوع التنفيذ' : 'Execution Type'}
                    options={['Internal Team', 'Outsourced', 'Hybrid']}
                    value={formData.type}
                    onChange={(v) => setFormData({...formData, type: v})}
                  />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-500 mb-3 block uppercase">{lang === 'ar' ? 'المخاطر' : 'Risk'}</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                      <button key={level} onClick={() => setFormData({...formData, risk: level as RiskLevel})}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${formData.risk === level ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200'}`}>
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
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title={lang === 'ar' ? 'الجدول الزمني' : 'Timeline'} desc={lang === 'ar' ? 'تحديد تواريخ البدء والانتهاء' : 'Set dates'} />
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput type="date" label={lang === 'ar' ? 'تاريخ البدء' : 'Start Date'} value={formData.startDate} onChange={(v) => setFormData({...formData, startDate: v})} icon={Calendar} />
                  <FormInput type="date" label={lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'} value={formData.endDate} onChange={(v) => setFormData({...formData, endDate: v})} icon={Calendar} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location (Interactive Map) */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title={lang === 'ar' ? 'الموقع الجغرافي' : 'Location'} desc={lang === 'ar' ? 'اضغط على الخريطة لتحديد الموقع' : 'Click map to pin location'} />
                <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[400px] relative">
                    <ProjectMapPicker 
                        lat={formData.coordinates.lat} 
                        lng={formData.coordinates.lng} 
                        onLocationSelect={(lat, lng) => setFormData(prev => ({...prev, coordinates: {lat, lng}}))}
                    />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <FormInput 
                        label={lang === 'ar' ? 'وصف الموقع' : 'Location Description'}
                        placeholder={lang === 'ar' ? 'الرياض، حي الملقا...' : 'Riyadh, Al-Malqa...'}
                        value={formData.locationName}
                        onChange={(v) => setFormData({...formData, locationName: v})}
                        icon={MapPin}
                    />
                </div>
            </div>
          )}

          {/* Step 4: Team & Resources (WORKING) */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title={lang === 'ar' ? 'الفريق والموارد' : 'Team & Resources'} desc={lang === 'ar' ? 'تخصيص الفريق والمعدات' : 'Assign team'} />
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    {/* Manager */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{lang === 'ar' ? 'مدير المشروع' : 'Project Manager'}</label>
                        <div className="flex gap-3">
                            {['Eng. Ahmed', 'Eng. Omar', 'Eng. Sarah'].map((mgr) => (
                                <div key={mgr} onClick={() => setFormData({...formData, manager: mgr})}
                                    className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition ${formData.manager === mgr ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-slate-50 border-slate-200'}`}>
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{mgr.charAt(5)}</div>
                                    <span className="text-sm font-bold text-slate-700">{mgr}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Members List */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{lang === 'ar' ? 'أعضاء الفريق' : 'Team Members'}</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none text-sm"
                                placeholder={lang === 'ar' ? 'اسم الموظف...' : 'Employee Name...'}
                                value={newTeamMember}
                                onChange={(e) => setNewTeamMember(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
                            />
                            <button onClick={addTeamMember} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.team.map((member, idx) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-blue-100">
                                    <Users size={14}/> {member}
                                    <button onClick={() => removeTeamMember(idx)} className="hover:text-red-500"><X size={14}/></button>
                                </span>
                            ))}
                            {formData.team.length === 0 && <span className="text-slate-400 text-sm italic">{lang === 'ar' ? 'لم يتم إضافة أعضاء' : 'No members added'}</span>}
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{lang === 'ar' ? 'المعدات' : 'Equipment'}</label>
                        <div className="relative">
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm font-semibold appearance-none cursor-pointer"
                                onChange={(e) => { if(e.target.value && !formData.equipment.includes(e.target.value)) setFormData({...formData, equipment: [...formData.equipment, e.target.value]}) }}>
                                <option value="">{lang === 'ar' ? '+ إضافة معدات' : '+ Add Equipment'}</option>
                                <option value="Generator 500kVA">Generator 500kVA</option>
                                <option value="Testing Van">Testing Van</option>
                                <option value="Safety Kit">Safety Kit</option>
                            </select>
                            <ChevronDown className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18}/>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.equipment.map((eq, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200">
                                    <HardHat size={12}/> {eq}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Step 5: Risk & Compliance (WORKING) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title={lang === 'ar' ? 'المخاطر والامتثال' : 'Risk & Compliance'} desc={lang === 'ar' ? 'الوثائق والتحقق' : 'Docs & Verification'} />
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    {/* Fake Upload */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer group"
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={() => alert('تم رفع الملف بنجاح (محاكاة)')} />
                        <UploadCloud className="mx-auto text-slate-400 mb-3 group-hover:text-blue-500 transition" size={32}/>
                        <h4 className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'اضغط لرفع ملفات العقد والمخططات' : 'Click to Upload Docs'}</h4>
                    </div>

                    {/* Interactive Checklist */}
                    <div className="space-y-3">
                        {Object.keys(formData.complianceItems).map((key) => (
                            <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition select-none">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${formData.complianceItems[key] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {formData.complianceItems[key] && <div className="text-white"><CheckCircle2 size={14}/></div>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={formData.complianceItems[key]} 
                                    onChange={() => toggleCompliance(key)} 
                                />
                                <span className={`text-sm font-bold transition ${formData.complianceItems[key] ? 'text-slate-800' : 'text-slate-500'}`}>{key}</span>
                                <FileCheck size={16} className={`mr-auto transition ${formData.complianceItems[key] ? 'text-blue-600' : 'text-slate-300'}`}/>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <button onClick={handleBack} disabled={currentStep === 1} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50 flex items-center gap-2">
              {lang === 'ar' ? <ArrowRight size={18}/> : <ArrowLeft size={18}/>} {lang === 'ar' ? 'السابق' : 'Back'}
            </button>
            <button onClick={handleNext} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2">
              {currentStep === 5 ? (lang === 'ar' ? 'اعتماد' : 'Submit') : (lang === 'ar' ? 'التالي' : 'Next')}
              {currentStep !== 5 && (lang === 'ar' ? <ArrowLeft size={18}/> : <ArrowRight size={18}/>)}
            </button>
          </div>

        </div>

        {/* Right Column: AI */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-600" size={18}/>
                <h3 className="font-bold text-slate-800 text-sm">GMS Intelligence</h3>
            </div>
            <button onClick={triggerAiSuggestion} disabled={isAiLoading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2">
                {isAiLoading ? <Cpu className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                {isAiLoading ? 'جاري التحليل...' : 'توليد اقتراحات ذكية'}
            </button>
          </div>
        </aside>

      </main>
    </div>
  );
}

// --- Sub Components ---
function SectionHeader({ title, desc }: { title: string, desc: string }) {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-slate-500 mt-1">{desc}</p>
        </div>
    );
}

interface FormInputProps { label: string; placeholder?: string; value: string; onChange: (v: string) => void; icon?: any; type?: string; }
function FormInput({ label, placeholder, value, onChange, icon: Icon, type = "text" }: FormInputProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group">
                {Icon && <Icon className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />}
                <input type={type} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm font-semibold text-slate-800 ${Icon ? 'pr-12' : ''}`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
            </div>
        </div>
    );
}

interface FormSelectProps { label: string; options: string[]; value: string; onChange: (v: string) => void; }
function FormSelect({ label, options, value, onChange }: FormSelectProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative">
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm font-semibold text-slate-800 appearance-none cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)}>
                    {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18}/>
            </div>
        </div>
    );
}