'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { 
  Building2, MapPin, Phone, Mail, FileText, User,
  CreditCard, Calendar, Users, Landmark, Percent,
  ArrowRight, ArrowLeft, CheckCircle2, UploadCloud, 
  X, Plus, Loader2, ShieldCheck, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout';

export default function CreateSubcontractorPage() {
  const router = useRouter();
  const { lang, isDark } = useDashboard(); 
  const isRTL = lang === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Form States ---
  const [basicInfo, setBasicInfo] = useState({
    name: '', location: '', email: '', phone: '',
    cr_number: '', tax_number: '', national_address: '', bank_account: '',
    payment_terms: '', account_type: 'Credit', deal_start_date: ''
  });

  const [contactPersons, setContactPersons] = useState([{ name: '', email: '', nationality: '' }]);
  
  const [hasBroker, setHasBroker] = useState(false);
  const [broker, setBroker] = useState({ name: '', percentage: '', phone: '', email: '', id_number: '', bank_account: '', address: '' });

  const [hasPettyCash, setHasPettyCash] = useState(false);
  const [pettyCash, setPettyCash] = useState({ amount: '', date: '', details: '' });

  // --- Files States ---
  const [files, setFiles] = useState({
      crFile: null as File | null,
      taxFile: null as File | null,
      addressFile: null as File | null,
      contractFile: null as File | null,
      brokerIdFile: null as File | null
  });

  // --- Handlers ---
  const handleContactChange = (idx: number, field: string, value: string) => {
      const newContacts = [...contactPersons];
      newContacts[idx] = { ...newContacts[idx], [field]: value };
      setContactPersons(newContacts);
  };

  const addContact = () => setContactPersons([...contactPersons, { name: '', email: '', nationality: '' }]);
  const removeContact = (idx: number) => setContactPersons(contactPersons.filter((_, i) => i !== idx));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileKey: keyof typeof files) => {
      if (e.target.files && e.target.files[0]) {
          let file = e.target.files[0];
          if (file.type.startsWith('image/')) {
              try {
                  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
                  file = new File([compressed], file.name, { type: file.type });
              } catch (err) { console.error('Compression error', err); }
          }
          setFiles(prev => ({ ...prev, [fileKey]: file }));
      }
  };

  const uploadFileToSupabase = async (file: File | null, folder: string, existingUrl: string) => {
      if (!file) return existingUrl; 
      
      // 1. استخراج امتداد الملف الأصلي (مثلاً png أو pdf)
      const fileExt = file.name.split('.').pop();
      
      // 2. إنشاء اسم عشوائي وآمن جداً خالي من أي حروف عربية
      const randomString = Math.random().toString(36).substring(2, 10);
      const safeFileName = `vendors/${folder}/${Date.now()}_${randomString}.${fileExt}`;
      
      // 3. الرفع مع خاصية upsert لتفادي الأخطاء
      const { error } = await supabase.storage.from('tech-media').upload(safeFileName, file, {
          upsert: true
      });
      
      if (error) throw error;
      
      const { data } = supabase.storage.from('tech-media').getPublicUrl(safeFileName);
      return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!basicInfo.name || !basicInfo.cr_number || !basicInfo.tax_number) {
          alert(isRTL ? 'الرجاء إكمال البيانات الأساسية (الاسم، السجل، الرقم الضريبي)' : 'Please fill required fields');
          return;
      }
      setIsSubmitting(true);

      try {
          
          const document_urls = {
              cr_url: await uploadFileToSupabase(files.crFile, 'cr', ''),
              tax_url: await uploadFileToSupabase(files.taxFile, 'tax', ''),
              address_url: await uploadFileToSupabase(files.addressFile, 'address', ''),
              contract_url: await uploadFileToSupabase(files.contractFile, 'contracts', ''),
              broker_id_url: hasBroker ? await uploadFileToSupabase(files.brokerIdFile, 'broker', '') : null
          };

          // 2. Format Data
          const broker_details = hasBroker ? { ...broker, id_url: document_urls.broker_id_url } : null;
          const petty_cash_details = hasPettyCash ? pettyCash : null;

          // 3. Insert into Database
          const { error } = await supabase.from('subcontractors').insert({
              name: basicInfo.name,
              company_reg_number: basicInfo.cr_number,
              tax_number: basicInfo.tax_number,
              contact_email: basicInfo.email,
              contact_phone: basicInfo.phone,
              location: basicInfo.location,
              national_address: basicInfo.national_address,
              bank_account: basicInfo.bank_account,
              payment_terms: basicInfo.payment_terms,
              account_type: basicInfo.account_type,
              deal_start_date: basicInfo.deal_start_date || null,
              contact_persons: contactPersons,
              broker_details: broker_details,
              petty_cash_details: petty_cash_details,
              document_urls: document_urls
          });

          if (error) throw error;

          alert(isRTL ? 'تم تسجيل المقاول بنجاح وإضافته لشجرة الحسابات!' : 'Subcontractor registered successfully!');
          router.back(); // العودة لصفحة إنشاء المشروع أو القائمة

      } catch (error: any) {
          console.error(error);
          alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving data');
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- UI Helpers ---
  const glassCard = isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200";
  const inputBg = isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`min-h-screen font-sans pb-24 ${isDark ? 'bg-slate-950' : 'bg-slate-50'} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <header className={`sticky top-0 z-40 px-6 py-5 border-b backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
            </button>
            <div>
              <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                <Building2 className="text-blue-600" /> {isRTL ? 'تسجيل مقاول / مورد رئيسي' : 'Register Main Subcontractor'}
              </h1>
              <p className={`text-sm font-medium mt-1 ${textSub}`}>{isRTL ? 'إضافة ملف شامل للمقاول لربطه بشجرة الحسابات والمشاريع.' : 'Add full vendor profile to link with GL and Projects.'}</p>
            </div>
          </div>
          <button type="button" disabled={isSubmitting} onClick={handleSubmit} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
              {isRTL ? 'حفظ واعتماد المقاول' : 'Save Contractor'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-4 space-y-8">
        
        {/* Section 1: Basic & Official Info */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className={`text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                <ShieldCheck className="text-blue-500" size={20}/> {isRTL ? 'البيانات الأساسية والرسمية' : 'Official Information'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'اسم المقاول / الشركة *' : 'Contractor Name *'}</label>
                    <input type="text" required value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-lg transition ${inputBg}`} />
                </div>
                
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'رقم السجل التجاري *' : 'CR Number *'}</label>
                    <input type="text" dir="ltr" value={basicInfo.cr_number} onChange={e => setBasicInfo({...basicInfo, cr_number: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm rtl:text-right ${inputBg}`} />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'الرقم الضريبي *' : 'Tax Number *'}</label>
                    <input type="text" dir="ltr" value={basicInfo.tax_number} onChange={e => setBasicInfo({...basicInfo, tax_number: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm rtl:text-right ${inputBg}`} />
                </div>

                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'رقم التواصل الأساسي' : 'Primary Phone'}</label>
                    <div className="relative">
                        <Phone className="absolute top-4 rtl:right-4 ltr:left-4 text-slate-400" size={18}/>
                        <input type="tel" dir="ltr" value={basicInfo.phone} onChange={e => setBasicInfo({...basicInfo, phone: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm rtl:pr-12 ltr:pl-12 rtl:text-right ${inputBg}`} />
                    </div>
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'الإيميل الرسمي' : 'Official Email'}</label>
                    <div className="relative">
                        <Mail className="absolute top-4 rtl:right-4 ltr:left-4 text-slate-400" size={18}/>
                        <input type="email" dir="ltr" value={basicInfo.email} onChange={e => setBasicInfo({...basicInfo, email: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm rtl:pr-12 ltr:pl-12 rtl:text-right ${inputBg}`} />
                    </div>
                </div>

                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'الموقع / المدينة' : 'City / Location'}</label>
                    <div className="relative">
                        <MapPin className="absolute top-4 rtl:right-4 ltr:left-4 text-slate-400" size={18}/>
                        <input type="text" value={basicInfo.location} onChange={e => setBasicInfo({...basicInfo, location: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm rtl:pr-12 ltr:pl-12 ${inputBg}`} />
                    </div>
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'العنوان الوطني (Short Address)' : 'National Address'}</label>
                    <input type="text" value={basicInfo.national_address} onChange={e => setBasicInfo({...basicInfo, national_address: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-blue-500 font-bold text-sm ${inputBg}`} />
                </div>
            </div>
        </section>

        {/* Section 2: Financial & Terms */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className={`text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                <Landmark className="text-emerald-500" size={20}/> {isRTL ? 'المالية والشروط' : 'Financials & Terms'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'الحساب البنكي (الآيبان)' : 'Bank Account (IBAN)'}</label>
                    <div className="relative">
                        <CreditCard className="absolute top-4 rtl:right-4 ltr:left-4 text-slate-400" size={18}/>
                        <input type="text" dir="ltr" placeholder="SA..." value={basicInfo.bank_account} onChange={e => setBasicInfo({...basicInfo, bank_account: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-emerald-500 font-bold text-sm uppercase rtl:pr-12 ltr:pl-12 rtl:text-right ${inputBg}`} />
                    </div>
                </div>
                
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'نوع الحساب / التعامل' : 'Account Type'}</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${basicInfo.account_type === 'Cash' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500 text-emerald-700' : inputBg}`}>
                            <input type="radio" name="acc_type" checked={basicInfo.account_type === 'Cash'} onChange={() => setBasicInfo({...basicInfo, account_type: 'Cash'})} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${basicInfo.account_type === 'Cash' ? 'border-emerald-600' : 'border-slate-300'}`}>{basicInfo.account_type === 'Cash' && <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>}</div>
                            <span className="font-bold text-sm">{isRTL ? 'نقدي (Cash)' : 'Cash'}</span>
                        </label>
                        <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${basicInfo.account_type === 'Credit' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500 text-blue-700' : inputBg}`}>
                            <input type="radio" name="acc_type" checked={basicInfo.account_type === 'Credit'} onChange={() => setBasicInfo({...basicInfo, account_type: 'Credit'})} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${basicInfo.account_type === 'Credit' ? 'border-blue-600' : 'border-slate-300'}`}>{basicInfo.account_type === 'Credit' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}</div>
                            <span className="font-bold text-sm">{isRTL ? 'آجل (Credit)' : 'Credit'}</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'مدة صرف المستخلصات' : 'Payment Terms'}</label>
                    <input type="text" placeholder={isRTL ? 'مثال: 30 يوم من رفع الفاتورة' : 'e.g. 30 Days after invoice'} value={basicInfo.payment_terms} onChange={e => setBasicInfo({...basicInfo, payment_terms: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-emerald-500 font-bold text-sm ${inputBg}`} />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${textSub}`}>{isRTL ? 'تاريخ بداية التعامل (توقيع الاتفاقية)' : 'Deal Start Date'}</label>
                    <div className="relative">
                        <Calendar className="absolute top-4 rtl:right-4 ltr:left-4 text-slate-400" size={18}/>
                        <input type="date" value={basicInfo.deal_start_date} onChange={e => setBasicInfo({...basicInfo, deal_start_date: e.target.value})} className={`w-full p-4 rounded-xl border outline-none focus:border-emerald-500 font-bold text-sm rtl:pr-12 ltr:pl-12 ${inputBg}`} />
                    </div>
                </div>
            </div>
        </section>

        {/* Section 3: Contact Persons */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className={`text-lg font-black flex items-center gap-2 ${textMain}`}>
                    <Users className="text-purple-500" size={20}/> {isRTL ? 'الأشخاص المسؤولون (Contact Persons)' : 'Contact Persons'}
                </h3>
                <button type="button" onClick={addContact} className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400 rounded-lg text-xs font-bold transition flex items-center gap-1">
                    <Plus size={14}/> {isRTL ? 'إضافة مسؤول' : 'Add Person'}
                </button>
            </div>

            <div className="space-y-4">
                {contactPersons.map((contact, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                           <span className="text-xs font-bold text-slate-500">{isRTL ? `المسؤول #${idx + 1}` : `Person #${idx + 1}`}</span>
                           {contactPersons.length > 1 && (
                               <button type="button" onClick={() => removeContact(idx)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                                   <X size={14}/> {isRTL ? 'إزالة' : 'Remove'}
                               </button>
                           )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'الاسم والمنصب' : 'Name & Title'}</label>
                                <input type="text" placeholder={isRTL ? 'مثال: م. أحمد - مدير المشاريع' : 'Name & Title'} value={contact.name} onChange={(e) => handleContactChange(idx, 'name', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'الإيميل' : 'Email'}</label>
                                <input type="email" dir="ltr" placeholder="email@..." value={contact.email} onChange={(e) => handleContactChange(idx, 'email', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold rtl:text-right ${inputBg}`} />
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'الجنسية' : 'Nationality'}</label>
                                <input type="text" value={contact.nationality} onChange={(e) => handleContactChange(idx, 'nationality', e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Section 4: Broker & Petty Cash (Conditional) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Broker Section */}
            <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-black flex items-center gap-2 ${textMain}`}>
                        <User className="text-rose-500" size={20}/> {isRTL ? 'بيانات الوسيط' : 'Broker Details'}
                    </h3>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={hasBroker} onChange={() => setHasBroker(!hasBroker)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${hasBroker ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasBroker ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="mx-3 text-sm font-bold text-slate-500">{hasBroker ? (isRTL ? 'يوجد وسيط' : 'Yes') : (isRTL ? 'لا يوجد' : 'No')}</div>
                    </label>
                </div>

                <AnimatePresence>
                    {hasBroker && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'اسم الوسيط' : 'Broker Name'}</label>
                                    <input type="text" value={broker.name} onChange={e=>setBroker({...broker, name:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                                </div>
                                <div>
                                    <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'نسبة الوسيط' : 'Percentage'}</label>
                                    <div className="relative">
                                        <Percent className="absolute top-3.5 rtl:right-3 ltr:left-3 text-rose-400" size={16}/>
                                        <input type="text" dir="ltr" placeholder="5%" value={broker.percentage} onChange={e=>setBroker({...broker, percentage:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold rtl:pr-9 ltr:pl-9 rtl:text-right ${inputBg}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'رقم الجوال' : 'Phone'}</label><input type="tel" dir="ltr" value={broker.phone} onChange={e=>setBroker({...broker, phone:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold rtl:text-right ${inputBg}`} /></div>
                                <div><label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'رقم الهوية/الإقامة' : 'ID Number'}</label><input type="text" dir="ltr" value={broker.id_number} onChange={e=>setBroker({...broker, id_number:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold rtl:text-right ${inputBg}`} /></div>
                            </div>
                            <div><label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'الحساب البنكي للوسيط' : 'Broker IBAN'}</label><input type="text" dir="ltr" value={broker.bank_account} onChange={e=>setBroker({...broker, bank_account:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold uppercase rtl:text-right ${inputBg}`} /></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Petty Cash Section */}
            <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-black flex items-center gap-2 ${textMain}`}>
                        <Wallet className="text-amber-500" size={20}/> {isRTL ? 'العهد المستلمة' : 'Retained Cash'}
                    </h3>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={hasPettyCash} onChange={() => setHasPettyCash(!hasPettyCash)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${hasPettyCash ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasPettyCash ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="mx-3 text-sm font-bold text-slate-500">{hasPettyCash ? (isRTL ? 'يوجد عهدة' : 'Yes') : (isRTL ? 'لا يوجد' : 'No')}</div>
                    </label>
                </div>

                <AnimatePresence>
                    {hasPettyCash && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'مبلغ العهدة' : 'Amount'}</label>
                                    <input type="number" placeholder="SAR" value={pettyCash.amount} onChange={e=>setPettyCash({...pettyCash, amount:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                                </div>
                                <div>
                                    <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'تاريخ الاستلام' : 'Date Received'}</label>
                                    <input type="date" value={pettyCash.date} onChange={e=>setPettyCash({...pettyCash, date:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold ${inputBg}`} />
                                </div>
                            </div>
                            <div>
                                <label className={`text-[10px] font-bold uppercase mb-1 block ${textSub}`}>{isRTL ? 'تفاصيل العهدة' : 'Details'}</label>
                                <textarea rows={2} placeholder={isRTL ? 'سبب العهدة أو تفاصيلها...' : 'Details...'} value={pettyCash.details} onChange={e=>setPettyCash({...pettyCash, details:e.target.value})} className={`w-full p-3 rounded-xl border text-sm font-bold resize-none ${inputBg}`} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>

        {/* Section 5: Documents Upload */}
        <section className={`p-8 rounded-[2rem] shadow-sm ${glassCard}`}>
            <h3 className={`text-lg font-black flex items-center gap-2 mb-6 pb-4 border-b ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                <UploadCloud className="text-indigo-500" size={20}/> {isRTL ? 'المرفقات الرسمية' : 'Official Documents'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FileUploadBox label={isRTL ? 'صورة السجل التجاري' : 'CR Copy'} file={files.crFile} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'crFile')} isDark={isDark} />
                <FileUploadBox label={isRTL ? 'الشهادة الضريبية' : 'Tax Certificate'} file={files.taxFile} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'taxFile')} isDark={isDark} />
                <FileUploadBox label={isRTL ? 'العنوان الوطني' : 'National Address'} file={files.addressFile} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'addressFile')} isDark={isDark} />
                <FileUploadBox label={isRTL ? 'نسخة العقد المبرم' : 'Contract Copy'} file={files.contractFile} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'contractFile')} isDark={isDark} />
                {hasBroker && (
                    <FileUploadBox label={isRTL ? 'هوية الوسيط' : 'Broker ID'} file={files.brokerIdFile} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e, 'brokerIdFile')} isDark={isDark} />
                )}
            </div>
        </section>

      </main>
    </div>
  );
}

// --- Helper Component for File Upload ---
function FileUploadBox({ label, file, onChange, isDark }: { label: string, file: File | null, onChange: any, isDark: boolean }) {
    return (
        <div className={`border-2 border-dashed rounded-2xl p-4 text-center relative overflow-hidden transition-all ${file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : isDark ? 'border-slate-700 bg-slate-800/50 hover:border-blue-500' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}>
            <input type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={onChange} />
            <div className="flex flex-col items-center justify-center gap-2">
                {file ? <CheckCircle2 className="text-emerald-500" size={24} /> : <FileText className="text-slate-400" size={24} />}
                <div className={`text-xs font-bold ${file ? 'text-emerald-700 dark:text-emerald-400' : isDark ? 'text-white' : 'text-slate-700'}`}>{label}</div>
                {file && <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{file.name}</div>}
            </div>
        </div>
    );
}