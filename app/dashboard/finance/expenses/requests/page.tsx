'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { 
    CheckCircle2, XCircle, Clock, Loader2, FileText, 
    Users, Briefcase, DollarSign, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpenseRequest {
    id: string;
    request_number: string;
    category: string;
    amount: number;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
    employee?: { full_name: string };
    project?: { title: string };
}

export default function ExpenseRequestsPage() {
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';

    const [requests, setRequests] = useState<ExpenseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('expense_requests')
            .select('*, employee:profiles!expense_requests_employee_id_fkey(full_name), project:projects(title)')
            .order('created_at', { ascending: false });
        
        if (!error && data) setRequests(data as ExpenseRequest[]);
        setLoading(false);
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleAction = async (req: ExpenseRequest, action: 'Approve' | 'Reject') => {
        if (!confirm(isRTL ? `هل أنت متأكد من ${action === 'Approve' ? 'اعتماد' : 'رفض'} هذا الطلب؟` : 'Are you sure?')) return;
        setProcessingId(req.id);
        try {
            const newStatus = action === 'Approve' ? 'Approved' : 'Rejected';
            
            // 1. تحديث حالة الطلب
            const { error: updateError } = await supabase.from('expense_requests').update({ status: newStatus }).eq('id', req.id);
            if (updateError) throw updateError;

            // 2. إذا تم الاعتماد، قم بإنشاء مصروف فعلي
            if (action === 'Approve') {
                const { error: insertError } = await supabase.from('expenses').insert({
                    expense_number: `EXP-REQ-${req.request_number.split('-')[1]}`,
                    category: req.category,
                    amount: req.amount,
                    total_amount: req.amount, // بافتراض لا توجد ضريبة على السلف والطلبات الداخلية
                    expense_date: new Date().toISOString().split('T')[0],
                    notes: `تم الاعتماد من طلب الموظف: ${req.employee?.full_name} | التفاصيل: ${req.description}`,
                    created_by: user?.id,
                    payment_method: 'Cash' // افتراضي
                });
                if (insertError) throw insertError;
            }

            setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus } : r));

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans pb-20 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto">
                    <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><FileText size={24}/></div>
                        {isRTL ? 'طلبات المصروفات والعهد' : 'Expense Requests'}
                    </h1>
                    <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isRTL ? 'مراجعة طلبات الصرف المرفوعة من الموظفين واعتمادها.' : 'Review and approve employee expense requests.'}
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? <div className="flex justify-center py-32"><Loader2 className="animate-spin text-amber-600" size={50} /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {requests.map(req => (
                                <motion.div layout initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={req.id} className={`p-6 rounded-4xl border relative overflow-hidden transition-all hover:shadow-xl ${cardBg}`}>
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${req.status === 'Approved' ? 'bg-emerald-500' : req.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`font-mono text-xs font-black px-3 py-1.5 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{req.request_number}</div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${req.status === 'Approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : req.status === 'Rejected' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                                            {req.status === 'Pending' ? (isRTL ? 'بانتظار الموافقة' : 'Pending') : req.status === 'Approved' ? (isRTL ? 'تم الاعتماد' : 'Approved') : (isRTL ? 'مرفوض' : 'Rejected')}
                                        </span>
                                    </div>

                                    <h3 className={`text-xl font-mono font-black mb-4 ${req.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{Number(req.amount).toLocaleString()} <span className="text-sm">SAR</span></h3>
                                    
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-xs font-bold"><Users size={14} className="text-slate-400"/> <span className={textMain}>{req.employee?.full_name}</span></div>
                                        {req.project && <div className="flex items-center gap-2 text-xs font-bold"><Briefcase size={14} className="text-slate-400"/> <span className={textMain}>{req.project.title}</span></div>}
                                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">{req.description}</p>
                                    </div>

                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <button onClick={() => handleAction(req, 'Approve')} disabled={processingId === req.id} className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1 border border-emerald-200">
                                                {processingId === req.id ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} {isRTL ? 'اعتماد وصرف' : 'Approve'}
                                            </button>
                                            <button onClick={() => handleAction(req, 'Reject')} disabled={processingId === req.id} className="flex-1 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1 border border-rose-200">
                                                {processingId === req.id ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>} {isRTL ? 'رفض' : 'Reject'}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}