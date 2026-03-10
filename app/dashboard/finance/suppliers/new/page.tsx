'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    ArrowRight, ArrowLeft, Save, Building2, FileText, 
    MapPin, Phone, Mail, Loader2, Truck
} from 'lucide-react';

export default function NewSupplierPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Form State ---
    const [form, setForm] = useState({
        name_ar: '', 
        name_en: '',
        tax_number: '', 
        cr_number: '',
        address_short: '', 
        contact_phone: '', 
        contact_email: ''
    });

    // --- Save Handler ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('suppliers').insert([form]);
            if (error) throw error;
            
            alert(isRTL ? 'تمت إضافة المورد بنجاح!' : 'Supplier added successfully!');
            router.push('/dashboard/finance/suppliers/list');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Dictionary ---
    const t = {
        ar: {
            title: 'إضافة مورد جديد', desc: 'تسجيل بيانات مورد أو مقاول باطن في النظام.',
            legalInfo: 'البيانات الأساسية والقانونية',
            nameAr: 'اسم المورد (عربي) *', nameEn: 'اسم المورد (إنجليزي)',
            taxNum: 'الرقم الضريبي (VAT)', crNum: 'رقم السجل التجاري (CR)',
            contactInfo: 'معلومات التواصل والعنوان',
            phone: 'رقم الجوال / الهاتف', email: 'البريد الإلكتروني',
            address: 'العنوان الوطني المختصر',
            cancel: 'إلغاء', save: 'حفظ بيانات المورد'
        },
        en: {
            title: 'Add New Supplier', desc: 'Register a new supplier or subcontractor in the system.',
            legalInfo: 'Basic & Legal Info',
            nameAr: 'Supplier Name (Arabic) *', nameEn: 'Supplier Name (English)',
            taxNum: 'VAT Number', crNum: 'CR Number',
            contactInfo: 'Contact & Address Info',
            phone: 'Phone Number', email: 'Email Address',
            address: 'Short National Address',
            cancel: 'Cancel', save: 'Save Supplier'
        }
    }[lang as 'ar' | 'en'] || {
        title: 'Add New Supplier', desc: 'Register a new supplier.',
        legalInfo: 'Basic Info', nameAr: 'Name (AR) *', nameEn: 'Name (EN)',
        taxNum: 'VAT', crNum: 'CR', contactInfo: 'Contact Info',
        phone: 'Phone', email: 'Email', address: 'Address',
        cancel: 'Cancel', save: 'Save'
    };

    // --- UI Classes ---
    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-40 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <div className={`px-6 md:px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 max-w-5xl mx-auto">
                    <button type="button" onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className={`text-xl md:text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hidden sm:flex"><Truck size={24}/></div>
                            {t.title}
                        </h1>
                        <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="max-w-5xl mx-auto px-4 md:px-6 mt-8 space-y-8">
                
                {/* 1. Basic Info */}
                <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <FileText size={18}/> {t.legalInfo}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.nameAr}</label>
                            <input required type="text" value={form.name_ar} onChange={(e) => setForm({...form, name_ar: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm transition-all ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.nameEn}</label>
                            <input type="text" dir="ltr" value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm transition-all ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.taxNum}</label>
                            <input type="text" value={form.tax_number} onChange={(e) => setForm({...form, tax_number: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm tracking-widest transition-all ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.crNum}</label>
                            <input type="text" value={form.cr_number} onChange={(e) => setForm({...form, cr_number: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm tracking-widest transition-all ${inputBg}`} />
                        </div>
                    </div>
                </div>

                {/* 2. Contact & Address */}
                <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <Phone size={18}/> {t.contactInfo}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Phone size={14}/> {t.phone}</label>
                            <input type="text" dir="ltr" placeholder="+966 5X XXX XXXX" value={form.contact_phone} onChange={(e) => setForm({...form, contact_phone: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm transition-all ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Mail size={14}/> {t.email}</label>
                            <input type="email" dir="ltr" placeholder="supplier@example.com" value={form.contact_email} onChange={(e) => setForm({...form, contact_email: e.target.value})} className={`w-full p-4 rounded-xl border outline-none text-sm transition-all ${inputBg}`} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><MapPin size={14}/> {t.address}</label>
                            <input type="text" placeholder="RRDD1234" value={form.address_short} onChange={(e) => setForm({...form, address_short: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm transition-all ${inputBg}`} />
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className={`px-6 md:px-8 py-3.5 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                            {t.cancel}
                        </button>
                        <button type="submit" disabled={isSubmitting || !form.name_ar} className="px-8 md:px-12 py-3.5 rounded-2xl font-black text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                            {t.save}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}