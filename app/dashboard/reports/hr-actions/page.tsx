'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../layout';
import { 
    Search, Filter, ShieldCheck, Clock, CheckCircle2, 
    XCircle, Eye, Printer, Loader2, FileSignature, 
    Building, AlertTriangle, DollarSign, UserMinus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface HRAction {
    id: string;
    reference_number: string;
    action_category: string;
    action_type: string;
    action_title: string;
    reason: string;
    details: any;
    status: 'Pending Approval' | 'Approved' | 'Rejected';
    created_at: string;
    employee_id: string;
    created_by: string;
    // Data populated via join/map
    employee?: any;
    creator_name?: string;
}

export default function HRActionsLogPage() {
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    const [actions, setActions] = useState<HRAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const [selectedAction, setSelectedAction] = useState<HRAction | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    // --- 🚀 القاموس الذكي 🚀 ---
    const t = {
        ar: {
            title: 'سجل القرارات والإجراءات الإدارية',
            subtitle: 'متابعة، مراجعة، واعتماد الإجراءات المتخذة بحق الموظفين',
            searchPlaceholder: 'بحث برقم القرار، اسم الموظف...',
            statusAll: 'كل الحالات',
            statusPending: 'قيد الاعتماد',
            statusApproved: 'معتمد',
            statusRejected: 'مرفوض',
            approve: 'اعتماد',
            reject: 'رفض',
            view: 'عرض النموذج',
            table: {
                ref: 'الرقم المرجعي',
                emp: 'الموظف المعني',
                action: 'نوع الإجراء',
                date: 'تاريخ الإصدار',
                status: 'حالة الاعتماد',
                creator: 'بواسطة',
                tools: 'إدارة'
            },
            empty: 'لا توجد قرارات إدارية مطابقة للبحث.',
            // A4 Texts
            a4Header: 'إدارة الموارد البشرية',
            a4SubHeader: 'HUMAN RESOURCES DEPT.',
            a4Ref: 'الرقم المرجعي:',
            a4Date: 'التاريخ:',
            a4Greeting: 'المكرم /',
            a4Respect: 'المحترم،',
            a4EmpId: 'الرقم الوظيفي:',
            a4JobTitle: 'المسمى الوظيفي:',
            a4Branch: 'القسم/الفرع:',
            a4NationalId: 'رقم الهوية:',
            a4BodyIntro: 'إشارةً إلى الموضوع أعلاه، وبناءً على الصلاحيات الممنوحة لإدارة الموارد البشرية، فقد تقرر الآتي:',
            a4DetailsPrefix: 'تفاصيل القرار:',
            a4ObjectionLabel: 'إفادة / اعتراض الموظف (يُعبأ من قبل الموظف المعني):',
            a4SigEmp: 'توقيع الموظف المذكور',
            a4SigManager: 'المدير المباشر',
            a4SigHR: 'اعتماد الموارد البشرية',
            print: 'طباعة النموذج'
        },
        en: {
            title: 'HR Actions & Decisions Log',
            subtitle: 'Track, review, and approve employee administrative actions',
            searchPlaceholder: 'Search by Ref No, Employee Name...',
            statusAll: 'All Statuses',
            statusPending: 'Pending Approval',
            statusApproved: 'Approved',
            statusRejected: 'Rejected',
            approve: 'Approve',
            reject: 'Reject',
            view: 'View Form',
            table: {
                ref: 'Reference No.',
                emp: 'Employee',
                action: 'Action Type',
                date: 'Issue Date',
                status: 'Status',
                creator: 'Created By',
                tools: 'Manage'
            },
            empty: 'No HR actions found matching your search.',
            // A4 Texts
            a4Header: 'Human Resources Dept.',
            a4SubHeader: 'إدارة الموارد البشرية',
            a4Ref: 'Ref No:',
            a4Date: 'Date:',
            a4Greeting: 'Dear /',
            a4Respect: ',',
            a4EmpId: 'Employee ID:',
            a4JobTitle: 'Job Title:',
            a4Branch: 'Dept/Branch:',
            a4NationalId: 'National ID:',
            a4BodyIntro: 'With reference to the above subject, and based on the authorities granted to the HR Dept, it has been decided:',
            a4DetailsPrefix: 'Action Details:',
            a4ObjectionLabel: 'Employee Statement / Objection (To be filled by the employee):',
            a4SigEmp: 'Employee Signature',
            a4SigManager: 'Direct Manager',
            a4SigHR: 'HR Approval',
            print: 'Print Form'
        }
    };

    const text = isRTL ? t.ar : t.en;

    // --- جلب البيانات بطريقة آمنة ---
    const fetchActions = async () => {
        setLoading(true);
        try {
            const { data: actionsData, error: actionsErr } = await supabase
                .from('hr_actions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (actionsErr) throw actionsErr;

            if (actionsData && actionsData.length > 0) {
                const profileIds = [...new Set([
                    ...actionsData.map(a => a.employee_id),
                    ...actionsData.map(a => a.created_by)
                ])].filter(Boolean);

                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', profileIds);

                const formattedActions = actionsData.map(action => {
                    const emp = profilesData?.find(p => p.id === action.employee_id);
                    const creator = profilesData?.find(p => p.id === action.created_by);
                    return {
                        ...action,
                        employee: emp || { full_name: 'Unknown', employee_id: 'N/A' },
                        creator_name: creator?.full_name || 'System'
                    };
                });

                setActions(formattedActions);
            } else {
                setActions([]);
            }
        } catch (error) {
            console.error('Error fetching HR actions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActions();
    }, []);

    // --- تغيير حالة القرار (للأدمن) ---
    const updateActionStatus = async (id: string, newStatus: 'Approved' | 'Rejected') => {
        if (!isAdmin) return;
        setUpdatingStatus(id);
        try {
            const { error } = await supabase
                .from('hr_actions')
                .update({ status: newStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            setActions(actions.map(a => a.id === id ? { ...a, status: newStatus } : a));
        } catch (error: any) {
            alert('Error updating status: ' + error.message);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Helpers ---
    const getCategoryIcon = (cat: string) => {
        switch(cat) {
            case 'disciplinary': return <AlertTriangle size={16} className="text-rose-500" />;
            case 'financial': return <DollarSign size={16} className="text-emerald-500" />;
            case 'organizational': return <Building size={16} className="text-blue-500" />;
            case 'eos': return <UserMinus size={16} className="text-slate-500" />;
            default: return <FileSignature size={16} className="text-purple-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Approved': 
                return <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> {text.statusApproved}</span>;
            case 'Rejected': 
                return <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><XCircle size={12}/> {text.statusRejected}</span>;
            default: 
                return <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Clock size={12}/> {text.statusPending}</span>;
        }
    };

    // --- Filter Data ---
    const filteredActions = actions.filter(a => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            a.reference_number?.toLowerCase().includes(searchLower) ||
            a.employee?.full_name?.toLowerCase().includes(searchLower) ||
            a.action_title?.toLowerCase().includes(searchLower);
        
        const matchesStatus = statusFilter === 'All' ? true : a.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header & Stats */}
            <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <FileSignature className="text-blue-600" size={28}/> {text.title}
                        </h1>
                        <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{text.subtitle}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className={`px-4 py-2 rounded-xl border flex flex-col items-center min-w-[100px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{text.statusPending}</span>
                            <span className="text-xl font-black text-amber-500">{actions.filter(a => a.status === 'Pending Approval').length}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border flex flex-col items-center min-w-[100px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{text.statusApproved}</span>
                            <span className="text-xl font-black text-emerald-500">{actions.filter(a => a.status === 'Approved').length}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-4 h-4`} />
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder={text.searchPlaceholder} 
                            className={`w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 shadow-sm'}`} 
                        />
                    </div>
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)} 
                        className={`rounded-2xl px-5 py-3 text-sm font-bold outline-none border cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <option value="All">{text.statusAll}</option>
                        <option value="Pending Approval">{text.statusPending}</option>
                        <option value="Approved">{text.statusApproved}</option>
                        <option value="Rejected">{text.statusRejected}</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="p-8">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={50} /></div>
                ) : filteredActions.length === 0 ? (
                    <div className="text-center py-20 font-bold text-slate-500">{text.empty}</div>
                ) : (
                    <div className={`rounded-[2rem] border overflow-hidden shadow-sm ${cardBg}`}>
                        <div className="overflow-x-auto">
                            <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'} whitespace-nowrap`}>
                                <thead className={`text-xs uppercase font-black text-slate-500 border-b ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <tr>
                                        <th className="p-5">{text.table.ref}</th>
                                        <th className="p-5">{text.table.emp}</th>
                                        <th className="p-5">{text.table.action}</th>
                                        <th className="p-5">{text.table.date}</th>
                                        <th className="p-5">{text.table.status}</th>
                                        <th className="p-5">{text.table.creator}</th>
                                        <th className={`p-5 ${isRTL ? 'text-left' : 'text-right'}`}>{text.table.tools}</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                    {filteredActions.map(action => (
                                        <tr key={action.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-blue-50/50'}`}>
                                            <td className="p-5 font-mono font-bold text-blue-600 dark:text-blue-400">{action.reference_number}</td>
                                            <td className="p-5">
                                                <div className={`font-black ${textMain}`}>{action.employee?.full_name}</div>
                                                <div className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {action.employee?.employee_id}</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(action.action_category)}
                                                    <span className={`font-bold ${textMain}`}>{action.action_title}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 font-medium text-slate-500">{new Date(action.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</td>
                                            <td className="p-5">{getStatusBadge(action.status)}</td>
                                            <td className="p-5 text-xs font-bold text-slate-500">{action.creator_name}</td>
                                            <td className={`p-5 ${isRTL ? 'text-left' : 'text-right'}`}>
                                                <div className="flex items-center justify-end gap-2">
                                                    
                                                    {/* Admin Controls (Approve/Reject) */}
                                                    {isAdmin && action.status === 'Pending Approval' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateActionStatus(action.id, 'Approved')}
                                                                disabled={updatingStatus === action.id}
                                                                className="p-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg transition"
                                                                title={text.approve}
                                                            >
                                                                {updatingStatus === action.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                                                            </button>
                                                            <button 
                                                                onClick={() => updateActionStatus(action.id, 'Rejected')}
                                                                disabled={updatingStatus === action.id}
                                                                className="p-2 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg transition"
                                                                title={text.reject}
                                                            >
                                                                {updatingStatus === action.id ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>}
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {/* View Modal Button */}
                                                    <button 
                                                        onClick={() => setSelectedAction(action)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                                    >
                                                        <Eye size={14}/> <span className="hidden lg:block">{text.view}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* --- 🚀 MODAL: عرض وطباعة النموذج (A4) 🚀 --- */}
            <AnimatePresence>
                {selectedAction && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
                            className={`w-full max-w-4xl my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative print:shadow-none print:w-full print:rounded-none ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-100'}`}
                        >
                            
                            {/* Modal Actions (Hidden in Print) */}
                            <div className="p-6 border-b flex justify-between items-center bg-white dark:bg-slate-900 dark:border-slate-800 print:hidden z-50 shadow-sm rounded-t-[3rem]">
                                <div className="flex items-center gap-4">
                                    <h3 className={`font-black text-xl ${textMain}`}>{text.view}</h3>
                                    {getStatusBadge(selectedAction.status)}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handlePrint} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-lg">
                                        <Printer size={16}/> {text.print}
                                    </button>
                                    <button onClick={() => setSelectedAction(null)} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-300' : 'bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600'}`}><X size={20}/></button>
                                </div>
                            </div>

                            {/* A4 Paper Container */}
                            <div className="p-8 flex justify-center overflow-y-auto max-h-[75vh] custom-scrollbar print:max-h-none print:overflow-visible print:p-0">
                                
                                <div className="w-full max-w-[210mm] aspect-[1/1.414] bg-white rounded-lg shadow-xl relative overflow-hidden flex flex-col print:shadow-none print:border-none text-slate-900 border border-slate-200">
                                    
                                    {/* Watermark Logo */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
                                        <img src="/logo1.png" alt="GMS Watermark" className="w-3/4 max-w-[500px] object-contain" />
                                    </div>

                                    {/* A4 Header */}
                                    <div className="p-8 md:p-12 border-b-2 border-slate-100 flex justify-between items-start bg-slate-50/30 relative z-10">
                                        <div className="text-left rtl:text-right space-y-1 text-xs font-bold text-slate-600 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                            <div><span className="text-slate-400">{text.a4Ref}</span> <span className="font-mono text-blue-700">{selectedAction.reference_number}</span></div>
                                            <div><span className="text-slate-400">{text.a4Date}</span> {new Date(selectedAction.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="w-32 h-24 flex items-center justify-center overflow-hidden">
                                                <img src="/logo1.png" alt="GMS Logo" className="w-full h-full object-contain mix-blend-multiply" />
                                            </div>
                                            <div className="text-center mt-2">
                                                <h1 className="font-black text-lg tracking-tight text-slate-900">{text.a4Header}</h1>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{text.a4SubHeader}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* A4 Body */}
                                    <div className="flex-1 p-8 md:p-12 z-10">
                                        <h2 className="text-center text-2xl font-black underline underline-offset-8 decoration-2 decoration-slate-300 mb-10 text-slate-900">{selectedAction.action_title}</h2>
                                        
                                        <div className="space-y-6">
                                            <p className="text-base font-bold leading-loose text-slate-800">
                                                {text.a4Greeting} <span className="text-blue-700 bg-blue-50 px-2 rounded">{selectedAction.employee?.full_name}</span> {text.a4Respect}
                                            </p>
                                            
                                            <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700">
                                                <div>{text.a4EmpId} <span className="font-mono">{selectedAction.employee?.employee_id}</span></div>
                                                <div>{text.a4JobTitle} {selectedAction.employee?.job_title}</div>
                                                <div>{text.a4Branch} {selectedAction.employee?.branch || selectedAction.employee?.region}</div>
                                                <div>{text.a4NationalId} <span className="font-mono">{selectedAction.employee?.national_id}</span></div>
                                            </div>

                                            <div className="pt-4">
                                                <p className="text-sm font-bold text-slate-800 leading-loose">
                                                    {text.a4BodyIntro}
                                                </p>
                                                
                                                <div className={`mt-4 p-5 border-l-4 rounded-l-xl text-sm font-bold leading-loose whitespace-pre-wrap shadow-inner ${isRTL ? 'border-r-4 border-l-0 rounded-l-none rounded-r-xl' : ''} bg-slate-50 border-slate-800 text-slate-900`}>
                                                    {selectedAction.reason}
                                                </div>

                                                {selectedAction.details?.additional_notes && (
                                                    <div className="mt-6 text-sm font-bold text-slate-800 flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span> {text.a4DetailsPrefix} <span className="text-blue-700">{selectedAction.details.additional_notes}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 🚀 مساحة إفادة الموظف (Objection Area) 🚀 */}
                                            <div className="pt-4 mt-6 border-t-2 border-slate-100">
                                                <p className="text-xs font-bold text-slate-500 mb-3">{text.a4ObjectionLabel}</p>
                                                <div className="w-full h-24 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* A4 Footer (Signatures) */}
                                    <div className="p-8 md:p-12 mt-auto pt-6 z-10">
                                        <div className="grid grid-cols-3 gap-8 text-center text-sm font-bold text-slate-800 border-t-2 border-slate-100 pt-8">
                                            <div className="space-y-12">
                                                <div className="text-slate-500">{text.a4SigEmp}</div>
                                                <div className="border-b border-dashed border-slate-400 mx-4"></div>
                                            </div>
                                            <div className="space-y-12">
                                                <div className="text-slate-500">{text.a4SigManager}</div>
                                                <div className="border-b border-dashed border-slate-400 mx-4"></div>
                                            </div>
                                            <div className="space-y-12">
                                                <div className="text-slate-500">{text.a4SigHR}</div>
                                                <div className="border-b border-dashed border-slate-400 mx-4"></div>
                                                {/* 🚀 تم إزالة الأختام بناءً على طلبك */}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}