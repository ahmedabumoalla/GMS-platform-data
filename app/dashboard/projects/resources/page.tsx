'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Truck, Users, Hammer, Plus, Search, 
  Filter, BrainCircuit, Globe, Wrench, 
  CheckCircle2, Clock, History, ArrowRightLeft, LayoutGrid, List, X, Save, AlertTriangle, Calendar
} from 'lucide-react';

// --- Types & Interfaces ---
type ResourceType = 'Equipment' | 'Vehicle' | 'Manpower' | 'Material';
type ResourceStatus = 'Available' | 'In Use' | 'Maintenance' | 'Reserved';

interface Resource {
  id: string;
  name: string;
  code: string;
  type: ResourceType;
  status: ResourceStatus;
  assignedTo: string;
  location: string;
  utilization: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export default function EnterpriseResourcesPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<ResourceType | 'All'>('All');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- حالات النوافذ المنبثقة (Modals) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'assign' | 'maintenance' | 'history' | null;
    resource: Resource | null;
  }>({ isOpen: false, type: null, resource: null });

  // حالة لتخزين مدخلات نافذة الإجراءات (التخصيص والصيانة)
  const [actionFormData, setActionFormData] = useState({
    assignProject: '',
    maintenanceType: 'Routine', // Routine | Repair
    notes: ''
  });

  // بيانات المورد الجديد للإضافة
  const [newResource, setNewResource] = useState<{ name: string; code: string; type: ResourceType }>({ name: '', code: '', type: 'Equipment' });

  // --- Mock Data ---
  useEffect(() => {
    setTimeout(() => {
      setResources([
        { 
          id: '1', name: lang === 'ar' ? 'حفار كاتربيلر CAT-320' : 'Caterpillar Excavator CAT-320', 
          code: 'EQ-204', type: 'Equipment', status: 'In Use', 
          assignedTo: lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project', location: 'Zone A',
          utilization: 85, lastMaintenance: '2023-12-15', nextMaintenance: '2024-03-15'
        },
        { 
          id: '2', name: lang === 'ar' ? 'رافعة شوكية تويوتا' : 'Toyota Forklift', 
          code: 'EQ-105', type: 'Equipment', status: 'Available', 
          assignedTo: '-', location: 'Warehouse 1',
          utilization: 10, lastMaintenance: '2024-01-10', nextMaintenance: '2024-04-10'
        },
        { 
          id: '3', name: lang === 'ar' ? 'تويوتا هايلكس 2023' : 'Toyota Hilux 2023', 
          code: 'VH-990', type: 'Vehicle', status: 'Maintenance', 
          assignedTo: lang === 'ar' ? 'فريق الصيانة' : 'Maintenance Team', location: 'Workshop',
          utilization: 92, lastMaintenance: '2023-11-20', nextMaintenance: 'Urgent'
        },
        { 
          id: '4', name: lang === 'ar' ? 'مولد كهرباء احتياطي' : 'Backup Generator', 
          code: 'EQ-002', type: 'Equipment', status: 'Reserved', 
          assignedTo: lang === 'ar' ? 'مشروع الطوارئ' : 'Emergency Ops', location: 'Zone C',
          utilization: 0, lastMaintenance: '2024-02-01', nextMaintenance: '2024-08-01'
        },
        { 
          id: '5', name: lang === 'ar' ? 'سعيد القحطاني - فني أول' : 'Saeed Al-Qahtani - Sr Tech', 
          code: 'EMP-101', type: 'Manpower', status: 'In Use', 
          assignedTo: lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project', location: 'Site',
          utilization: 98, lastMaintenance: '-', nextMaintenance: '-'
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Handlers ---
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const runAiOptimization = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiInsight(lang === 'ar' 
        ? 'تحليل الموارد: تم اكتشاف استخدام مفرط للمركبة VH-990 مما يستدعي صيانة مبكرة. يُنصح بإعادة توجيه مركبة بديلة من المستودع لتجنب التوقف.' 
        : 'Resource Analysis: Over-utilization detected for VH-990 requiring early maintenance. Suggest reallocating spare vehicle from warehouse to prevent downtime.');
    }, 2000);
  };

  const handleAddResource = () => {
    if (!newResource.name || !newResource.code) return;
    const newRes: Resource = {
        id: Math.random().toString(36).substr(2, 9),
        name: newResource.name,
        code: newResource.code,
        type: newResource.type,
        status: 'Available',
        assignedTo: '-',
        location: 'Main Warehouse',
        utilization: 0,
        lastMaintenance: '-',
        nextMaintenance: '-'
    };
    setResources([newRes, ...resources]);
    setIsAddModalOpen(false);
    setNewResource({ name: '', code: '', type: 'Equipment' });
  };

  // فتح نافذة الإجراء وتهيئة البيانات
  const openActionModal = (type: 'assign' | 'maintenance' | 'history', resource: Resource) => {
    // تعيين القيم الافتراضية عند الفتح
    setActionFormData({
        assignProject: lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project',
        maintenanceType: 'Routine',
        notes: ''
    });
    setActionModal({ isOpen: true, type, resource });
  };

  // تنفيذ الإجراء وتحديث الحالة
  const executeAction = () => {
    if (!actionModal.resource) return;

    let updatedStatus = actionModal.resource.status;
    let updatedAssign = actionModal.resource.assignedTo;
    let updatedMaintenance = actionModal.resource.nextMaintenance;

    if (actionModal.type === 'assign') {
        updatedStatus = 'In Use';
        updatedAssign = actionFormData.assignProject; // استخدام المشروع المختار
    } else if (actionModal.type === 'maintenance') {
        updatedStatus = 'Maintenance';
        // تحديث النص بناءً على نوع الصيانة المختار
        updatedAssign = actionFormData.maintenanceType === 'Routine' 
            ? (lang === 'ar' ? 'صيانة دورية' : 'Routine Maint.')
            : (lang === 'ar' ? 'إصلاح عطل' : 'Repair');
        updatedMaintenance = lang === 'ar' ? 'جاري العمل' : 'In Progress';
    }

    setResources(resources.map(r => r.id === actionModal.resource?.id ? { 
        ...r, 
        status: updatedStatus, 
        assignedTo: updatedAssign,
        nextMaintenance: updatedMaintenance
    } : r));

    setActionModal({ isOpen: false, type: null, resource: null });
  };

  const filteredResources = resources.filter(r => activeTab === 'All' ? true : r.type === activeTab);

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Box className="text-blue-600" />
              {lang === 'ar' ? 'إدارة وتخصيص الموارد' : 'Enterprise Resource Management'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'تتبع المعدات، المركبات، والقوى العاملة وتخصيصها للمشاريع' : 'Track, allocate, and optimize equipment, vehicles, and manpower'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2">
                <Plus size={16} /> {lang === 'ar' ? 'إضافة مورد' : 'Add Resource'}
             </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'المعدات الثقيلة' : 'Heavy Equipment'} value="45" total="50" color="blue" icon={Hammer} />
            <StatCard label={lang === 'ar' ? 'أسطول المركبات' : 'Fleet Vehicles'} value="12" total="15" color="purple" icon={Truck} />
            <StatCard label={lang === 'ar' ? 'القوى العاملة' : 'Manpower'} value="86" total="90" color="emerald" icon={Users} />
            <StatCard label={lang === 'ar' ? 'تحت الصيانة' : 'Under Maint.'} value="3" total="Critical" color="amber" icon={Wrench} />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                {['All', 'Equipment', 'Vehicle', 'Manpower', 'Material'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab === 'All' ? (lang === 'ar' ? 'الكل' : 'All') : tab}
                    </button>
                ))}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder={lang === 'ar' ? 'بحث بالكود أو الاسم...' : 'Search code, name...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
                </div>
                <button onClick={runAiOptimization} className="p-2 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl hover:bg-purple-100 transition" title="AI Optimization">
                    <BrainCircuit size={18} className={isAiAnalyzing ? 'animate-pulse' : ''} />
                </button>
            </div>
        </div>

        {/* AI Insight */}
        {aiInsight && (
            <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm"><BrainCircuit size={18}/></div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">{aiInsight}</p>
            </div>
        )}
      </div>

      {/* Table */}
      <div className="p-6">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل سجل الموارد...' : 'Loading resource registry...'}</div>
        ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left rtl:text-right">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                            <th className="p-5">{lang === 'ar' ? 'المورد & الكود' : 'Resource & Code'}</th>
                            <th className="p-5">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="p-5">{lang === 'ar' ? 'المشروع / الموقع' : 'Project / Location'}</th>
                            <th className="p-5">{lang === 'ar' ? 'الاستخدام' : 'Utilization'}</th>
                            <th className="p-5">{lang === 'ar' ? 'الصيانة القادمة' : 'Next Maint.'}</th>
                            <th className="p-5 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredResources.map((res) => (
                            <tr key={res.id} className="hover:bg-slate-50 transition group">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">{getResourceIcon(res.type)}</div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{res.name}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5 bg-slate-100 px-1.5 rounded inline-block">{res.code}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5"><StatusBadge status={res.status} lang={lang} /></td>
                                <td className="p-5">
                                    <div className="text-sm font-bold text-slate-700">{res.assignedTo}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPinIcon size={10} /> {res.location}</div>
                                </td>
                                <td className="p-5 w-48">
                                    <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-600">{res.utilization}%</span></div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${getUtilizationColor(res.utilization)}`} style={{ width: `${res.utilization}%` }}></div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className={`text-sm font-bold ${res.nextMaintenance === 'Urgent' ? 'text-red-600' : 'text-slate-600'}`}>{res.nextMaintenance}</div>
                                    <div className="text-xs text-slate-400 mt-1">{lang === 'ar' ? 'آخر صيانة:' : 'Last:'} {res.lastMaintenance}</div>
                                </td>
                                <td className="p-5 text-end">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* زر التخصيص */}
                                        <button 
                                            onClick={() => openActionModal('assign', res)}
                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition" 
                                            title={lang === 'ar' ? 'تخصيص لمشروع' : 'Assign'}
                                        >
                                            <ArrowRightLeft size={16} />
                                        </button>
                                        {/* زر الصيانة */}
                                        <button 
                                            onClick={() => openActionModal('maintenance', res)}
                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-amber-600 hover:border-amber-300 transition" 
                                            title={lang === 'ar' ? 'تسجيل صيانة' : 'Maintenance'}
                                        >
                                            <Wrench size={16} />
                                        </button>
                                        {/* زر السجل */}
                                        <button 
                                            onClick={() => openActionModal('history', res)}
                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:border-slate-400 transition" 
                                            title={lang === 'ar' ? 'عرض السجل' : 'History'}
                                        >
                                            <History size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* --- Action Modal (نافذة الإجراءات الموحدة) --- */}
      {actionModal.isOpen && actionModal.resource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">
                        {actionModal.type === 'assign' && (lang === 'ar' ? 'تخصيص المورد' : 'Assign Resource')}
                        {actionModal.type === 'maintenance' && (lang === 'ar' ? 'تسجيل صيانة' : 'Log Maintenance')}
                        {actionModal.type === 'history' && (lang === 'ar' ? 'سجل المورد' : 'Resource History')}
                    </h3>
                    <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"><X size={20} /></button>
                </div>
                
                <div className="p-6 space-y-4">
                    {/* معلومات المورد */}
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">{getResourceIcon(actionModal.resource.type)}</div>
                        <div>
                            <div className="font-bold text-slate-800">{actionModal.resource.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{actionModal.resource.code}</div>
                        </div>
                    </div>

                    {/* خيارات التخصيص */}
                    {actionModal.type === 'assign' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{lang === 'ar' ? 'تعيين إلى مشروع' : 'Assign to Project'}</label>
                            <select 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500"
                                value={actionFormData.assignProject}
                                onChange={(e) => setActionFormData({...actionFormData, assignProject: e.target.value})}
                            >
                                <option>{lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project'}</option>
                                <option>{lang === 'ar' ? 'مشروع صيانة الشبكات' : 'Network Maintenance'}</option>
                                <option>{lang === 'ar' ? 'مشروع الطوارئ' : 'Emergency Project'}</option>
                            </select>
                        </div>
                    )}

                    {/* خيارات الصيانة (تم الإصلاح هنا) */}
                    {actionModal.type === 'maintenance' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{lang === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}</label>
                            <div className="flex gap-2 mb-3">
                                <button 
                                    onClick={() => setActionFormData({...actionFormData, maintenanceType: 'Routine'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                        actionFormData.maintenanceType === 'Routine' 
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {lang === 'ar' ? 'دورية' : 'Routine'}
                                </button>
                                <button 
                                    onClick={() => setActionFormData({...actionFormData, maintenanceType: 'Repair'})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${
                                        actionFormData.maintenanceType === 'Repair' 
                                        ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {lang === 'ar' ? 'إصلاح عطل' : 'Repair'}
                                </button>
                            </div>
                            <textarea 
                                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none resize-none focus:border-blue-500 transition" 
                                placeholder={lang === 'ar' ? 'ملاحظات الصيانة...' : 'Maintenance notes...'}
                                value={actionFormData.notes}
                                onChange={(e) => setActionFormData({...actionFormData, notes: e.target.value})}
                            ></textarea>
                        </div>
                    )}

                    {/* سجل التاريخ */}
                    {actionModal.type === 'history' && (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3 text-sm border-l-2 border-slate-200 pl-3 py-1 relative">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-300"></div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-700">{lang === 'ar' ? 'نقل إلى الموقع' : 'Moved to Site'}</div>
                                        <div className="text-xs text-slate-400">2024-02-0{i} • By Ahmed</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* أزرار الحفظ والإلغاء */}
                {actionModal.type !== 'history' && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                        <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button onClick={executeAction} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200">
                            {lang === 'ar' ? 'تأكيد' : 'Confirm'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- Add Resource Modal (نافذة الإضافة) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'إضافة مورد جديد' : 'Add New Resource'}</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'اسم المورد' : 'Resource Name'}</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold" value={newResource.name} onChange={(e) => setNewResource({...newResource, name: e.target.value})} placeholder={lang === 'ar' ? 'مثال: حفار، سيارة...' : 'e.g. Excavator...'} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'كود المورد' : 'Resource Code'}</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-mono" value={newResource.code} onChange={(e) => setNewResource({...newResource, code: e.target.value})} placeholder="EQ-000" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'النوع' : 'Type'}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Equipment', 'Vehicle', 'Manpower', 'Material'].map((type) => (
                                <button key={type} onClick={() => setNewResource({...newResource, type: type as ResourceType})} className={`py-2 rounded-lg text-xs font-bold border ${newResource.type === type ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{type}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={handleAddResource} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 flex items-center justify-center gap-2"><Save size={16} /> {lang === 'ar' ? 'حفظ' : 'Save'}</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// ... Helper Functions (StatCard, StatusBadge, etc.) - Same as before
function StatCard({ label, value, total, color, icon: Icon }: any) {
    const colors: any = { blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div><div className="flex items-baseline gap-1"><span className="text-2xl font-black text-slate-800">{value}</span><span className="text-xs text-slate-400 font-bold">/ {total}</span></div><div className="text-xs font-bold text-slate-400">{label}</div></div>
            <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={20} /></div>
        </div>
    );
}
function StatusBadge({ status, lang }: { status: ResourceStatus, lang: 'ar' | 'en' }) {
    const styles = { 'Available': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'In Use': 'bg-blue-100 text-blue-700 border-blue-200', 'Maintenance': 'bg-amber-100 text-amber-700 border-amber-200', 'Reserved': 'bg-purple-100 text-purple-700 border-purple-200' };
    const labels = { 'Available': lang === 'ar' ? 'متاح' : 'Available', 'In Use': lang === 'ar' ? 'قيد الاستخدام' : 'In Use', 'Maintenance': lang === 'ar' ? 'صيانة' : 'Maintenance', 'Reserved': lang === 'ar' ? 'محجوز' : 'Reserved' };
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 w-fit ${styles[status]}`}>{status === 'Available' && <CheckCircle2 size={12} />}{status === 'In Use' && <Clock size={12} />}{status === 'Maintenance' && <Wrench size={12} />}{status === 'Reserved' && <Clock size={12} />}{labels[status]}</span>;
}
function getResourceIcon(type: ResourceType) { switch (type) { case 'Equipment': return <Hammer size={18} />; case 'Vehicle': return <Truck size={18} />; case 'Manpower': return <Users size={18} />; case 'Material': return <Box size={18} />; default: return <Box size={18} />; } }
function getUtilizationColor(val: number) { if (val > 90) return 'bg-red-500'; if (val > 70) return 'bg-blue-500'; return 'bg-emerald-500'; }
function MapPinIcon({size}: {size: number}) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> }