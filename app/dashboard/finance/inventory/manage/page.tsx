'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation'; // ✅ تمت الإضافة
import { 
    Search, Plus, Package, AlertTriangle, ArrowRight, ArrowLeft, 
    Loader2, X, Box, Layers, DollarSign, Activity, Save // ✅ تمت إضافة Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InventoryItem {
    id: string;
    item_code: string;
    name_ar: string;
    name_en: string;
    category: string;
    unit: string;
    quantity_in_stock: number;
    unit_cost: number;
    reorder_level: number;
}

export default function InventoryManagePage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        item_code: `ITM-${Math.floor(Math.random() * 10000)}`,
        name_ar: '', name_en: '',
        category: 'Consumables', unit: 'Piece',
        quantity_in_stock: '', unit_cost: '', reorder_level: '5'
    });

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false });
        if (!error && data) setItems(data);
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('inventory_items').insert({
                item_code: form.item_code, name_ar: form.name_ar, name_en: form.name_en,
                category: form.category, unit: form.unit,
                quantity_in_stock: Number(form.quantity_in_stock) || 0,
                unit_cost: Number(form.unit_cost) || 0,
                reorder_level: Number(form.reorder_level) || 5
            });
            if (error) throw error;
            alert(isRTL ? 'تمت الإضافة بنجاح!' : 'Added successfully!');
            setIsAddModalOpen(false);
            setForm({...form, item_code: `ITM-${Math.floor(Math.random() * 10000)}`, name_ar: '', quantity_in_stock: '', unit_cost: ''});
            fetchItems();
        } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
    };

    const filteredItems = items.filter(i => 
        i.name_ar.includes(searchQuery) || (i.name_en && i.name_en.includes(searchQuery)) || i.item_code.includes(searchQuery)
    );

    const kpi = {
        totalItems: items.length,
        totalValue: items.reduce((sum, i) => sum + (Number(i.quantity_in_stock) * Number(i.unit_cost)), 0),
        lowStock: items.filter(i => Number(i.quantity_in_stock) <= Number(i.reorder_level)).length
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Package size={24}/></div>
                            {isRTL ? 'إدارة المخزون والمواد' : 'Inventory Management'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'مراقبة الأرصدة، التكلفة، وإضافة مواد جديدة.' : 'Monitor stock, costs, and add new items.'}</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => router.push('/dashboard/finance/inventory/issue')} className="flex-1 md:flex-none px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90 transition flex items-center justify-center gap-2 active:scale-95">
                            <ArrowRight size={18} className={isRTL ? '' : 'rotate-180'}/> {isRTL ? 'صرف مواد' : 'Issue Items'}
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                            <Plus size={18}/> {isRTL ? 'مادة جديدة' : 'New Item'}
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${cardBg}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Box size={14}/> {isRTL ? 'إجمالي المواد المدرجة' : 'Total Items'}</div>
                        <div className="text-2xl font-mono font-black text-indigo-500">{kpi.totalItems}</div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${cardBg}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={14}/> {isRTL ? 'القيمة الإجمالية للمخزون' : 'Total Value'}</div>
                        <div className="text-2xl font-mono font-black text-emerald-500">{kpi.totalValue.toLocaleString()} <span className="text-xs text-emerald-500/50">SAR</span></div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${kpi.lowStock > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30' : cardBg}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${kpi.lowStock > 0 ? 'text-rose-500' : 'text-slate-500'}`}><Activity size={14}/> {isRTL ? 'مواد وصلت للحد الأدنى' : 'Low Stock Alerts'}</div>
                        <div className={`text-2xl font-mono font-black ${kpi.lowStock > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>{kpi.lowStock}</div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative max-w-md">
                    <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? "بحث باسم المادة، الرمز..." : "Search items..."} className={`w-full border rounded-2xl px-5 py-3 text-sm font-bold outline-none transition ${inputBg}`} />
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={50} /></div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem]">
                        <Package size={48} className="mx-auto text-slate-300 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'لا توجد مواد.' : 'No items found.'}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {filteredItems.map(item => {
                            const isLowStock = item.quantity_in_stock <= item.reorder_level;
                            return (
                                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={item.id} className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all hover:shadow-xl group ${cardBg}`}>
                                    {isLowStock && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>}
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="font-mono text-xs font-black px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            {item.item_code}
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{item.category}</span>
                                    </div>
                                    
                                    <h3 className={`text-base font-black leading-tight mb-4 line-clamp-2 ${textMain}`}>{isRTL ? item.name_ar : (item.name_en || item.name_ar)}</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 mb-1">{isRTL ? 'الرصيد المتوفر' : 'In Stock'}</div>
                                            <div className={`text-xl font-mono font-black flex items-center gap-1 ${isLowStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {item.quantity_in_stock} <span className="text-[10px] text-slate-400">{item.unit}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 mb-1">{isRTL ? 'تكلفة الوحدة' : 'Unit Cost'}</div>
                                            <div className={`text-xl font-mono font-black ${textMain}`}>
                                                {item.unit_cost} <span className="text-[10px] text-slate-400">SAR</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Add New Item */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className={`text-xl font-black ${textMain}`}>{isRTL ? 'تعريف مادة جديدة' : 'Add New Item'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition"><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSaveItem} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 mb-2 block">الاسم (عربي) *</label><input required type="text" value={form.name_ar} onChange={e=>setForm({...form, name_ar: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-2 block">الاسم (إنجليزي)</label><input type="text" value={form.name_en} onChange={e=>setForm({...form, name_en: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`} /></div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">التصنيف</label>
                                        <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`}>
                                            <option value="Cables">كابلات وتمديدات (Cables)</option>
                                            <option value="Tools">معدات وأدوات (Tools)</option>
                                            <option value="Safety">أدوات سلامة (Safety)</option>
                                            <option value="Consumables">مواد استهلاكية (Consumables)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">وحدة القياس</label>
                                        <select value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`}>
                                            <option value="Piece">حبة (Piece)</option>
                                            <option value="Meter">متر (Meter)</option>
                                            <option value="Box">كرتون (Box)</option>
                                            <option value="Roll">لفة (Roll)</option>
                                        </select>
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-2 block">الرصيد الافتتاحي</label><input required type="number" min="0" value={form.quantity_in_stock} onChange={e=>setForm({...form, quantity_in_stock: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm ${inputBg}`} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-2 block">تكلفة الوحدة (SAR)</label><input required type="number" min="0" step="0.01" value={form.unit_cost} onChange={e=>setForm({...form, unit_cost: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm ${inputBg}`} /></div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className={`flex-1 py-4 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>إلغاء</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} حفظ المادة
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}