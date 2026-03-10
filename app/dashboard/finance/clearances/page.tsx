'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Plus, Receipt, Loader2, Building2, Briefcase, 
    Calendar, CheckCircle2, Clock, DollarSign, Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Clearance {
    id: string;
    clearance_number: string;
    submission_date: string;
    total_amount: number;
    status: 'Pending' | 'Approved' | 'Paid';
    project?: { title: string };
    client?: { name_ar: string; name_en: string };
}

export default function ClearancesPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [clearances, setClearances] = useState<Clearance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchClearances = async () => {
            const { data, error } = await supabase
                .from('clearances')
                .select('*, project:projects(title), client:clients(name_ar, name_en)')
                .order('created_at', { ascending: false });
            
            if (!error && data) setClearances(data as Clearance[]);
            setLoading(false);
        };
        fetchClearances();
    }, []);

    const filteredClearances = clearances.filter(c => 
        c.clearance_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.project?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.client?.name_ar || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const kpi = {
        pending: clearances.filter(c => c.status === 'Pending').reduce((sum, c) => sum + Number(c.total_amount), 0),
        approved: clearances.filter(c => c.status === 'Approved').reduce((sum, c) => sum + Number(c.total_amount), 0),
        paid: clearances.filter(c => c.status === 'Paid').reduce((sum, c) => sum + Number(c.total_amount), 0),
    };

    const getStatusUI = (status: string) => {
        switch(status) {
            case 'Paid': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Wallet, label: isRTL ? 'مدفوع' : 'Paid' };
            case 'Approved': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle2, label: isRTL ? 'معتمد' : 'Approved' };
            case 'Pending': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: isRTL ? 'قيد المراجعة' : 'Pending' };
            default: return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock, label: status };
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Receipt size={24}/></div>
                            {isRTL ? 'المستخلصات المالية للمشاريع' : 'Project Clearances'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'متابعة المستخلصات المرفوعة للعملاء وحالة اعتمادها.' : 'Track project invoices and approval status.'}</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{isRTL ? 'مستخلصات قيد الاعتماد' : 'Pending Clearances'}</div>
                        <div className="text-2xl font-mono font-black text-amber-600">{kpi.pending.toLocaleString('en-US')} <span className="text-xs">SAR</span></div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{isRTL ? 'مستخلصات معتمدة (لم تدفع)' : 'Approved (Unpaid)'}</div>
                        <div className="text-2xl font-mono font-black text-blue-600">{kpi.approved.toLocaleString('en-US')} <span className="text-xs">SAR</span></div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{isRTL ? 'مستخلصات محصلة' : 'Paid Clearances'}</div>
                        <div className="text-2xl font-mono font-black text-emerald-600">{kpi.paid.toLocaleString('en-US')} <span className="text-xs">SAR</span></div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative">
                    <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? 'بحث برقم المستخلص، المشروع، العميل...' : 'Search clearances...'} className={`w-full border rounded-xl px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500' : 'bg-white border-slate-200 focus:border-amber-500 shadow-sm'}`} />
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-amber-600" size={50} /></div>
                ) : filteredClearances.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem]">
                        <Receipt size={48} className="mx-auto text-slate-400 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'لا توجد مستخلصات مسجلة.' : 'No clearances found.'}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClearances.map(clearance => {
                            const statusUI = getStatusUI(clearance.status);
                            const StatusIcon = statusUI.icon;
                            return (
                                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={clearance.id} className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all hover:shadow-xl ${cardBg}`}>
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${statusUI.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`font-mono text-xs font-black px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`}>
                                            {clearance.clearance_number}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${statusUI.bg} ${statusUI.color} ${statusUI.border}`}>
                                            <StatusIcon size={12}/> {statusUI.label}
                                        </span>
                                    </div>
                                    
                                    <h3 className={`text-lg font-black leading-tight mb-2 truncate ${textMain}`}>
                                        {clearance.project?.title || 'مشروع غير محدد'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-500 mb-4 truncate flex items-center gap-1"><Building2 size={12}/> {isRTL ? clearance.client?.name_ar : (clearance.client?.name_en || clearance.client?.name_ar)}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> {isRTL ? 'تاريخ الرفع' : 'Submitted'}</div>
                                            <div className={`text-sm font-bold ${textMain}`}>{clearance.submission_date}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'قيمة المستخلص' : 'Amount'}</div>
                                            <div className={`text-sm font-mono font-black ${clearance.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{Number(clearance.total_amount).toLocaleString()} SAR</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}