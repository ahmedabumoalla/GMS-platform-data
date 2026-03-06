'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, Users, Calendar, FileText, 
  ArrowLeft, ArrowRight, CheckCircle2, 
  Briefcase, UploadCloud, X, Plus, Loader2, 
  DollarSign, Building2, Phone, User, TrendingUp, Clock, File as FileIcon, Wrench, HardHat, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../../layout';

const PROJECT_CATEGORIES = [
  'الصيانة والتشغيل', 'الإنشاءات والمقاولات', 'تمديد الكابلات', 'البنية التحتية', 
  'الدعم الفني', 'نظافة المدن', 'تنسيق الحدائق', 'صيانة المباني', 
  'شبكات المياه', 'شبكات الصرف الصحي', 'سفلتة ورصف', 'إنارة الشوارع', 
  'صيانة المضخات', 'أعمال العزل', 'تركيب المصاعد', 'التكييف والتبريد', 
  'أنظمة الحريق', 'شبكات الاتصالات', 'إدارة المرافق', 'أخرى'
];

const ENTITY_TYPES = ['أمانة / بلدية', 'شركة الكهرباء', 'شركة المياه الوطنية', 'وزارة النقل', 'إمارة المنطقة', 'جهة خاصة', 'أخرى'];
const PREDEFINED_EQUIPMENT = ['حفارة بوكلين', 'رافعة (كرين) 50 طن', 'مولد كهربائي احتياطي', 'سيارة فحص كابلات', 'معدات سفلتة', 'مضخات مياه نزح', 'سقالات معدنية'];
const PREDEFINED_TOOLS = ['حقيبة سلامة ومهمات وقاية (PPE)', 'أجهزة قياس وفحص (ملميتر/ميجر)', 'أدوات يدوية متكاملة', 'معدات لحام', 'لوحات وعلامات تحذيرية', 'أجهزة اتصال لاسلكي'];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { lang, isDark } = useDashboard(); 
  const isRTL = lang === 'ar';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // --- Data Lists ---
  const [availableManagers, setAvailableManagers] = useState<{id: string, full_name: string}[]>([]);
  const [availableTechs, setAvailableTechs] = useState<{id: string, full_name: string}[]>([]);
  const [subcontractors, setSubcontractors] = useState<{id: string, name: string}[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFileUrls, setExistingFileUrls] = useState<string[]>([]);

  // --- Main Form State ---
  const [formData, setFormData] = useState({
    title: '',
    contractType: 'Direct',
    subcontractorId: '',
    category: '',
    customCategory: '',
    startDate: '',
    endDate: '',
    budget: '',
    contractValue: '',
    workZones: [{ region: '', description: '' }],
    entities: [{ type: 'أمانة / بلدية', name: '', contactPerson: '', phone: '' }],
    managerId: '',
    techIds: [] as string[],
    projectNotes: '',
    selectedEquipment: [] as string[],
    equipmentInput: ''
  });

  // --- 1. Load Everything ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: project, error: projError } = await supabase.from('projects').select('*').eq('id', projectId).single();
        if (projError) throw projError;

        const { data: pms } = await supabase.from('profiles').select('id, full_name').in('role', ['project_manager', 'super_admin']).eq('status', 'active');
        const { data: techs } = await supabase.from('profiles').select('id, full_name').in('role', ['technician', 'engineer']).eq('status', 'active');
        const { data: subs } = await supabase.from('subcontractors').select('id, name');
        
        if (pms) setAvailableManagers(pms);
        if (techs) setAvailableTechs(techs);
        if (subs) setSubcontractors(subs);

        if (project) {
          setFormData({
            title: project.title || '',
            contractType: project.contract_type || 'Direct',
            subcontractorId: project.subcontractor_id || '',
            category: PROJECT_CATEGORIES.includes(project.category) ? project.category : 'أخرى',
            customCategory: !PROJECT_CATEGORIES.includes(project.category) ? project.category : '',
            startDate: project.start_date || '',
            endDate: project.end_date || '',
            budget: project.budget?.toString() || '',
            contractValue: project.contract_value?.toString() || '',
            workZones: project.work_zones || [{ region: '', description: '' }],
            entities: project.client_entities || [{ type: 'أمانة / بلدية', name: '', contactPerson: '', phone: '' }],
            managerId: project.manager_id || '',
            techIds: project.assigned_techs || [],
            projectNotes: project.project_notes || '',
            selectedEquipment: project.required_tools ? project.required_tools.split('، ') : [],
            equipmentInput: ''
          });
          setExistingFileUrls(project.contract_urls || []);
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchAllData();
  }, [projectId]);

  // --- Dynamic Handlers ---
  const calculateDaysLeft = () => {
    if (!formData.endDate) return null;
    const diff = new Date(formData.endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateProfit = () => (parseFloat(formData.contractValue) || 0) - (parseFloat(formData.budget) || 0);

  const handleEntityChange = (idx: number, field: string, value: string) => {
    const newEntities = [...formData.entities];
    newEntities[idx] = { ...newEntities[idx], [field]: value };
    setFormData({ ...formData, entities: newEntities });
  };

  const handleZoneChange = (idx: number, field: string, value: string) => {
    const newZones = [...formData.workZones];
    newZones[idx] = { ...newZones[idx], [field]: value };
    setFormData({ ...formData, workZones: newZones });
  };

  const addEquipment = (val: string) => {
    const item = val.trim();
    if (item && !formData.selectedEquipment.includes(item)) {
        setFormData({ ...formData, selectedEquipment: [...formData.selectedEquipment, item], equipmentInput: '' });
    }
  };

  const toggleTech = (id: string) => {
    setFormData(prev => ({ ...prev, techIds: prev.techIds.includes(id) ? prev.techIds.filter(t => t !== id) : [...prev.techIds, id] }));
  };

  // --- Submit Update ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        let fileUrls = [...existingFileUrls];
        if (uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
                const fileName = `projects/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage.from('tech-media').upload(fileName, file);
                if (!uploadError) {
                    const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
                    fileUrls.push(data.publicUrl);
                }
            }
        }

        const finalCategory = formData.category === 'أخرى' ? formData.customCategory : formData.category;
        const { error } = await supabase.from('projects').update({
            title: formData.title,
            category: finalCategory,
            contract_type: formData.contractType,
            subcontractor_id: formData.subcontractorId || null,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            budget: parseFloat(formData.budget) || 0,
            contract_value: parseFloat(formData.contractValue) || 0,
            expected_profit: calculateProfit(),
            work_zones: formData.workZones,
            client_entities: formData.entities,
            manager_id: formData.managerId,
            assigned_techs: formData.techIds,
            required_tools: formData.selectedEquipment.join('، '),
            project_notes: formData.projectNotes,
            contract_urls: fileUrls
        }).eq('id', projectId);

        if (error) throw error;
        alert(isRTL ? 'تم التحديث بنجاح' : 'Updated successfully');
        window.location.href = '/dashboard/projects/list';
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  const glassCard = isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200";
  const inputBg = isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`min-h-screen font-sans pb-24 ${isDark ? 'bg-slate-950' : 'bg-slate-50'} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <header className={`sticky top-0 z-40 px-6 py-5 border-b backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
            </button>
            <h1 className={`text-2xl font-black ${textMain}`}>{isRTL ? 'تعديل بيانات المشروع' : 'Edit Project Data'}</h1>
          </div>
          <button disabled={isSubmitting} onClick={handleSubmit} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} {isRTL ? 'حفظ التحديثات' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-4 space-y-8">
        
        {/* Section 1: Basic */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className="text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800"><FileText className="text-blue-500"/> {isRTL ? 'البيانات الأساسية' : 'Basic Info'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'اسم المشروع':'Project Title'}</label>
                    <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-lg ${inputBg}`} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'ارتباط المشروع':'Contract Type'}</label>
                    <select value={formData.contractType} onChange={e=>setFormData({...formData, contractType:e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold ${inputBg}`}>
                        <option value="Direct">{isRTL?'عقد مباشر':'Direct'}</option>
                        <option value="Subcontract">{isRTL?'عقد بالباطن':'Subcontract'}</option>
                    </select>
                </div>
                {formData.contractType === 'Subcontract' && (
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'المقاول الرئيسي':'Subcontractor'}</label>
                        <select value={formData.subcontractorId} onChange={e=>setFormData({...formData, subcontractorId:e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold ${inputBg}`}>
                            <option value="">{isRTL?'-- اختر المقاول --':'-- Select --'}</option>
                            {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
        </section>

        {/* Section 2: Financials */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className="text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800"><DollarSign className="text-emerald-500"/> {isRTL ? 'المدة والميزانية' : 'Financials'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'تاريخ البدء':'Start'}</label><input type="date" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value})} className={`w-full p-4 rounded-xl border ${inputBg}`} /></div>
                <div><label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'تاريخ الانتهاء':'End'}</label><input type="date" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} className={`w-full p-4 rounded-xl border ${inputBg}`} /></div>
                <div><label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'قيمة العقد':'Value'}</label><input type="number" value={formData.contractValue} onChange={e=>setFormData({...formData, contractValue:e.target.value})} className={`w-full p-4 rounded-xl border ${inputBg}`} /></div>
                <div><label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'الميزانية':'Budget'}</label><input type="number" value={formData.budget} onChange={e=>setFormData({...formData, budget:e.target.value})} className={`w-full p-4 rounded-xl border ${inputBg}`} /></div>
            </div>
        </section>

        {/* Section 3: Entities */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2"><Building2 className="text-purple-500"/> {isRTL ? 'الجهات التابعة' : 'Entities'}</h3>
                <button type="button" onClick={() => setFormData({...formData, entities: [...formData.entities, {type:'', name:'', contactPerson:'', phone:''}]})} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"><Plus size={18}/></button>
            </div>
            <div className="space-y-4">
                {formData.entities.map((ent, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        <button type="button" onClick={() => setFormData({...formData, entities: formData.entities.filter((_, idx) => idx !== i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                        <select value={ent.type} onChange={e=>handleEntityChange(i, 'type', e.target.value)} className={`p-2 rounded-lg border ${inputBg}`}>{ENTITY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                        <input type="text" placeholder={isRTL?'اسم الجهة':'Name'} value={ent.name} onChange={e=>handleEntityChange(i, 'name', e.target.value)} className={`p-2 rounded-lg border ${inputBg}`} />
                        <input type="text" placeholder={isRTL?'المسؤول':'Contact'} value={ent.contactPerson} onChange={e=>handleEntityChange(i, 'contactPerson', e.target.value)} className={`p-2 rounded-lg border ${inputBg}`} />
                        <input type="text" placeholder={isRTL?'الجوال':'Phone'} value={ent.phone} onChange={e=>handleEntityChange(i, 'phone', e.target.value)} className={`p-2 rounded-lg border ${inputBg}`} />
                    </div>
                ))}
            </div>
        </section>

        {/* Section 4: Work Zones */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2"><MapPin className="text-amber-500"/> {isRTL ? 'نطاقات العمل' : 'Work Zones'}</h3>
                <button type="button" onClick={() => setFormData({...formData, workZones: [...formData.workZones, {region:'', description:''}]})} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"><Plus size={18}/></button>
            </div>
            <div className="space-y-4">
                {formData.workZones.map((zone, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 relative">
                        <button type="button" onClick={() => setFormData({...formData, workZones: formData.workZones.filter((_, idx) => idx !== i)})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                        <input type="text" placeholder={isRTL?'المنطقة':'Region'} value={zone.region} onChange={e=>handleZoneChange(i, 'region', e.target.value)} className={`md:w-1/3 p-2 rounded-lg border ${inputBg}`} />
                        <input type="text" placeholder={isRTL?'الوصف':'Desc'} value={zone.description} onChange={e=>handleZoneChange(i, 'description', e.target.value)} className={`md:w-2/3 p-2 rounded-lg border ${inputBg}`} />
                    </div>
                ))}
            </div>
        </section>

        {/* Section 5: Team */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className="text-lg font-black flex items-center gap-2 mb-6 border-b pb-4 border-slate-100 dark:border-slate-800"><Users className="text-indigo-500"/> {isRTL ? 'الفريق والمعدات' : 'Team & Gear'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'المدير المسؤول':'Manager'}</label>
                    <select value={formData.managerId} onChange={e=>setFormData({...formData, managerId:e.target.value})} className={`w-full p-4 rounded-xl border ${inputBg}`}>
                        <option value="">-- اختر --</option>
                        {availableManagers.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL?'الفنيين':'Technicians'}</label>
                    <div className={`p-4 rounded-xl border max-h-[150px] overflow-y-auto ${inputBg}`}>
                        {availableTechs.map(t=>(
                            <label key={t.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                                <input type="checkbox" checked={formData.techIds.includes(t.id)} onChange={()=>toggleTech(t.id)} className="rounded" />
                                <span className="text-sm font-bold">{t.full_name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Section 6: Equipment Tags */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className="text-lg font-black flex items-center gap-2 mb-6 border-b pb-4 border-slate-100 dark:border-slate-800"><Wrench className="text-slate-500"/> {isRTL ? 'المعدات والأدوات' : 'Tools'}</h3>
            <div className="flex gap-2 mb-4">
                <input type="text" value={formData.equipmentInput} onChange={e=>setFormData({...formData, equipmentInput:e.target.value})} placeholder={isRTL?'اكتب معدة واضغط Enter':'Type and Enter'} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); addEquipment(formData.equipmentInput);}}} className={`flex-1 p-3 rounded-xl border ${inputBg}`} />
                <button type="button" onClick={()=>addEquipment(formData.equipmentInput)} className="bg-slate-800 text-white px-4 rounded-xl">إضافة</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {formData.selectedEquipment.map(tag=>(
                    <span key={tag} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">{tag} <X size={14} className="cursor-pointer" onClick={()=>setFormData({...formData, selectedEquipment:formData.selectedEquipment.filter(t=>t!==tag)})}/></span>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50">
                    <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase">ثقيلة</div>
                    <div className="flex flex-wrap gap-2">{PREDEFINED_EQUIPMENT.map(e=><button type="button" key={e} onClick={()=>addEquipment(e)} className="text-[10px] font-bold border px-2 py-1 rounded-lg bg-white">+ {e}</button>)}</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50">
                    <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase">أدوات</div>
                    <div className="flex flex-wrap gap-2">{PREDEFINED_TOOLS.map(t=><button type="button" key={t} onClick={()=>addEquipment(t)} className="text-[10px] font-bold border px-2 py-1 rounded-lg bg-white">+ {t}</button>)}</div>
                </div>
            </div>
        </section>

        {/* Section 7: Notes & Files */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
                <h3 className="text-lg font-black flex items-center gap-2 mb-4"><FileText className="text-rose-500"/> {isRTL?'المستندات':'Docs'}</h3>
                <div onClick={()=>fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-50 transition">
                    <input type="file" ref={fileInputRef} hidden multiple onChange={e=>{if(e.target.files) setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)])}} />
                    <UploadCloud size={32} className="mx-auto text-blue-500 mb-2" />
                    <div className="text-sm font-bold">{isRTL?'رفع ملفات جديدة':'Upload New'}</div>
                </div>
                <div className="mt-4 space-y-2">
                    {existingFileUrls.map((url, i) => (
                        <div key={i} className="flex justify-between p-2 bg-blue-50/50 rounded-lg text-xs font-bold items-center border border-blue-100">
                            <span className="truncate max-w-[200px]">مرفق قديم {i+1}</span>
                            <div className="flex gap-2">
                                <a href={url} target="_blank" className="text-blue-600 underline">عرض</a>
                                <button type="button" onClick={()=>setExistingFileUrls(existingFileUrls.filter((_,idx)=>idx!==i))} className="text-red-500"><X size={14}/></button>
                            </div>
                        </div>
                    ))}
                    {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex justify-between p-2 bg-emerald-50/50 rounded-lg text-xs font-bold items-center border border-emerald-100">
                            <span className="truncate max-w-[200px] text-emerald-700">{f.name}</span>
                            <button type="button" onClick={()=>setUploadedFiles(uploadedFiles.filter((_,idx)=>idx!==i))} className="text-red-500"><X size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
                <h3 className="text-lg font-black flex items-center gap-2 mb-4"><Briefcase className="text-slate-500"/> {isRTL?'الملاحظات':'Notes'}</h3>
                <textarea rows={6} value={formData.projectNotes} onChange={e=>setFormData({...formData, projectNotes:e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm resize-none ${inputBg}`} placeholder="..." />
            </div>
        </section>

      </main>
    </div>
  );
}