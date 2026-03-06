'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, Users, Calendar, FileText, 
  ArrowLeft, ArrowRight, CheckCircle2, 
  Briefcase, UploadCloud, X, Plus, Loader2, 
  DollarSign, Building2, Phone, User, TrendingUp, Clock, File as FileIcon, Wrench, HardHat
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '../../layout';

const PROJECT_CATEGORIES = [
  'الصيانة والتشغيل', 'الإنشاءات والمقاولات', 'تمديد الكابلات', 'البنية التحتية', 
  'الدعم الفني', 'نظافة المدن', 'تنسيق الحدائق', 'صيانة المباني', 
  'شبكات المياه', 'شبكات الصرف الصحي', 'سفلتة ورصف', 'إنارة الشوارع', 
  'صيانة المضخات', 'أعمال العزل', 'تركيب المصاعد', 'التكييف والتبريد', 
  'أنظمة الحريق', 'شبكات الاتصالات', 'إدارة المرافق', 'أخرى'
];

const ENTITY_TYPES = ['أمانة / بلدية', 'شركة الكهرباء', 'شركة المياه الوطنية', 'وزارة النقل', 'إمارة المنطقة', 'جهة خاصة', 'أخرى'];

// --- قوائم المقترحات السريعة ---
const PREDEFINED_EQUIPMENT = ['حفارة بوكلين', 'رافعة (كرين) 50 طن', 'مولد كهربائي احتياطي', 'سيارة فحص كابلات', 'معدات سفلتة', 'مضخات مياه نزح', 'سقالات معدنية'];
const PREDEFINED_TOOLS = ['حقيبة سلامة ومهمات وقاية (PPE)', 'أجهزة قياس وفحص (ملميتر/ميجر)', 'أدوات يدوية متكاملة', 'معدات لحام', 'لوحات وعلامات تحذيرية', 'أجهزة اتصال لاسلكي'];

export default function EnterpriseProjectCreate() {
  const router = useRouter();
  const { lang, isDark } = useDashboard(); 
  const isRTL = lang === 'ar';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // --- Data States ---
  const [availableManagers, setAvailableManagers] = useState<{id: string, full_name: string}[]>([]);
  const [availableTechs, setAvailableTechs] = useState<{id: string, full_name: string}[]>([]);
  const [subcontractors, setSubcontractors] = useState<{id: string, name: string}[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // --- Equipment Tags Logic ---
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');

  // --- Form State ---
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
    projectNotes: ''
  });

  // Fetch Dropdown Data
  useEffect(() => {
    const fetchData = async () => {
      const { data: pms } = await supabase.from('profiles').select('id, full_name').in('role', ['project_manager', 'super_admin']).eq('status', 'active');
      const { data: techs } = await supabase.from('profiles').select('id, full_name').in('role', ['technician', 'engineer']).eq('status', 'active');
      const { data: subs } = await supabase.from('subcontractors').select('id, name');
      
      if (pms) setAvailableManagers(pms);
      if (techs) setAvailableTechs(techs);
      if (subs) setSubcontractors(subs);
    };
    fetchData();
  }, []);

  // --- Dynamic Calculations ---
  const calculateDaysLeft = () => {
    if (!formData.endDate) return null;
    const end = new Date(formData.endDate).getTime();
    const start = formData.startDate ? new Date(formData.startDate).getTime() : new Date().getTime();
    const diff = end - start;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateProfit = () => {
    const value = parseFloat(formData.contractValue) || 0;
    const budget = parseFloat(formData.budget) || 0;
    return value - budget;
  };

  // --- Multi-Fields Handlers (Entities) ---
  const handleAddEntity = () => setFormData(prev => ({ ...prev, entities: [...prev.entities, { type: 'أمانة / بلدية', name: '', contactPerson: '', phone: '' }] }));
  const handleRemoveEntity = (idx: number) => setFormData(prev => ({ ...prev, entities: prev.entities.filter((_, i) => i !== idx) }));
  const handleEntityChange = (idx: number, field: string, value: string) => {
      const newEntities = [...formData.entities];
      newEntities[idx] = { ...newEntities[idx], [field]: value };
      setFormData(prev => ({ ...prev, entities: newEntities }));
  };

  // --- Multi-Fields Handlers (Work Zones) ---
  const handleAddZone = () => setFormData(prev => ({ ...prev, workZones: [...prev.workZones, { region: '', description: '' }] }));
  const handleRemoveZone = (idx: number) => setFormData(prev => ({ ...prev, workZones: prev.workZones.filter((_, i) => i !== idx) }));
  const handleZoneChange = (idx: number, field: string, value: string) => {
      const newZones = [...formData.workZones];
      newZones[idx] = { ...newZones[idx], [field]: value };
      setFormData(prev => ({ ...prev, workZones: newZones }));
  };

  // --- Equipment Handlers ---
  const addEquipment = (val: string) => {
      const item = val.trim();
      if (item && !selectedEquipment.includes(item)) {
          setSelectedEquipment([...selectedEquipment, item]);
      }
      setEquipmentInput('');
  };

  const removeEquipment = (item: string) => {
      setSelectedEquipment(selectedEquipment.filter(e => e !== item));
  };

  const handleEquipmentKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          addEquipment(equipmentInput);
      }
  };

  // --- Techs & Files Handlers ---
  const toggleTech = (id: string) => {
      setFormData(prev => ({
          ...prev, 
          techIds: prev.techIds.includes(id) ? prev.techIds.filter(t => t !== id) : [...prev.techIds, id]
      }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setUploadedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (idx: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // 🚀 --- Subcontractor Routing Handler ---
  const handleSubcontractorChange = (value: string) => {
      if (value === 'NEW') {
          // توجيه لصفحة إنشاء المقاول الجديدة
          router.push('/dashboard/subcontractors/create'); 
      } else {
          setFormData(prev => ({ 
              ...prev, 
              subcontractorId: value, 
              contractType: value ? 'Subcontract' : 'Direct'
          }));
      }
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.managerId) {
        alert(isRTL ? 'يرجى إكمال البيانات الأساسية (الاسم، التصنيف، مدير المشروع)' : 'Please fill basic info');
        return;
    }
    setIsSubmitting(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Auth Error');

        // 1. Upload Files
        let fileUrls: string[] = [];
        if (uploadedFiles.length > 0) {
            setUploadingFiles(true);
            for (const file of uploadedFiles) {
                const fileName = `projects/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage.from('tech-media').upload(fileName, file);
                if (!uploadError) {
                    const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
                    fileUrls.push(data.publicUrl);
                }
            }
            setUploadingFiles(false);
        }

        // 2. Insert Project
        const finalCategory = formData.category === 'أخرى' ? formData.customCategory : formData.category;
        const requiredToolsText = selectedEquipment.join('، ');
        
        const { data: projectData, error: projError } = await supabase.from('projects').insert({
            created_by: user.id,
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
            required_tools: requiredToolsText,
            project_notes: formData.projectNotes,
            contract_urls: fileUrls,
            status: 'Active'
        }).select().single();

        if (projError) throw projError;

        // 3. Assign Techs
        if (formData.techIds.length > 0 && projectData) {
            const assignments = formData.techIds.map(techId => ({
                project_id: projectData.id,
                tech_id: techId,
                assigned_by: user.id,
                status: 'Pending'
            }));
            await supabase.from('task_assignments').insert(assignments);
        }

        alert(isRTL ? 'تم تسجيل المشروع بنجاح!' : 'Project registered successfully!');
        router.push('/dashboard/projects/list');

    } catch (error: any) {
        console.error(error);
        alert(isRTL ? 'حدث خطأ أثناء الحفظ: ' + error.message : 'Error saving: ' + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- UI Helpers ---
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
            <div>
              <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                <Briefcase className="text-blue-600" /> {isRTL ? 'تأسيس مشروع جديد' : 'Setup New Project'}
              </h1>
              <p className={`text-sm font-medium mt-1 ${textSub}`}>{isRTL ? 'تسجيل تفاصيل العقد، النطاق، والمالية في مكان واحد.' : 'Register contract, scope, and financials.'}</p>
            </div>
          </div>
          <button type="button" disabled={isSubmitting} onClick={handleSubmit} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
              {isRTL ? 'حفظ واعتماد المشروع' : 'Save Project'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-4 space-y-8">
        
        {/* Section 1: Basic Info */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className={`text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                <FileText className="text-blue-500" size={20}/> {isRTL ? 'البيانات الأساسية للعقد' : 'Basic Contract Info'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'اسم المشروع / العقد *' : 'Project Name *'}</label>
                    <input type="text" required placeholder={isRTL ? 'مثال: مشروع صيانة وتأهيل طرق الأمانة...' : 'e.g. Road Maintenance Project'} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-lg transition ${inputBg}`} />
                </div>

                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'ارتباط المشروع' : 'Contract Type'}</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${formData.contractType === 'Direct' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500' : inputBg}`}>
                            <input type="radio" name="ctype" checked={formData.contractType === 'Direct'} onChange={() => setFormData({...formData, contractType: 'Direct', subcontractorId: ''})} className="hidden" />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.contractType === 'Direct' ? 'border-blue-600' : 'border-slate-300'}`}>{formData.contractType === 'Direct' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}</div>
                            <span className="font-bold text-sm">{isRTL ? 'عقد مباشر للشركة' : 'Direct Contract'}</span>
                        </label>
                        <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${formData.contractType === 'Subcontract' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/20 dark:border-amber-500' : inputBg}`}>
                            <input type="radio" name="ctype" checked={formData.contractType === 'Subcontract'} onChange={() => setFormData({...formData, contractType: 'Subcontract'})} className="hidden" />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.contractType === 'Subcontract' ? 'border-amber-600' : 'border-slate-300'}`}>{formData.contractType === 'Subcontract' && <div className="w-2.5 h-2.5 bg-amber-600 rounded-full"></div>}</div>
                            <span className="font-bold text-sm">{isRTL ? 'عقد بالباطن' : 'Subcontractor'}</span>
                        </label>
                    </div>
                </div>

                {formData.contractType === 'Subcontract' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'اختر المقاول الأساسي' : 'Select Subcontractor'}</label>
                        
                        {/* 🚀 القائمة المحدثة بالخيار الجديد والتوجيه */}
                        <select 
                            value={formData.subcontractorId} 
                            onChange={e => handleSubcontractorChange(e.target.value)} 
                            className={`w-full p-4 rounded-xl border outline-none focus:border-amber-500 font-bold text-sm cursor-pointer ${inputBg}`}
                        >
                            <option value="">{isRTL ? '-- اختر المقاول --' : '-- Select --'}</option>
                            <optgroup label={isRTL ? "المقاولين المسجلين" : "Registered Subcontractors"}>
                                {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </optgroup>
                            <optgroup label="---------------------">
                                <option value="NEW" className="text-blue-600 font-black">{isRTL ? '+ إضافة مقاول رئيسي جديد' : '+ Add New Subcontractor'}</option>
                            </optgroup>
                        </select>
                    </div>
                )}

                <div className={formData.contractType === 'Direct' ? 'md:col-span-1' : 'md:col-span-2'}>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'نوع أعمال المشروع *' : 'Project Category *'}</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm cursor-pointer ${inputBg}`}>
                        <option value="">{isRTL ? '-- اختر النوع --' : '-- Select Category --'}</option>
                        {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {formData.category === 'أخرى' && (
                    <div className="md:col-span-2 animate-in fade-in">
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'اكتب نوع المشروع المخصص' : 'Specify Category'}</label>
                        <input type="text" required value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm ${inputBg}`} />
                    </div>
                )}
            </div>
        </section>

        {/* Section 2: Financials & Timeline */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className={`text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                <Calendar className="text-emerald-500" size={20}/> {isRTL ? 'المدة والميزانية' : 'Timeline & Financials'}
            </h3>

            <div className={`mb-8 p-6 rounded-2xl border flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x rtl:divide-x-reverse ${isDark ? 'bg-slate-900/50 border-slate-700 divide-slate-700' : 'bg-slate-50 border-slate-200 divide-slate-200'}`}>
                <div className="flex-1 pb-4 md:pb-0 md:px-6 text-center">
                    <div className={`text-xs font-bold mb-1 ${textSub}`}><Clock className="inline w-4 h-4 mr-1"/> {isRTL ? 'مدة العقد المتبقية' : 'Days Left'}</div>
                    <div className={`text-3xl font-black ${calculateDaysLeft() === null ? 'text-slate-300' : calculateDaysLeft()! < 30 ? 'text-red-500' : 'text-blue-600'}`}>
                        {calculateDaysLeft() === null ? '-' : calculateDaysLeft()!} <span className="text-sm font-medium">{isRTL ? 'يوم' : 'Days'}</span>
                    </div>
                </div>
                <div className="flex-1 pt-4 md:pt-0 md:px-6 text-center">
                    <div className={`text-xs font-bold mb-1 ${textSub}`}><TrendingUp className="inline w-4 h-4 mr-1"/> {isRTL ? 'الربح المتوقع' : 'Expected Profit'}</div>
                    <div className={`text-3xl font-black ${calculateProfit() > 0 ? 'text-emerald-500' : calculateProfit() < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                        {calculateProfit() > 0 ? '+' : ''}{calculateProfit().toLocaleString()} <span className="text-sm font-medium">SAR</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'تاريخ البدء' : 'Start Date'}</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm ${inputBg}`} />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'تاريخ الانتهاء' : 'End Date'}</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm ${inputBg}`} />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'قيمة العقد الكلية (الإيراد)' : 'Total Contract Value'}</label>
                    <div className="relative">
                        <DollarSign className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-slate-400`} size={20}/>
                        <input type="number" value={formData.contractValue} onChange={e => setFormData({...formData, contractValue: e.target.value})} placeholder="0.00" className={`w-full p-4 rounded-xl border outline-none focus:border-emerald-500 font-bold text-lg ${inputBg} ${isRTL ? 'pl-12' : 'pr-12'}`} />
                    </div>
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'الميزانية المعتمدة (التكلفة)' : 'Approved Budget (Cost)'}</label>
                    <div className="relative">
                        <DollarSign className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-slate-400`} size={20}/>
                        <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="0.00" className={`w-full p-4 rounded-xl border outline-none focus:border-red-500 font-bold text-lg ${inputBg} ${isRTL ? 'pl-12' : 'pr-12'}`} />
                    </div>
                </div>
            </div>
        </section>

        {/* Section 3: Entities & Clients */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className={`text-lg font-black flex items-center gap-2 ${textMain}`}>
                    <Building2 className="text-purple-500" size={20}/> {isRTL ? 'الجهات التابع لها العقد' : 'Client Entities'}
                </h3>
                <button type="button" onClick={handleAddEntity} className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400 rounded-lg text-xs font-bold transition flex items-center gap-1">
                    <Plus size={14}/> {isRTL ? 'إضافة جهة أخرى' : 'Add Entity'}
                </button>
            </div>

            <div className="space-y-4">
                {formData.entities.map((entity, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                           <span className="text-xs font-bold text-slate-500">{isRTL ? `جهة ارتباط #${idx + 1}` : `Entity #${idx + 1}`}</span>
                           {formData.entities.length > 1 && (
                               <button type="button" onClick={() => handleRemoveEntity(idx)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                                   <X size={14}/> {isRTL ? 'إزالة هذه الجهة' : 'Remove'}
                               </button>
                           )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'نوع الجهة' : 'Entity Type'}</label>
                                <select value={entity.type} onChange={(e) => handleEntityChange(idx, 'type', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold cursor-pointer ${inputBg}`}>
                                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'اسم الجهة / الفرع' : 'Entity / Branch Name'}</label>
                                <input type="text" placeholder={isRTL ? 'مثال: بلدية شمال الرياض' : 'e.g. North Riyadh Municipality'} value={entity.name} onChange={(e) => handleEntityChange(idx, 'name', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'الشخص المسؤول (المهندس/المشرف)' : 'Contact Person'}</label>
                                <div className="relative">
                                    <User className="absolute top-3.5 rtl:right-3 ltr:left-3 text-slate-400" size={16}/>
                                    <input type="text" placeholder={isRTL ? 'اسم المسؤول أو منصبه' : 'Name or Title'} value={entity.contactPerson} onChange={(e) => handleEntityChange(idx, 'contactPerson', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold rtl:pr-10 ltr:pl-10 ${inputBg}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'رقم التواصل' : 'Phone Number'}</label>
                                <div className="relative">
                                    <Phone className="absolute top-3.5 rtl:right-3 ltr:left-3 text-slate-400" size={16}/>
                                    <input type="tel" dir="ltr" placeholder="05xxxxxxxx" value={entity.phone} onChange={(e) => handleEntityChange(idx, 'phone', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold rtl:pr-10 ltr:pl-10 rtl:text-right ${inputBg}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Section 4: Work Zones */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className={`text-lg font-black flex items-center gap-2 ${textMain}`}>
                    <MapPin className="text-amber-500" size={20}/> {isRTL ? 'نطاقات ومواقع العمل' : 'Work Zones'}
                </h3>
                <button type="button" onClick={handleAddZone} className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 rounded-lg text-xs font-bold transition flex items-center gap-1">
                    <Plus size={14}/> {isRTL ? 'إضافة نطاق عمل' : 'Add Zone'}
                </button>
            </div>

            <div className="space-y-4">
                {formData.workZones.map((zone, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                           <span className="text-xs font-bold text-slate-500">{isRTL ? `نطاق العمل #${idx + 1}` : `Zone #${idx + 1}`}</span>
                           {formData.workZones.length > 1 && (
                               <button type="button" onClick={() => handleRemoveZone(idx)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                                   <X size={14}/> {isRTL ? 'إزالة هذا النطاق' : 'Remove'}
                               </button>
                           )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="w-full md:w-1/3">
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'المنطقة / المدينة' : 'Region / City'}</label>
                                <input type="text" placeholder={isRTL ? 'مثال: المنطقة الجنوبية' : 'e.g. Southern Region'} value={zone.region} onChange={(e) => handleZoneChange(idx, 'region', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                            </div>
                            <div className="w-full md:w-2/3">
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'وصف الموقع الدقيق ومجال التغطية' : 'Location Details'}</label>
                                <input type="text" placeholder={isRTL ? 'شرح لمكان تنفيذ الأعمال في هذا النطاق...' : 'Specific details...'} value={zone.description} onChange={(e) => handleZoneChange(idx, 'description', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Section 5: Team & Resources */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className={`text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                <Users className="text-indigo-500" size={20}/> {isRTL ? 'فريق العمل والموارد' : 'Team & Resources'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Manager */}
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'مدير المشروع المسؤول *' : 'Project Manager *'}</label>
                    <select required value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm cursor-pointer ${inputBg}`}>
                        <option value="">{isRTL ? '-- اختر مدير المشروع --' : '-- Select Manager --'}</option>
                        {availableManagers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                    <p className="text-[10px] mt-2 text-amber-600 font-bold flex items-center gap-1"><Briefcase size={12}/> {isRTL ? 'ملاحظة: المدير سيتمكن من التحكم بالعقد وطلب الفنيين.' : 'Manager handles the contract.'}</p>
                </div>

                {/* Technicians */}
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'إسناد مبدئي للفنيين (اختياري)' : 'Key Technicians (Optional)'}</label>
                    <div className={`p-4 rounded-xl border max-h-[150px] overflow-y-auto custom-scrollbar ${inputBg}`}>
                        {availableTechs.map(tech => (
                            <label key={tech.id} className="flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300" checked={formData.techIds.includes(tech.id)} onChange={() => toggleTech(tech.id)} />
                                <span className="text-sm font-bold">{tech.full_name}</span>
                            </label>
                        ))}
                        {availableTechs.length === 0 && <span className="text-xs text-slate-400">{isRTL ? 'لا يوجد فنيين متاحين حالياً' : 'No available technicians'}</span>}
                    </div>
                </div>

                {/* Smart Equipment & Tools Input */}
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-dashed border-slate-200/50">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'المعدات والأدوات المطلوبة للعقد' : 'Required Equipment & Tools'}</label>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Wrench className="absolute top-4 rtl:right-4 ltr:left-4 text-slate-400" size={20}/>
                            <input 
                                type="text" 
                                value={equipmentInput} 
                                onChange={(e) => setEquipmentInput(e.target.value)} 
                                onKeyDown={handleEquipmentKeyDown}
                                placeholder={isRTL ? 'اكتب اسم المعدة / الأداة واضغط Enter للإضافة...' : 'Type tool and press Enter...'} 
                                className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm rtl:pr-12 ltr:pl-12 ${inputBg}`} 
                            />
                        </div>
                        <button type="button" onClick={() => addEquipment(equipmentInput)} className="px-6 py-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition">
                            {isRTL ? 'إضافة' : 'Add'}
                        </button>
                    </div>

                    {selectedEquipment.length > 0 && (
                        <div className={`flex flex-wrap gap-2 p-4 rounded-xl border min-h-[60px] ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                            {selectedEquipment.map(item => (
                                <span key={item} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                                    <HardHat size={14} className="opacity-70"/> {item}
                                    <button type="button" onClick={() => removeEquipment(item)} className="hover:text-red-300 ml-1 transition-colors"><X size={14}/></button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">{isRTL ? 'مقترحات سريعة (معدات وآليات ثقيلة)' : 'Quick Heavy Equipment'}</div>
                            <div className="flex flex-wrap gap-2">
                                {PREDEFINED_EQUIPMENT.map(eq => (
                                    <button type="button" key={eq} onClick={() => addEquipment(eq)} disabled={selectedEquipment.includes(eq)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${selectedEquipment.includes(eq) ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:border-blue-500 hover:text-blue-600 border-slate-200 text-slate-700'}`}>
                                        + {eq}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">{isRTL ? 'مقترحات سريعة (أدوات خفيفة وسلامة)' : 'Quick Tools & Safety'}</div>
                            <div className="flex flex-wrap gap-2">
                                {PREDEFINED_TOOLS.map(tool => (
                                    <button type="button" key={tool} onClick={() => addEquipment(tool)} disabled={selectedEquipment.includes(tool)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${selectedEquipment.includes(tool) ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:border-amber-500 hover:text-amber-600 border-slate-200 text-slate-700'}`}>
                                        + {tool}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Section 6: Documents & Notes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upload */}
            <div className={`p-8 rounded-[2rem] shadow-sm flex flex-col ${glassCard}`}>
                <h3 className={`text-lg font-black flex items-center gap-2 mb-4 ${textMain}`}>
                    <FileText className="text-rose-500" size={20}/> {isRTL ? 'العقود والمستندات' : 'Contracts & Docs'}
                </h3>
                <div onClick={() => fileInputRef.current?.click()} className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${isDark ? 'border-slate-700 bg-slate-800/30 hover:border-blue-500' : 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50'}`}>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                    <UploadCloud size={32} className="text-blue-500 mb-3"/>
                    <div className="text-sm font-bold mb-1">{isRTL ? 'اضغط لرفع المستندات والملفات' : 'Click to Upload'}</div>
                    <div className="text-xs text-slate-400">{isRTL ? 'يدعم الصور، PDF، وورد، اكسل، والمزيد' : 'Supports Images, PDFs, Docs'}</div>
                </div>
                {/* Uploaded List */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                        {uploadedFiles.map((file, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg ${file.type.includes('pdf') ? 'bg-red-100 text-red-600' : file.type.includes('image') ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}><FileIcon size={16}/></div>
                                    <div className="truncate"><div className={`text-xs font-bold truncate ${textMain}`}>{file.name}</div><div className={`text-[10px] ${textSub}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</div></div>
                                </div>
                                <button type="button" onClick={() => removeFile(idx)} className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><X size={16}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className={`p-8 rounded-[2rem] shadow-sm flex flex-col ${glassCard}`}>
                <h3 className={`text-lg font-black flex items-center gap-2 mb-4 ${textMain}`}>
                    <Briefcase className="text-slate-500" size={20}/> {isRTL ? 'ملاحظات وتفاصيل العمل' : 'Project Notes'}
                </h3>
                <textarea placeholder={isRTL ? 'اكتب أي ملاحظات تخص تفاصيل العمل، الشروط الخاصة، طريقة التنفيذ، أو متطلبات إضافية من العميل...' : 'Any special conditions or details...'} value={formData.projectNotes} onChange={e => setFormData({...formData, projectNotes: e.target.value})} className={`flex-1 w-full p-4 rounded-2xl border outline-none focus:border-blue-500 font-bold text-sm resize-none ${inputBg}`} />
            </div>

        </section>

      </main>

    </div>
  );
}