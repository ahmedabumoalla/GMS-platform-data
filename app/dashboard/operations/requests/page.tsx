'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../layout'; 
import { 
    Search, Clock, CheckCircle2, 
    XCircle, Eye, Loader2, FileText, Wallet,
    Image as ImageIcon, DollarSign, Box, Users, MapPin, Inbox,
    Briefcase, ArrowLeft, X, CalendarDays, Paperclip, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Unified Types ---
interface UnifiedRequest {
    id: string;
    project_id: string | null;
    user_id: string;
    type: string; 
    manager_status: 'Pending' | 'Approved' | 'Rejected'; // تم توحيدها هنا
    admin_status: 'Pending' | 'Approved' | 'Rejected';   // تم توحيدها هنا
    created_at: string;
    source_table: 'task_updates' | 'technician_requests';
    
    tech_name?: string;
    tech_role?: string;
    
    notes?: string;
    amount?: number;
    qty?: string;
    role_req?: string;
    start_date?: string;
    end_date?: string;
    photos_before?: string[];
    photos_after?: string[];
    attachment?: string;
}

interface ProjectGroup {
    id: string;
    title: string;
    location: string;
    manager: string;
    requests: UnifiedRequest[];
    pendingCount: number;
    isHR?: boolean;
}

export default function TechnicianRequestsInboxPage() {
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const isManager = user?.role === 'project_manager';

    const [projectsData, setProjectsData] = useState<ProjectGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const t = {
        ar: {
            title: 'صندوق الوارد: طلبات وتحديثات الميدان',
            subtitle: 'مركز الاعتمادات لطلبات الفنيين، شؤون الموظفين، والمستجدات الميدانية.',
            empty: 'لا توجد أي طلبات أو تحديثات معلقة حالياً.',
            projectReqs: 'سجل الطلبات:',
            emptyReqs: 'تمت معالجة جميع الطلبات بنجاح.',
            approve: 'اعتماد الطلب',
            reject: 'رفض',
            status: { Pending: 'قيد المراجعة', Approved: 'معتمد', Rejected: 'مرفوض' },
            types: { work_update: 'تحديث عمل', material: 'طلب صرف مواد', custody: 'طلب عهدة', expense: 'مطالبة مالية', manpower: 'طلب عمالة', hr_leave: 'طلب إجازة', hr_letter: 'طلب تعريف', other: 'أخرى' }
        },
        en: {
            title: 'Inbox: Field Requests & Updates',
            subtitle: 'Approval center for technician requests, HR, and field updates.',
            empty: 'No pending requests or updates currently.',
            projectReqs: 'Requests Log:',
            emptyReqs: 'All requests have been successfully processed.',
            approve: 'Approve Request',
            reject: 'Reject',
            status: { Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected' },
            types: { work_update: 'Work Update', material: 'Material Req', custody: 'Custody Req', expense: 'Expense Claim', manpower: 'Manpower Req', hr_leave: 'Leave Req', hr_letter: 'Letter Req', other: 'Other' }
        }
    };
    const text = isRTL ? t.ar : t.en;

    // --- 1. Master Fetching Engine (تم إصلاحه بالكامل 🚀) ---
    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. جلب المشاريع
            let pQuery = supabase.from('projects').select('id, title, location_name, manager_name');
            if (isManager && !isAdmin) pQuery = pQuery.ilike('manager_name', `%${user?.full_name}%`);
            const { data: projectsRes } = await pQuery;
            const projectIds = projectsRes?.map(p => p.id) || [];

            // 2. جلب البيانات من كلا الجدولين معاً
            const [taskUpdatesRes, techReqsRes] = await Promise.all([
                supabase.from('task_updates').select('*').in('project_id', projectIds).order('created_at', { ascending: false }),
                supabase.from('technician_requests').select('*').order('created_at', { ascending: false })
            ]);

            let unifiedList: UnifiedRequest[] = [];

            // أ. معالجة تحديثات العمل والصور
            if (taskUpdatesRes.data) {
                taskUpdatesRes.data.forEach(u => {
                    unifiedList.push({
                        id: u.id, project_id: u.project_id, user_id: u.user_id, type: u.update_type,
                        manager_status: u.manager_status || 'Pending',
                        admin_status: u.admin_status || 'Pending',
                        created_at: u.created_at, source_table: 'task_updates',
                        notes: u.notes, photos_before: u.photos_before, photos_after: u.photos_after
                    });
                });
            }

            // ب. معالجة طلبات الفلوس والمواد والعمالة والإجازات
            if (techReqsRes.data) {
                techReqsRes.data.forEach(r => {
                    if (r.project_id && !projectIds.includes(r.project_id)) return;
                    if (!r.project_id && !isAdmin) return; // الـ HR للأدمن فقط

                    unifiedList.push({
                        id: r.id, project_id: r.project_id, user_id: r.user_id, type: r.request_type,
                        manager_status: r.status || 'Pending', // 👈 السر هنا: نسخ الحالة لكي يقرأها النظام
                        admin_status: r.status || 'Pending',   // 👈 السر هنا
                        created_at: r.created_at, source_table: 'technician_requests',
                        notes: r.description, amount: r.amount, qty: r.quantity, role_req: r.role_requested,
                        start_date: r.start_date, end_date: r.end_date, attachment: r.attachment_url
                    });
                });
            }

            // 3. جلب أسماء الفنيين
            const techIds = [...new Set(unifiedList.map(u => u.user_id))];
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, job_title').in('id', techIds);
            
            unifiedList = unifiedList.map(u => {
                const profile = profiles?.find(p => p.id === u.user_id);
                return { ...u, tech_name: profile?.full_name || 'Unknown', tech_role: profile?.job_title || 'Tech' };
            });

            // 4. تجميع الكروت
            const groups: ProjectGroup[] = [];

            // كروت المشاريع
            projectsRes?.forEach(proj => {
                const projReqs = unifiedList.filter(u => u.project_id === proj.id);
                if (projReqs.length > 0) {
                    const pendingCount = projReqs.filter(u => {
                        if (isAdmin) return u.admin_status === 'Pending';
                        if (isManager) return u.manager_status === 'Pending';
                        return false;
                    }).length;

                    groups.push({
                        id: proj.id, title: proj.title, location: proj.location_name || '-', manager: proj.manager_name || '-',
                        requests: projReqs, pendingCount: pendingCount
                    });
                }
            });

            // كرت الـ HR
            const hrReqs = unifiedList.filter(u => !u.project_id);
            if (hrReqs.length > 0 && isAdmin) {
                groups.unshift({
                    id: 'hr_dept', title: isRTL ? 'إدارة شؤون الموظفين' : 'HR Department', location: isRTL ? 'طلبات عامة' : 'General Requests', manager: 'HR Admin',
                    requests: hrReqs, pendingCount: hrReqs.filter(r => r.admin_status === 'Pending').length, isHR: true
                });
            }

            groups.sort((a, b) => b.pendingCount - a.pendingCount);
            setProjectsData(groups);

            if (selectedProject) {
                const updatedGroup = groups.find(g => g.id === selectedProject.id);
                if (updatedGroup) setSelectedProject(updatedGroup);
            }

        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAllData(); }, [user, isAdmin, isManager]);

    // --- 2. Action Engine ---
    const handleAction = async (req: UnifiedRequest, action: 'Approved' | 'Rejected') => {
        setProcessingId(req.id);
        try {
            let payload: any = {};

            if (req.source_table === 'technician_requests') {
                payload = { status: action };
            } else {
                if (isAdmin) {
                    payload = { admin_status: action, admin_id: user?.id, manager_status: action };
                } else if (isManager) {
                    payload = { manager_status: action, manager_id: user?.id };
                }
            }

            const { error } = await supabase.from(req.source_table).update(payload).eq('id', req.id);
            if (error) throw error;
            
            await fetchAllData(); 
        } catch (err: any) { alert(err.message); } finally { setProcessingId(null); }
    };

    const getTypeUI = (type: string) => {
        switch(type) {
            case 'work_update': return { label: text.types.work_update, icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
            case 'material': return { label: text.types.material, icon: Box, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
            case 'expense': return { label: text.types.expense, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
            case 'custody': return { label: text.types.custody, icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200' };
            case 'manpower': return { label: text.types.manpower, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' };
            case 'hr_leave': return { label: text.types.hr_leave, icon: CalendarDays, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' };
            case 'hr_letter': return { label: text.types.hr_letter, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' };
            default: return { label: text.types.other, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
        }
    };

    const filteredProjects = projectsData.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const textSub = isDark ? "text-slate-400" : "text-slate-500";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`border-b px-8 py-8 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className={`text-3xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30"><Inbox size={28}/></div>
                            {text.title}
                        </h1>
                        <p className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{text.subtitle}</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-4 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? "ابحث هنا..." : "Search..."} className={`w-full border-2 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 shadow-sm'}`} />
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-600" size={50} /></div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 rounded-[2rem]">
                        <Inbox size={48} className="mx-auto text-slate-300 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{text.empty}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(proj => (
                            <motion.div 
                                initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={proj.id} 
                                onClick={() => setSelectedProject(proj)}
                                className={`cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-2xl hover:-translate-y-1 group ${proj.isHR ? (isDark ? 'bg-rose-950/30 border-rose-800' : 'bg-rose-50 border-rose-200') : cardBg}`}
                            >
                                {proj.pendingCount > 0 && (
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                                )}
                                
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border ${proj.isHR ? 'bg-rose-100 text-rose-600 border-rose-200' : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                            {proj.isHR ? <Users size={24}/> : <Briefcase size={24}/>}
                                        </div>
                                        {proj.pendingCount > 0 ? (
                                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-red-100 text-red-600 border border-red-200 shadow-sm animate-pulse flex items-center gap-1">
                                                <AlertTriangle size={14}/> {proj.pendingCount} جديد
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={14}/> مكتمل</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-black leading-tight mb-2 ${textMain}`}>{proj.title}</h3>
                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Users size={14}/> {proj.isHR ? 'الإدارة: ' : 'م. '}{proj.manager}</p>
                                    </div>
                                </div>
                                <div className={`p-4 border-t flex items-center justify-between text-xs font-bold ${proj.isHR ? 'border-rose-200/50 text-rose-700 bg-rose-100/50' : isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'} transition-colors group-hover:bg-blue-50 group-hover:text-blue-700`}>
                                    <div className="flex items-center gap-1.5 truncate"><MapPin size={14} className="shrink-0"/> {proj.location}</div>
                                    <div className="flex items-center gap-1 shrink-0">استعراض <ArrowLeft size={14}/></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 🚀 THE BEAUTIFUL REQUEST MODAL --- */}
            <AnimatePresence>
                {selectedProject && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-8 overflow-y-auto" onClick={() => setSelectedProject(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className={`w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            <div className={`px-8 py-6 border-b flex justify-between items-center ${selectedProject.isHR ? 'bg-rose-600 text-white' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div>
                                    <h2 className={`text-2xl font-black ${selectedProject.isHR ? 'text-white' : textMain}`}>{selectedProject.title}</h2>
                                    <p className={`text-xs font-bold mt-1.5 ${selectedProject.isHR ? 'text-rose-200' : 'text-slate-500'}`}>{text.projectReqs} <span className="bg-white/20 px-2 py-0.5 rounded ml-1">{selectedProject.requests.length}</span></p>
                                </div>
                                <button onClick={() => setSelectedProject(null)} className={`p-3 rounded-full transition ${selectedProject.isHR ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-100 hover:bg-red-100 hover:text-red-500 dark:bg-slate-800'}`}><X size={20}/></button>
                            </div>

                            <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
                                {selectedProject.requests.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 font-bold">{text.emptyReqs}</div>
                                ) : (
                                    selectedProject.requests.map(req => {
                                        const ui = getTypeUI(req.type);
                                        const Icon = ui.icon;
                                        
                                        const isRequestTable = req.source_table === 'technician_requests';
                                        
                                        const needsManagerAction = isManager && req.manager_status === 'Pending';
                                        const needsAdminAction = isAdmin && req.admin_status === 'Pending';
                                        const needsAction = needsManagerAction || needsAdminAction;

                                        const statusColors = req.admin_status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                                             req.admin_status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                             'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';

                                        return (
                                            <div key={req.id} className={`p-6 rounded-[2rem] border-2 transition-all shadow-sm ${needsAction ? ui.border : (isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}`}>
                                                
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${ui.bg} ${ui.color} ${ui.border}`}>
                                                            <Icon size={28}/>
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-black text-lg ${textMain}`}>{ui.label}</h4>
                                                            <div className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1">
                                                                <Users size={14}/> {req.tech_name} 
                                                                <span className="text-[9px] uppercase tracking-wider bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">{req.tech_role}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-2">
                                                        {isRequestTable ? (
                                                            <div className={`px-4 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${statusColors}`}>
                                                                {req.admin_status === 'Pending' && <Clock size={14}/>}
                                                                {req.admin_status === 'Approved' && <CheckCircle2 size={14}/>}
                                                                {req.admin_status === 'Rejected' && <XCircle size={14}/>}
                                                                {(text.status as any)[req.admin_status]}
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${req.manager_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : req.manager_status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>م: {(text.status as any)[req.manager_status]}</span>
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${req.admin_status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : req.admin_status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>أ: {(text.status as any)[req.admin_status]}</span>
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(req.created_at).toLocaleString(isRTL?'ar-SA':'en-US', {dateStyle:'medium', timeStyle:'short'})}</span>
                                                    </div>
                                                </div>

                                                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                                    
                                                    {req.notes && (
                                                        <div className="mb-4">
                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">التفاصيل / الملاحظات</span>
                                                            <p className={`text-sm font-bold leading-relaxed ${textMain}`}>{req.notes}</p>
                                                        </div>
                                                    )}

                                                    {(req.amount || req.qty || req.role_req) && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                                            {req.amount && req.amount > 0 && (
                                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                                                    <span className="text-[10px] font-bold text-slate-400 block mb-1">المبلغ المطلوب</span>
                                                                    <span className="text-emerald-600 font-black font-mono">{req.amount.toLocaleString()} SAR</span>
                                                                </div>
                                                            )}
                                                            {req.qty && (
                                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                                                    <span className="text-[10px] font-bold text-slate-400 block mb-1">الكمية / العدد</span>
                                                                    <span className="text-purple-600 font-black">{req.qty}</span>
                                                                </div>
                                                            )}
                                                            {req.role_req && (
                                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                                                    <span className="text-[10px] font-bold text-slate-400 block mb-1">التخصص المطلوب</span>
                                                                    <span className="text-indigo-600 font-black">{req.role_req}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(req.start_date || req.end_date) && (
                                                        <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/30 mb-4">
                                                            <div className="flex-1">
                                                                <span className="text-[10px] font-bold text-slate-400 block mb-1">يبدأ من تاريخ</span>
                                                                <span className="text-rose-600 font-black font-mono">{req.start_date || '-'}</span>
                                                            </div>
                                                            <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
                                                            <div className="flex-1">
                                                                <span className="text-[10px] font-bold text-slate-400 block mb-1">ينتهي في تاريخ</span>
                                                                <span className="text-rose-600 font-black font-mono">{req.end_date || '-'}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {req.attachment && (
                                                        <a href={req.attachment} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition border border-blue-100">
                                                            <Paperclip size={14}/> عرض المرفق (فاتورة/خطاب)
                                                        </a>
                                                    )}

                                                    {((req.photos_before?.length ?? 0) > 0 || (req.photos_after?.length ?? 0) > 0) && (
                                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                                            {(req.photos_before?.length ?? 0) > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-slate-400 block mb-2">صور قبل:</span>
                                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                                        {(req.photos_before ?? []).map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md hover:scale-105 transition"><img src={url} className="w-full h-full object-cover"/></a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {(req.photos_after?.length ?? 0) > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-slate-400 block mb-2">صور بعد:</span>
                                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                                        {(req.photos_after ?? []).map((url, i) => (
                                                                            <a key={i} href={url} target="_blank" className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md hover:scale-105 transition"><img src={url} className="w-full h-full object-cover"/></a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                </div>

                                                {needsAction && (
                                                    <div className="mt-4 flex gap-3">
                                                        <button onClick={() => handleAction(req, 'Approved')} disabled={processingId === req.id} className="flex-[2] py-3.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-sm font-black shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                                            {processingId === req.id ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                                                            {text.approve}
                                                        </button>
                                                        <button onClick={() => handleAction(req, 'Rejected')} disabled={processingId === req.id} className="flex-1 py-3.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 disabled:opacity-50">
                                                            {processingId === req.id ? <Loader2 size={18} className="animate-spin"/> : <XCircle size={18}/>}
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