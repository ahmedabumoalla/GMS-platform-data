'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Puzzle, Users, Package, DollarSign, Briefcase, Folder, 
  Loader2, ShieldAlert, CheckCircle2, XCircle, Search, Info
} from 'lucide-react';
import { useDashboard } from '@/app/dashboard/layout';
// --- Types ---
interface SystemPlugin {
  id: string;
  plugin_key: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category: string;
  is_active: boolean;
  icon_name: string;
  display_order: number;
}

export default function PluginManagerPage() {
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [plugins, setPlugins] = useState<SystemPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // التحقق من الصلاحيات (المدير فقط يمكنه تفعيل/تعطيل التطبيقات)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // --- Translations ---
  const t = {
    ar: {
      title: 'إدارة التطبيقات والإضافات',
      subtitle: 'تفعيل وتعطيل وحدات النظام الأساسية للتحكم في الميزات المتاحة لموظفيك.',
      search: 'بحث في التطبيقات...',
      active: 'مفعل',
      inactive: 'معطل',
      noPermission: 'صلاحيات للقراءة فقط. يرجى التواصل مع الإدارة للتعديل.',
      saveSuccess: 'تم تحديث حالة التطبيق بنجاح!',
      error: 'حدث خطأ أثناء التحديث',
      empty: 'لا توجد تطبيقات مطابقة لبحثك.',
      categories: {
        'Sales': 'المبيعات والعملاء',
        'Inventory': 'المخزون والمشتريات',
        'Finance': 'المالية والحسابات',
        'Operations': 'إدارة العمليات',
        'HR': 'الموارد البشرية',
        'System': 'إعدادات النظام العامة'
      }
    },
    en: {
      title: 'App & Plugin Manager',
      subtitle: 'Enable or disable core system modules to control features available to your team.',
      search: 'Search apps...',
      active: 'Active',
      inactive: 'Disabled',
      noPermission: 'Read-only access. Contact administrator to make changes.',
      saveSuccess: 'Plugin status updated successfully!',
      error: 'Error updating plugin',
      empty: 'No apps found matching your search.',
      categories: {
        'Sales': 'Sales & CRM',
        'Inventory': 'Inventory & Purchases',
        'Finance': 'Finance & Accounting',
        'Operations': 'Operations Management',
        'HR': 'Human Resources',
        'System': 'General System'
      }
    }
  }[lang];

  // --- 1. Fetch Plugins Data ---
  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_plugins')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) setPlugins(data);
    } catch (error: any) {
      console.error("Error fetching plugins:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  // --- 2. Toggle Plugin Status ---
  const handleTogglePlugin = async (id: string, currentStatus: boolean) => {
    if (!isAdmin) return; // حماية إضافية في الواجهة
    
    setUpdatingId(id);
    const newStatus = !currentStatus;

    try {
      const { error } = await supabase
        .from('system_plugins')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;
await supabase.from('system_plugin_audit_logs').insert({
  plugin_key: plugins.find(p => p.id === id)?.plugin_key,
  old_status: currentStatus,
  new_status: newStatus,
  actor_user_id: user?.id
});
      // تحديث الحالة محلياً بدون إعادة تحميل الصفحة
      setPlugins(prev => prev.map(p => p.id === id ? { ...p, is_active: newStatus } : p));
      
      // هنا يمكننا إضافة تنبيه (Toast) مستقبلاً
      console.log(t.saveSuccess);

    } catch (error: any) {
      alert(`${t.error}: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Helpers ---
  const getIcon = (iconName: string, size = 24) => {
    switch(iconName) {
      case 'Users': return <Users size={size} />;
      case 'Package': return <Package size={size} />;
      case 'DollarSign': return <DollarSign size={size} />;
      case 'Briefcase': return <Briefcase size={size} />;
      case 'Folder': return <Folder size={size} />;
      default: return <Puzzle size={size} />;
    }
  };

  // تصفية وتجميع التطبيقات (Grouping)
  const filteredPlugins = plugins.filter(p => {
    const searchTarget = isRTL ? p.name_ar : p.name_en;
    return searchTarget.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const groupedPlugins = filteredPlugins.reduce((groups, plugin) => {
    const cat = plugin.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(plugin);
    return groups;
  }, {} as Record<string, SystemPlugin[]>);

  // Styling Variables
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans pb-10 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Header Section --- */}
      <div className={`border-b px-6 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Puzzle className="text-blue-600" />
              {t.title}
            </h1>
            <p className={`text-sm font-medium mt-1.5 max-w-2xl ${textSub}`}>
              {t.subtitle}
            </p>
          </div>
          
          <div className="relative w-full md:w-72 shrink-0">
            <Search className={`absolute top-2.5 w-4 h-4 ${textSub} ${isRTL ? 'right-3' : 'left-3'}`} />
            <input 
                type="text" 
                placeholder={t.search} 
                className={`w-full rounded-xl py-2 text-sm outline-none transition border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* تنبيه الصلاحيات (يظهر للموظفين غير الإداريين) */}
        {!isAdmin && (
            <div className="max-w-6xl mx-auto mt-4">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold border ${isDark ? 'bg-amber-900/20 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    <ShieldAlert size={18} />
                    {t.noPermission}
                </div>
            </div>
        )}
      </div>

      {/* --- Main Content --- */}
      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
            <div className={`text-center py-20 flex flex-col items-center gap-3 ${textSub}`}>
                <Loader2 size={40} className="animate-spin text-blue-600" />
                <p className="font-bold">{isRTL ? 'جاري تحميل التطبيقات...' : 'Loading Apps...'}</p>
            </div>
        ) : Object.keys(groupedPlugins).length === 0 ? (
            <div className={`text-center py-20 rounded-3xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-300 bg-white'}`}>
                <Puzzle size={48} className={`mx-auto mb-3 opacity-20 ${textSub}`} />
                <p className={`font-bold ${textSub}`}>{t.empty}</p>
            </div>
        ) : (
            <div className="space-y-10">
                {Object.entries(groupedPlugins).map(([category, categoryPlugins]) => (
                    <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* عنوان التصنيف */}
                        <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textMain}`}>
                            <span className="w-2 h-6 rounded-full bg-blue-600 inline-block"></span>
                            {/* ترجمة التصنيف إذا كان موجوداً في القاموس، أو عرضه كما هو */}
                            {(t.categories as any)[category] || category}
                        </h2>
                        
                        {/* شبكة التطبيقات داخل التصنيف */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {categoryPlugins.map((plugin) => (
                                <div 
                                    key={plugin.id} 
                                    className={`relative p-6 rounded-2xl border transition-all flex flex-col h-full ${cardBg} ${plugin.is_active ? (isDark ? 'border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200') : 'opacity-70 grayscale-[30%]'}`}
                                >
                                    {/* الجزء العلوي (أيقونة + مفتاح التشغيل) */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl inline-flex ${plugin.is_active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                                            {getIcon(plugin.icon_name, 22)}
                                        </div>
                                        
                                        {/* زر التفعيل / التعطيل (Toggle Switch) */}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${plugin.is_active ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')}`}>
                                                {plugin.is_active ? t.active : t.inactive}
                                            </span>
                                            
                                            {/* شكل المفتاح (Switch) */}
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={plugin.is_active}
                                                disabled={!isAdmin || updatingId === plugin.id}
                                                onClick={() => handleTogglePlugin(plugin.id, plugin.is_active)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${plugin.is_active ? 'bg-blue-600' : (isDark ? 'bg-slate-700' : 'bg-slate-300')}`}
                                            >
                                                {updatingId === plugin.id && <Loader2 size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white z-10" />}
                                                <span
                                                    aria-hidden="true"
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        plugin.is_active 
                                                        ? (isRTL ? '-translate-x-5' : 'translate-x-5') 
                                                        : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* معلومات التطبيق */}
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold mb-1.5 ${textMain}`}>
                                            {isRTL ? plugin.name_ar : plugin.name_en}
                                        </h3>
                                        <p className={`text-sm leading-relaxed ${textSub}`}>
                                            {isRTL ? plugin.description_ar : plugin.description_en}
                                        </p>
                                    </div>
                                    
                                    {/* معلومات إضافية للمبرمج (مخفية بشكل أنيق) */}
                                    <div className={`mt-4 pt-4 border-t text-[10px] font-mono flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-100 text-slate-400'}`}>
                                        <span>Key: {plugin.plugin_key}</span>
                                        <Info size={12} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}