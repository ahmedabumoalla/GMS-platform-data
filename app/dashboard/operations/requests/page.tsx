'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../layout';
import { 
    Search, Filter, Clock, CheckCircle2, 
    XCircle, Eye, Loader2, FileText, 
    Image as ImageIcon, DollarSign, Box, Users, ShieldCheck, MapPin, Inbox,
    Briefcase,
    ArrowLeft,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface TechUpdate {
    id: string;
    project_id: string;
    user_id: string;
    update_type: string;
    task_status: string;
    notes: string;
    photos_before: string[];
    photos_after: string[];
    amount: number;
    material_qty: string;
    manager_status: 'Pending' | 'Approved' | 'Rejected';
    admin_status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
    // Data populated via joins
    tech_name?: string;
    tech_role?: string;
}

interface ProjectCardData {
    id: string;
    title: string;
    location: string;
    manager_name: string;
    updates: TechUpdate[];
    pendingCount: number;
}

export default function TechnicianRequestsInboxPage() {
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const isManager = user?.role === 'project_manager';

    const [projectsData, setProjectsData] = useState<ProjectCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // للنافذة المنبثقة
    const [selectedProject, setSelectedProject] = useState<ProjectCardData | null>(null);
    const [processingUpdate, setProcessingUpdate] = useState<string | null>(null);

    const t = {
        ar: {
            title: 'صندوق الوارد: تحديثات وطلبات الفنيين',
            subtitle: 'مراجعة واعتماد التحديثات الميدانية والصور والطلبات المرفوعة من فريق العمل',
            empty: 'لا توجد مشاريع تحتوي على تحديثات حالياً.',
            projectUpdates: 'تحديثات المشروع:',
            emptyUpdates: 'تمت معالجة جميع الطلبات في هذا المشروع.',
            approveManager: 'اعتماد مبدئي (مدير)',
            approveAdmin: 'اعتماد نهائي (إدارة)',
            reject: 'رفض الطلب',
            types: { work_update: 'تحديث عمل', material: 'طلب مواد', custody: 'طلب عهدة', expense: 'مطالبة مالية', manpower: 'طلب دعم فني', other: 'أخرى' }
        },
        en: {
            title: 'Inbox: Technician Updates & Requests',
            subtitle: 'Review and approve field updates, photos, and requests submitted by the team',
            empty: 'No projects with active updates currently.',
            projectUpdates: 'Project Updates:',
            emptyUpdates: 'All requests in this project have been processed.',
            approveManager: 'Initial Approval (PM)',
            approveAdmin: 'Final Approval (Admin)',
            reject: 'Reject Request',
            types: { work_update: 'Work Update', material: 'Material Request', custody: 'Custody Request', expense: 'Expense Claim', manpower: 'Manpower Request', other: 'Other' }
        }
    };
    const text = isRTL ? t.ar : t.en;

    // --- 1. جلب وتجميع البيانات ---
    const fetchUpdates = async () => {
        setLoading(true);
        try {
            // جلب المشاريع بناءً على الصلاحية
            let pQuery = supabase.from('projects').select('id, title, location_name, manager_name');
            if (isManager) pQuery = pQuery.ilike('manager_name', `%${user?.full_name}%`);
            const { data: projectsRes } = await pQuery;

            if (projectsRes && projectsRes.length > 0) {
                const projectIds = projectsRes.map(p => p.id);
                
                // جلب التحديثات
                const { data: updatesRes } = await supabase
                    .from('task_updates')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('created_at', { ascending: false });

                // جلب بيانات الفنيين
                const techIds = [...new Set(updatesRes?.map(u => u.user_id) || [])];
                const { data: techsRes } = await supabase.from('profiles').select('id, full_name, job_title').in('id', techIds);

                // دمج وتجميع البيانات
                const groupedData: ProjectCardData[] = projectsRes.map(proj => {
                    const projUpdates = (updatesRes || []).filter(u => u.project_id === proj.id).map(u => {
                        const tech = techsRes?.find(t => t.id === u.user_id);
                        return { ...u, tech_name: tech?.full_name || 'Unknown', tech_role: tech?.job_title || 'Tech' };
                    });

                    // الفلترة حسب من يرى ماذا (المدير يرى Pending، الأدمن يرى ما اعتمده المدير أو كل شيء)
                    const visibleUpdates = projUpdates.filter(u => {
                        if (isAdmin) return u.admin_status === 'Pending'; // الأدمن يرى المعلق لديه
                        if (isManager) return u.manager_status === 'Pending'; // المدير يرى المعلق لديه
                        return false;
                    });

                    return {
                        id: proj.id,
                        title: proj.title,
                        location: proj.location_name || 'N/A',
                        manager_name: proj.manager_name || 'N/A',
                        updates: projUpdates, // نحتفظ بالكل للعرض
                        pendingCount: visibleUpdates.length // نعد فقط ما يتطلب اتخاذ إجراء
                    };
                }).filter(p => p.updates.length > 0); // إظهار المشاريع التي فيها تحديثات فقط

                setProjectsData(groupedData);
                
                // تحديث النافذة المفتوحة إن وجدت
                if (selectedProject) {
                    const updatedProj = groupedData.find(p => p.id === selectedProject.id);
                    if (updatedProj) setSelectedProject(updatedProj);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, [user, isAdmin, isManager]);

    // --- 2. معالجة التحديثات ---
    const handleUpdateAction = async (updateId: string, action: 'Approve' | 'Reject') => {
        setProcessingUpdate(updateId);
        try {
            let updatePayload: any = {};
            
            if (action === 'Reject') {
                updatePayload = isAdmin ? { admin_status: 'Rejected', admin_id: user?.id } : { manager_status: 'Rejected', manager_id: user?.id };
            } else {
                if (isAdmin) {
                    updatePayload = { admin_status: 'Approved', admin_id: user?.id, manager_status: 'Approved' }; // الأدمن يعتمد للكل
                } else if (isManager) {
                    updatePayload = { manager_status: 'Approved', manager_id: user?.id };
                }
            }

            const { error } = await supabase.from('task_updates').update(updatePayload).eq('id', updateId);
            if (error) throw error;
            
            await fetchUpdates(); // إعادة الجلب لتحديث الأرقام والحالات

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setProcessingUpdate(null);
        }
    };

    // --- Helpers ---
    const getUpdateTypeInfo = (type: string) => {
        switch(type) {
            case 'work_update': return { label: text.types.work_update, icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-100' };
            case 'material': return { label: text.types.material, icon: Box, color: 'text-purple-500', bg: 'bg-purple-100' };
            case 'expense': return { label: text.types.expense, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100' };
            case 'manpower': return { label: text.types.manpower, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100' };
            default: return { label: text.types.other, icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100' };
        }
    };

    const filteredProjects = projectsData.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.manager_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const textSub = isDark ? "text-slate-400" : "text-slate-500";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <Inbox className="text-blue-600" size={28}/> {text.title}
                        </h1>
                        <p className={`text-sm font-medium mt-1 ${textSub}`}>{text.subtitle}</p>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-4 h-4`} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن مشروع..." className={`w-full border rounded-[1.2rem] px-4 py-3 text-sm outline-none transition ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 shadow-sm'}`} />
                </div>
            </div>

            {/* Main Content: Project Cards */}
            <div className="p-8">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={50} /></div>
                ) : filteredProjects.length === 0 ? (
                    <div className={`text-center py-20 font-bold ${textSub}`}>{text.empty}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(proj => (
                            <motion.div 
                                initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={proj.id} 
                                onClick={() => setSelectedProject(proj)}
                                className={`cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 ${cardBg}`}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                                            <Briefcase size={20}/>
                                        </div>
                                        {proj.pendingCount > 0 ? (
                                            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-100 text-red-600 border border-red-200 animate-pulse">
                                                {proj.pendingCount} طلبات جديدة
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                مكتملة المراجعة
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className={`text-lg font-black leading-tight truncate ${textMain}`}>{proj.title}</h3>
                                        <p className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1"><Users size={12}/> م. {proj.manager_name}</p>
                                    </div>
                                </div>
                                <div className={`p-4 border-t flex items-center justify-between text-xs font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                    <div className="flex items-center gap-1.5"><MapPin size={14}/> {proj.location}</div>
                                    <div className="text-blue-500 flex items-center gap-1">استعراض <ArrowLeft size={12}/></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 🚀 MODAL: عرض التحديثات والطلبات للمشروع --- */}
            <AnimatePresence>
                {selectedProject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto" onClick={() => setSelectedProject(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className={`w-full max-w-4xl my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            {/* Header */}
                            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className={`text-2xl font-black ${textMain}`}>{selectedProject.title}</h2>
                                    <p className="text-xs font-bold text-slate-500 mt-1">{text.projectUpdates} <span className="text-blue-600">{selectedProject.updates.length}</span></p>
                                </div>
                                <button onClick={() => setSelectedProject(null)} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-red-500 transition"><X size={20}/></button>
                            </div>

                            {/* Updates List */}
                            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                                {selectedProject.updates.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 font-bold">{text.emptyUpdates}</div>
                                ) : (
                                    selectedProject.updates.map(update => {
                                        const typeInfo = getUpdateTypeInfo(update.update_type);
                                        const TypeIcon = typeInfo.icon;
                                        
                                        // هل يتطلب هذا التحديث إجراءً من المستخدم الحالي؟
                                        const needsManagerAction = isManager && update.manager_status === 'Pending';
                                        const needsAdminAction = isAdmin && update.admin_status === 'Pending';
                                        const needsAction = needsManagerAction || needsAdminAction;

                                        return (
                                            <div key={update.id} className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all ${needsAction ? 'border-blue-300 shadow-md bg-blue-50/10 dark:bg-blue-900/10 dark:border-blue-800' : isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50/50 border-slate-200'}`}>
                                                
                                                {/* Header of Update Card */}
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeInfo.bg} ${typeInfo.color}`}>
                                                            <TypeIcon size={24}/>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className={`font-black text-lg ${textMain}`}>{typeInfo.label}</h4>
                                                                {update.task_status === 'completed' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">تم الإنجاز</span>}
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                                                <Users size={14}/> {update.tech_name} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 rounded">{update.tech_role}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1"><Clock size={10} className="inline mr-1"/> {new Date(update.created_at).toLocaleString(isRTL?'ar-SA':'en-US')}</div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badges */}
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <div className="text-[10px] font-bold text-slate-500">حالة الإدارة:</div>
                                                        <div className="flex gap-2">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${update.manager_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : update.manager_status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>م: {update.manager_status}</span>
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${update.admin_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : update.admin_status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>أ: {update.admin_status}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content of Update */}
                                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    
                                                    {update.notes && (
                                                        <div className={`p-4 rounded-xl text-sm font-medium leading-relaxed ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700 shadow-sm border border-slate-100'}`}>
                                                            <span className="block text-[10px] font-bold text-slate-400 mb-1">تفاصيل / ملاحظات:</span>
                                                            {update.notes}
                                                        </div>
                                                    )}

                                                    {/* Custom Fields based on type */}
                                                    {(update.amount > 0 || update.material_qty) && (
                                                        <div className="flex gap-4">
                                                            {update.amount > 0 && <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-black flex items-center gap-1"><DollarSign size={16}/> {update.amount} SAR</div>}
                                                            {update.material_qty && <div className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-black flex items-center gap-1"><Box size={16}/> الكمية: {update.material_qty}</div>}
                                                        </div>
                                                    )}

                                                    {/* Photos */}
                                                    {(update.photos_before?.length > 0 || update.photos_after?.length > 0) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {update.photos_before?.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <div className="text-[10px] font-bold text-slate-500 uppercase">صور قبل العمل</div>
                                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                                        {update.photos_before.map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 w-24 h-24 rounded-xl border border-slate-200 overflow-hidden relative group">
                                                                                <img src={url} alt="Before" className="w-full h-full object-cover transition group-hover:scale-110"/>
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><Eye className="text-white"/></div>
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {update.photos_after?.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <div className="text-[10px] font-bold text-slate-500 uppercase">صور بعد العمل</div>
                                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                                        {update.photos_after.map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 w-24 h-24 rounded-xl border border-slate-200 overflow-hidden relative group">
                                                                                <img src={url} alt="After" className="w-full h-full object-cover transition group-hover:scale-110"/>
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><Eye className="text-white"/></div>
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 🚀 Action Buttons (Approval / Rejection) 🚀 */}
                                                {needsAction && (
                                                    <div className={`mt-6 pt-4 border-t flex flex-wrap gap-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                        <button 
                                                            onClick={() => handleUpdateAction(update.id, 'Approve')}
                                                            disabled={processingUpdate === update.id}
                                                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {processingUpdate === update.id ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                                                            {isAdmin ? text.approveAdmin : text.approveManager}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateAction(update.id, 'Reject')}
                                                            disabled={processingUpdate === update.id}
                                                            className="flex-1 py-3 px-4 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {processingUpdate === update.id ? <Loader2 size={18} className="animate-spin"/> : <XCircle size={18}/>}
                                                            {text.reject}
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        )
                                    })
                                )}
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}