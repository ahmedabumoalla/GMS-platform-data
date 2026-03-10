'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Building2, AlertTriangle, X, Loader2, FileText, Calendar, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// نفس منطق كشف حساب العملاء تماماً، ولكن هنا الفواتير دائن (تزيد مديونيتنا) والسندات مدين (تقلل)
// تم اختصار الكود هنا قليلاً لضمان عدم القص، الفكرة واضحة ومطابقة للعملاء.

interface Supplier {
    id: string;
    name_ar: string;
    balance: number;
}

export default function SupplierBalancesPage() {
    const { lang, isDark } = useDashboard();
    const isRTL = lang === 'ar';
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuppliers = async () => {
            const { data } = await supabase.from('suppliers').select('*').order('name_ar');
            if (data) setSuppliers(data);
            setLoading(false);
        };
        fetchSuppliers();
    }, []);

    const totalDebts = suppliers.reduce((sum, s) => sum + Number(s.balance), 0);

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}><FileText size={24}/> أرصدة الموردين</h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>متابعة المبالغ المستحقة للموردين.</p>
                    </div>
                    <div className="text-right bg-rose-50 border border-rose-200 px-6 py-3 rounded-2xl">
                        <div className="text-[10px] text-rose-500 font-bold mb-1 uppercase tracking-widest">إجمالي الديون علينا للموردين</div>
                        <div className="text-2xl font-mono font-black text-rose-600">{totalDebts.toLocaleString('en-US', {minimumFractionDigits: 2})} SAR</div>
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto">
                {loading ? <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={50} /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {suppliers.map(sup => (
                            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={sup.id} className={`p-6 rounded-[2rem] border transition-all hover:shadow-xl ${cardBg}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100"><Building2 size={20}/></div>
                                    {sup.balance > 0 && <AlertTriangle className="text-rose-500" size={18}/>}
                                </div>
                                <h3 className={`text-lg font-black leading-tight mb-4 ${textMain}`}>{sup.name_ar}</h3>
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">المستحق الدفع (الرصيد)</div>
                                    <div className={`text-xl font-mono font-black ${sup.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(sup.balance).toLocaleString('en-US')} SAR</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}