'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    ArrowRight, ArrowLeft, Save, PlusCircle, Trash2, 
    ArrowUpRight, Users, Briefcase, Calendar, Loader2, PackageOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IssueLine {
    id: string;
    item_id: string;
    quantity: number | string;
    max_qty: number;
}

export default function IssueInventoryPage() {
    const { lang, isDark, user } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [projects, setProjects] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        issue_number: `ISU-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`,
        project_id: '',
        technician_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [lines, setLines] = useState<IssueLine[]>([
        { id: '1', item_id: '', quantity: 1, max_qty: 0 }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            const [projRes, techRes, itemsRes] = await Promise.all([
                supabase.from('projects').select('id, title').eq('status', 'Active'),
                supabase.from('profiles').select('id, full_name').in('role', ['technician', 'supervisor']),
                supabase.from('inventory_items').select('*').gt('quantity_in_stock', 0) // نجلب فقط المتوفر
            ]);
            if (projRes.data) setProjects(projRes.data);
            if (techRes.data) setTechnicians(techRes.data);
            if (itemsRes.data) setInventoryItems(itemsRes.data);
        };
        fetchData();
    }, []);

    const handleAddLine = () => {
        setLines([...lines, { id: Math.random().toString(), item_id: '', quantity: 1, max_qty: 0 }]);
    };

    const handleRemoveLine = (id: string) => {
        if (lines.length > 1) setLines(lines.filter(l => l.id !== id));
    };

    const updateLineItem = (id: string, item_id: string) => {
        const selectedItem = inventoryItems.find(i => i.id === item_id);
        const maxQty = selectedItem ? selectedItem.quantity_in_stock : 0;
        setLines(lines.map(l => l.id === id ? { ...l, item_id, max_qty: maxQty, quantity: 1 } : l));
    };

    const updateLineQty = (id: string, qty: string) => {
        setLines(lines.map(l => {
            if (l.id === id) {
                let numQty = Number(qty);
                if (numQty > l.max_qty) numQty = l.max_qty; // نمنعه من صرف أكثر من المتوفر
                return { ...l, quantity: numQty };
            }
            return l;
        }));
    };

    const handleSave = async () => {
        if (!form.technician_id) return alert(isRTL ? 'الرجاء اختيار الفني المستلم' : 'Please select a technician');
        if (lines.some(l => !l.item_id || Number(l.quantity) <= 0)) return alert(isRTL ? 'الرجاء إكمال تفاصيل جميع المواد المصرّفة' : 'Please complete all items');
        
        setIsSubmitting(true);
        try {
            // 1. حفظ سند الصرف
            const { data: issueData, error: issueError } = await supabase.from('inventory_issues').insert({
                issue_number: form.issue_number,
                project_id: form.project_id || null,
                technician_id: form.technician_id,
                issue_date: form.issue_date,
                notes: form.notes,
                status: 'Issued',
                created_by: user?.id
            }).select('id').single();

            if (issueError) throw issueError;

            // 2. تجهيز البنود + خصم الكميات من المخزون
            const linesToInsert = [];
            for (const l of lines) {
                const qty = Number(l.quantity);
                linesToInsert.push({ issue_id: issueData.id, item_id: l.item_id, quantity: qty });
                
                // 🚀 سحر الخصم المباشر (خصم الرصيد من المستودع)
                const currentItem = inventoryItems.find(i => i.id === l.item_id);
                if (currentItem) {
                    await supabase.from('inventory_items')
                        .update({ quantity_in_stock: currentItem.quantity_in_stock - qty })
                        .eq('id', l.item_id);
                }
            }

            const { error: linesError } = await supabase.from('inventory_issue_lines').insert(linesToInsert);
            if (linesError) throw linesError;

            alert(isRTL ? 'تم صرف المواد بنجاح وتم خصمها من المستودع!' : 'Items issued and deducted from stock successfully!');
            router.push('/dashboard/finance/inventory/manage');

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-amber-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-40 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`px-4 md:px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 max-w-5xl mx-auto">
                    <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className={`text-xl md:text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl hidden sm:block"><ArrowUpRight size={24}/></div>
                            {isRTL ? 'سند صرف مواد (Issue Items)' : 'Issue Inventory Items'}
                        </h1>
                        <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'صرف مواد للمشاريع أو الفنيين مع خصمها من الرصيد.' : 'Assign items to projects/techs and deduct from stock.'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8 space-y-6">
                
                <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Users size={14}/> {isRTL ? 'يُصرف إلى (الفني المستلم) *' : 'Issue To (Technician) *'}</label>
                            <select value={form.technician_id} onChange={e=>setForm({...form, technician_id: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer transition ${inputBg}`}>
                                <option value="">-- اختر الفني --</option>
                                {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Briefcase size={14}/> {isRTL ? 'المشروع المرتبط (اختياري)' : 'Project (Optional)'}</label>
                            <select value={form.project_id} onChange={e=>setForm({...form, project_id: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer transition ${inputBg}`}>
                                <option value="">-- صرف عام --</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">رقم السند</label>
                            <input type="text" value={form.issue_number} disabled className={`w-full p-3.5 rounded-xl border outline-none font-mono font-bold text-sm opacity-60 ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Calendar size={14}/> تاريخ الصرف</label>
                            <input type="date" value={form.issue_date} onChange={e=>setForm({...form, issue_date: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm transition ${inputBg}`} />
                        </div>
                    </div>
                </div>

                <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${cardBg}`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{isRTL ? 'المواد المنصرفة' : 'Issued Items'}</h2>
                    </div>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-start min-w-[600px]">
                            <thead className={`text-xs uppercase font-black border-b ${isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                                <tr>
                                    <th className={`p-4 w-2/3 ${isRTL ? 'text-right' : 'text-left'}`}>المادة / الصنف</th>
                                    <th className={`p-4 w-40 ${isRTL ? 'text-left' : 'text-right'}`}>الكمية المصروفة</th>
                                    <th className="p-4 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                <AnimatePresence>
                                    {lines.map((line) => (
                                        <motion.tr initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3">
                                                <select value={line.item_id} onChange={e => updateLineItem(line.id, e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm cursor-pointer ${inputBg}`}>
                                                    <option value="">-- اختر المادة --</option>
                                                    {inventoryItems.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.item_code} | {isRTL ? item.name_ar : item.name_en} (متاح: {item.quantity_in_stock})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <div className="relative">
                                                    {/* ✅ تم إصلاح خطأ TypeScript بتحويل line.quantity إلى Number */}
                                                    <input type="number" min="1" max={line.max_qty || 1} value={line.quantity} onChange={e => updateLineQty(line.id, e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-mono font-black text-sm text-center ${line.max_qty > 0 && Number(line.quantity) >= line.max_qty ? 'text-amber-500 border-amber-500' : ''} ${inputBg}`} />
                                                    {line.item_id && <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[9px] px-1.5 rounded font-mono">Max: {line.max_qty}</div>}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveLine(line.id)} disabled={lines.length <= 1} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 cursor-pointer"><Trash2 size={18}/></button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <button onClick={handleAddLine} className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 px-4 py-2.5 rounded-xl transition">
                            <PlusCircle size={18}/> {isRTL ? 'إضافة سطر' : 'Add Line'}
                        </button>
                    </div>
                </div>

                <div className={`p-6 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'ملاحظات / سبب الصرف' : 'Notes / Reason'}</label>
                    <textarea rows={2} value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-medium text-sm resize-none ${inputBg}`} placeholder="اكتب هنا..." />
                </div>

            </div>

            <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex justify-end gap-3">
                    <button onClick={() => router.back()} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSubmitting || !form.technician_id}
                        className="px-10 py-3.5 rounded-2xl font-black text-base bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <PackageOpen size={20}/>}
                        {isRTL ? 'اعتماد وصرف المواد' : 'Issue Items'}
                    </button>
                </div>
            </div>

        </div>
    );
}