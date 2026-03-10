'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Plus, Users, MapPin, Phone, Mail, 
    ArrowRight, ArrowLeft, Loader2, X, 
    Building2, AlertTriangle, ExternalLink, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Client {
    id: string;
    name_ar: string;
    name_en: string;
    tax_number: string;
    cr_number: string;
    address_short: string;
    address_detailed: string;
    contact_method: string;
    contact_phone: string;
    contact_email: string;
    contact_person_name: string;
    contact_person_method: string;
    contact_person_phone: string;
    contact_person_email: string;
    payment_term: 'cash' | 'credit';
    balance: number;
    debt_start_date: string | null;
    lat: number;
    lng: number;
}

export default function ClientsListPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
            if (!error && data) setClients(data);
            setLoading(false);
        };
        fetchClients();
    }, []);

    const getDebtAge = (dateString: string | null) => {
        if (!dateString) return 0;
        const diffTime = Math.abs(new Date().getTime() - new Date(dateString).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const filteredClients = clients.filter(c => 
        c.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.name_en && c.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tax_number && c.tax_number.includes(searchQuery))
    );

    const totalDebt = clients.reduce((sum, c) => sum + Number(c.balance), 0);

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        <div>
                            <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Users size={24}/></div>
                                {isRTL ? 'قائمة العملاء والأرصدة' : 'Clients & Balances'}
                            </h1>
                            <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'إدارة بيانات العملاء، المديونيات، والموقع.' : 'Manage clients, debts, and locations.'}</p>
                        </div>
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">{isRTL ? 'إجمالي المديونيات' : 'Total Debts'}</div>
                                <div className="text-2xl font-mono font-black text-rose-500">{totalDebt.toLocaleString()} <span className="text-xs">SAR</span></div>
                            </div>
                            <button onClick={() => router.push('/dashboard/finance/clients/new')} className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                                <Plus size={18}/> {isRTL ? 'عميل جديد' : 'New Client'}
                            </button>
                        </div>
                    </div>

                    <div className="relative max-w-md">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? "بحث باسم العميل، الرقم الضريبي..." : "Search..."} className={`w-full border rounded-[1.2rem] px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'}`} />
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-600" size={50} /></div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 rounded-[2rem]">
                        <Users size={48} className="mx-auto text-slate-300 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'لا يوجد عملاء.' : 'No clients found.'}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredClients.map(client => (
                            <motion.div 
                                initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={client.id} 
                                onClick={() => setSelectedClient(client)}
                                className={`cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 group ${cardBg}`}
                            >
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${client.balance > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-inner border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <Building2 size={20}/>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${client.payment_term === 'credit' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {client.payment_term === 'credit' ? (isRTL ? 'مسموح بالآجل' : 'Credit') : (isRTL ? 'نقدي فقط' : 'Cash')}
                                        </span>
                                    </div>
                                    <h3 className={`text-lg font-black leading-tight mb-4 line-clamp-2 ${textMain}`}>{isRTL ? client.name_ar : (client.name_en || client.name_ar)}</h3>
                                    
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'الرصيد / المديونية' : 'Balance'}</div>
                                        <div className={`text-xl font-mono font-black ${client.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {Number(client.balance).toLocaleString()} <span className="text-xs">SAR</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedClient && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                            onClick={() => setSelectedClient(null)}
                        />
                        <motion.div 
                            initial={{ x: isRTL ? '-100%' : '100%', opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            exit={{ x: isRTL ? '-100%' : '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed top-0 bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full max-w-md z-[101] shadow-2xl flex flex-col ${isDark ? 'bg-slate-950 border-r border-slate-800' : 'bg-white'}`}
                        >
                            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className={`text-xl font-black ${textMain}`}>{isRTL ? 'ملف العميل' : 'Client Profile'}</h2>
                                <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition"><X size={20}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                <div className={`p-5 rounded-2xl border-2 ${selectedClient.balance > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`text-xs font-bold ${selectedClient.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {selectedClient.balance > 0 ? (isRTL ? 'عليه مديونية' : 'Has Debt') : (isRTL ? 'رصيد سليم' : 'Clear Balance')}
                                        </div>
                                        {selectedClient.balance > 0 && <AlertTriangle size={16} className="text-rose-500 animate-pulse"/>}
                                    </div>
                                    <div className={`text-3xl font-mono font-black ${selectedClient.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {Number(selectedClient.balance).toLocaleString()} <span className="text-sm">SAR</span>
                                    </div>
                                    {selectedClient.balance > 0 && (
                                        <div className="mt-3 pt-3 border-t border-rose-200/50 text-xs font-bold text-rose-700 flex justify-between">
                                            <span>عمر المديونية:</span>
                                            <span>{getDebtAge(selectedClient.debt_start_date)} يوم</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className={`text-2xl font-black mb-1 ${textMain}`}>{isRTL ? selectedClient.name_ar : (selectedClient.name_en || selectedClient.name_ar)}</h3>
                                    {selectedClient.name_en && isRTL && <p className="text-xs font-bold text-slate-400 mb-4">{selectedClient.name_en}</p>}
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="text-[10px] font-bold text-slate-500 block mb-1">الرقم الضريبي</span>
                                            <span className={`font-mono font-bold text-sm ${textMain}`}>{selectedClient.tax_number || '-'}</span>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="text-[10px] font-bold text-slate-500 block mb-1">السجل التجاري</span>
                                            <span className={`font-mono font-bold text-sm ${textMain}`}>{selectedClient.cr_number || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2"><Phone size={14}/> تواصل الشركة</h4>
                                    {selectedClient.contact_phone && <div className="flex items-center gap-3 text-sm font-bold"><Phone size={16} className="text-slate-400"/> <span dir="ltr">{selectedClient.contact_phone}</span></div>}
                                    {selectedClient.contact_email && <div className="flex items-center gap-3 text-sm font-bold"><Mail size={16} className="text-slate-400"/> {selectedClient.contact_email}</div>}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2"><UserCircle size={14}/> المندوب / المسؤول</h4>
                                    <div className={`font-bold ${textMain}`}>{selectedClient.contact_person_name || 'غير مسجل'}</div>
                                    {selectedClient.contact_person_phone && <div className="flex items-center gap-3 text-sm font-bold"><Phone size={16} className="text-slate-400"/> <span dir="ltr">{selectedClient.contact_person_phone}</span></div>}
                                    {selectedClient.contact_person_email && <div className="flex items-center gap-3 text-sm font-bold"><Mail size={16} className="text-slate-400"/> {selectedClient.contact_person_email}</div>}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2"><MapPin size={14}/> الموقع الجغرافي</h4>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="font-mono font-bold text-sm text-blue-600 mb-2">{selectedClient.address_short}</div>
                                        <div className="text-xs font-medium leading-relaxed text-slate-500">{selectedClient.address_detailed}</div>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedClient.lat},${selectedClient.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                                    >
                                        <ExternalLink size={16}/> فتح في خرائط جوجل
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}