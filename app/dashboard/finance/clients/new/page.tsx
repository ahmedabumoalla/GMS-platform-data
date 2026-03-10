'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
    ArrowRight, ArrowLeft, Save, Building2, FileText, 
    MapPin, Loader2, UserCircle, CreditCard
} from 'lucide-react';

const ProjectMapPicker = dynamic(() => import('@/components/ProjectMapPicker'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">جاري تحميل الخريطة...</div>
});

export default function NewClientPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        name_ar: '', 
        name_en: '',
        tax_number: '', 
        cr_number: '',
        address_short: '', 
        address_detailed: '',
        lat: 24.7136, 
        lng: 46.6753,
        contact_method: 'phone', 
        contact_phone: '', 
        contact_email: '',
        contact_person_name: '', 
        contact_person_method: 'phone', 
        contact_person_phone: '', 
        contact_person_email: '',
        payment_term: 'cash'
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('clients').insert([form]);
            if (error) throw error;
            alert(isRTL ? 'تم إضافة العميل بنجاح!' : 'Client added successfully!');
            router.push('/dashboard/finance/clients/list');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-40 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 max-w-5xl mx-auto">
                    <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Building2 size={24}/></div>
                            {isRTL ? 'إضافة عميل جديد' : 'Add New Client'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'تسجيل بيانات جهة أو عميل في النظام المحاسبي.' : 'Register a new client in the financial system.'}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
                
                <div className={`p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}><FileText size={18}/> {isRTL ? 'البيانات الأساسية والقانونية' : 'Basic & Legal Info'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">اسم العميل (عربي) *</label>
                            <input required type="text" value={form.name_ar} onChange={(e) => setForm({...form, name_ar: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">اسم العميل (إنجليزي)</label>
                            <input type="text" dir="ltr" value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">الرقم الضريبي (VAT)</label>
                            <input type="text" value={form.tax_number} onChange={(e) => setForm({...form, tax_number: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm tracking-widest ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">رقم السجل التجاري (CR)</label>
                            <input type="text" value={form.cr_number} onChange={(e) => setForm({...form, cr_number: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm tracking-widest ${inputBg}`} />
                        </div>
                    </div>
                </div>

                <div className={`p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}><MapPin size={18}/> {isRTL ? 'العنوان الوطني والموقع' : 'National Address & Location'}</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">العنوان المختصر (Short Address)</label>
                                <input type="text" placeholder="مثال: RRDD1234" value={form.address_short} onChange={(e) => setForm({...form, address_short: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm ${inputBg}`} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">العنوان المفصل (Detailed Address)</label>
                                <textarea rows={5} value={form.address_detailed} onChange={(e) => setForm({...form, address_detailed: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-medium text-sm resize-none ${inputBg}`} placeholder="المدينة، الحي، الشارع، رقم المبنى..." />
                            </div>
                        </div>
                        <div className="h-[300px] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative">
                            <ProjectMapPicker lat={form.lat} lng={form.lng} onLocationSelect={(lat, lng) => setForm({...form, lat, lng})} />
                            <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-md text-[10px] font-bold pointer-events-none">
                                اضغط لتحديد الموقع بدقة
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}><UserCircle size={18}/> {isRTL ? 'التواصل والشروط المالية' : 'Contact & Financial Terms'}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-2 mb-4">تواصل الشركة الرئيسي</h3>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block">طريقة التواصل المفضلة</label>
                                <select value={form.contact_method} onChange={(e) => setForm({...form, contact_method: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${inputBg}`}>
                                    <option value="phone">الجوال / واتساب</option>
                                    <option value="email">البريد الإلكتروني</option>
                                </select>
                            </div>
                            {form.contact_method === 'phone' ? (
                                <input type="text" placeholder="رقم الجوال" value={form.contact_phone} onChange={(e) => setForm({...form, contact_phone: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-mono text-sm ${inputBg}`} />
                            ) : (
                                <input type="email" placeholder="البريد الإلكتروني" value={form.contact_email} onChange={(e) => setForm({...form, contact_email: e.target.value})} className={`w-full p-3 rounded-xl border outline-none text-sm ${inputBg}`} />
                            )}
                        </div>

                        <div className="space-y-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-2 mb-4">بيانات المندوب / المسؤول</h3>
                            <input type="text" placeholder="اسم المسؤول" value={form.contact_person_name} onChange={(e) => setForm({...form, contact_person_name: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm ${inputBg}`} />
                            <div className="flex gap-2">
                                <select value={form.contact_person_method} onChange={(e) => setForm({...form, contact_person_method: e.target.value})} className={`w-1/3 p-3 rounded-xl border outline-none font-bold text-sm ${inputBg}`}>
                                    <option value="phone">جوال</option>
                                    <option value="email">إيميل</option>
                                </select>
                                <input 
                                    type="text" 
                                    placeholder={form.contact_person_method === 'phone' ? 'رقم الجوال' : 'الإيميل'} 
                                    value={form.contact_person_method === 'phone' ? form.contact_person_phone : form.contact_person_email} 
                                    onChange={(e) => {
                                        if (form.contact_person_method === 'phone') {
                                            setForm({...form, contact_person_phone: e.target.value});
                                        } else {
                                            setForm({...form, contact_person_email: e.target.value});
                                        }
                                    }} 
                                    className={`w-2/3 p-3 rounded-xl border outline-none text-sm ${inputBg}`} 
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2"><CreditCard size={16}/> شروط الدفع المسموحة للعميل</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${form.payment_term === 'cash' ? 'border-blue-500 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-md' : 'border-transparent text-slate-500 hover:bg-white/50'}`}>
                                    <input type="radio" name="payment" value="cash" checked={form.payment_term === 'cash'} onChange={() => setForm({...form, payment_term: 'cash'})} className="hidden"/>
                                    <span className="font-black">نقدي (Cash Only)</span>
                                </label>
                                <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${form.payment_term === 'credit' ? 'border-blue-500 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-md' : 'border-transparent text-slate-500 hover:bg-white/50'}`}>
                                    <input type="radio" name="payment" value="credit" checked={form.payment_term === 'credit'} onChange={() => setForm({...form, payment_term: 'credit'})} className="hidden"/>
                                    <span className="font-black">آجل (Credit Allowed)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                    <div className="max-w-5xl mx-auto px-6 py-4 flex justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={isSubmitting || !form.name_ar} className="px-12 py-3.5 rounded-2xl font-black text-base bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                            {isRTL ? 'حفظ بيانات العميل' : 'Save Client'}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}