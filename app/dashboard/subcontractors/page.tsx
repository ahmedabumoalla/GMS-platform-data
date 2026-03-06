'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Search, Plus, MapPin, Phone, Mail, RefreshCw,
  FileText, CreditCard, Calendar, Users, Landmark, Percent,
  X, Loader2, ArrowRight, ArrowLeft, ShieldCheck, Wallet, 
  Download, ExternalLink, Briefcase, User, Edit2, Trash2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../layout';

export default function SubcontractorsPage() {
  const router = useRouter();
  const { lang, isDark } = useDashboard(); 
  const isRTL = lang === 'ar';

  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals States
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [subToDelete, setSubToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  const fetchSubcontractors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubcontractors(data || []);
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Handler ---
  const handleDelete = async () => {
      if (!subToDelete) return;
      setIsDeleting(true);
      try {
          const { error } = await supabase.from('subcontractors').delete().eq('id', subToDelete.id);
          if (error) throw error;
          
          // Remove from local state to update UI immediately
          setSubcontractors(prev => prev.filter(s => s.id !== subToDelete.id));
          setSubToDelete(null);
      } catch (error: any) {
          console.error(error);
          alert(isRTL ? 'فشل الحذف: ' + error.message : 'Delete failed: ' + error.message);
      } finally {
          setIsDeleting(false);
      }
  };

  const filteredSubs = subcontractors.filter(sub => 
    sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.company_reg_number?.includes(searchQuery) ||
    sub.tax_number?.includes(searchQuery)
  );

  // --- UI Helpers ---
  const glassCard = isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`min-h-screen font-sans space-y-6 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header & Actions */}
      <div className={`p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${glassCard}`}>
        <div>
          <h2 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
            <Building2 className="text-blue-600" /> {isRTL ? 'إدارة المقاولين والموردين' : 'Subcontractors Management'}
          </h2>
          <p className={`text-sm mt-1 ${textSub}`}>{isRTL ? 'عرض وتصفح بيانات المقاولين، الحسابات المالية، والمرفقات الرسمية.' : 'View and manage vendors, financials, and documents.'}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* زر التحديث الجديد */}
          <button onClick={fetchSubcontractors} disabled={loading} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition disabled:opacity-50" title={isRTL ? "تحديث القائمة" : "Refresh"}>
            <RefreshCw size={18} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>

          <div className="relative flex-1 md:w-72">
            <Search className={`absolute top-3 ${isRTL ? 'right-4' : 'left-4'} text-slate-400`} size={18} />
            <input 
              type="text" 
              placeholder={isRTL ? 'بحث بالاسم، السجل، الضريبي...' : 'Search name, CR, Tax...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2.5 rounded-xl outline-none font-bold text-sm transition-all ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} ${isDark ? 'bg-slate-950 border border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500'}`}
            />
          </div>
          <button onClick={() => router.push('/dashboard/subcontractors/create')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} /> {isRTL ? 'إضافة مقاول' : 'Add New'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-[2rem] shadow-sm overflow-hidden ${glassCard}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right whitespace-nowrap">
            <thead className={`text-xs uppercase font-bold ${isDark ? 'bg-slate-950 text-slate-400 border-b border-slate-800' : 'bg-slate-50 text-slate-500 border-b border-slate-100'}`}>
              <tr>
                <th className="px-6 py-5">{isRTL ? 'اسم المقاول' : 'Name'}</th>
                <th className="px-6 py-5">{isRTL ? 'السجل والضريبة' : 'CR & Tax'}</th>
                <th className="px-6 py-5">{isRTL ? 'التواصل' : 'Contact'}</th>
                <th className="px-6 py-5">{isRTL ? 'نوع الحساب' : 'Account Type'}</th>
                <th className="px-6 py-5 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={24}/></td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">{isRTL ? 'لا يوجد مقاولين مطابقين للبحث.' : 'No subcontractors found.'}</td></tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className={`transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/30`}>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSub(sub)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black">{sub.name.charAt(0)}</div>
                        <div className={`font-bold ${textMain} group-hover:text-blue-600 transition-colors`}>{sub.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSub(sub)}>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">CR: <span className="font-mono">{sub.company_reg_number}</span></div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Tax: <span className="font-mono">{sub.tax_number}</span></div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSub(sub)}>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1"><Phone size={12}/> <span dir="ltr">{sub.contact_phone || '-'}</span></div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={12}/> {sub.location || '-'}</div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSub(sub)}>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${sub.account_type === 'Cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                        {sub.account_type === 'Cash' ? (isRTL ? 'نقدي' : 'Cash') : (isRTL ? 'آجل' : 'Credit')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedSub(sub)} title={isRTL ? 'التفاصيل' : 'View'} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition">
                            <FileText size={16} />
                          </button>
                          <button onClick={() => router.push(`/dashboard/subcontractors/edit/${sub.id}`)} title={isRTL ? 'تعديل' : 'Edit'} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-100 hover:text-amber-600 rounded-lg transition">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setSubToDelete(sub)} title={isRTL ? 'حذف' : 'Delete'} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition">
                            <Trash2 size={16} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modals Area --- */}
      <AnimatePresence>
        
        {/* 1. Delete Confirmation Modal */}
        {subToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 ${glassCard}`}>
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-sm">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className={`text-xl font-black text-center mb-2 ${textMain}`}>{isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?'}</h3>
                    <p className={`text-center text-sm mb-6 ${textSub}`}>
                        {isRTL ? `سيتم حذف المقاول "${subToDelete.name}" وجميع بياناته نهائياً. لا يمكن التراجع عن هذا الإجراء.` : `Deleting "${subToDelete.name}" is permanent and cannot be undone.`}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setSubToDelete(null)} disabled={isDeleting} className={`flex-1 py-3 rounded-xl font-bold transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                            {isDeleting ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18}/>}
                            {isRTL ? 'نعم، احذف' : 'Yes, Delete'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* 2. Massive Detail Modal (Unchanged) */}
        {selectedSub && !subToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ${glassCard}`}>
              
              {/* Modal Header */}
              <div className={`px-8 py-6 border-b flex justify-between items-center z-10 shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-2xl font-black">{selectedSub.name.charAt(0)}</div>
                  <div>
                    <h3 className={`font-black text-2xl tracking-tight ${textMain}`}>{selectedSub.name}</h3>
                    <p className={`text-xs font-bold mt-1 flex items-center gap-2 ${textSub}`}>
                        <MapPin size={14}/> {selectedSub.location || isRTL ? 'الموقع غير مسجل' : 'No Location'}
                        <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${selectedSub.account_type === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{selectedSub.account_type}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedSub(null)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition"><X size={20}/></button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                
                {/* 1. Official & Contact Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-sm font-black mb-5 flex items-center gap-2 ${textMain}`}><ShieldCheck className="text-blue-500" size={18}/> {isRTL ? 'البيانات الرسمية والتواصل' : 'Official & Contact'}</h4>
                        <div className="space-y-4">
                            <DetailRow label={isRTL ? 'السجل التجاري' : 'CR Number'} value={selectedSub.company_reg_number} isMono />
                            <DetailRow label={isRTL ? 'الرقم الضريبي' : 'Tax Number'} value={selectedSub.tax_number} isMono />
                            <DetailRow label={isRTL ? 'العنوان الوطني' : 'National Address'} value={selectedSub.national_address} />
                            <DetailRow label={isRTL ? 'رقم الهاتف' : 'Phone'} value={selectedSub.contact_phone} dir="ltr" />
                            <DetailRow label={isRTL ? 'البريد الإلكتروني' : 'Email'} value={selectedSub.contact_email} dir="ltr" />
                        </div>
                    </div>

                    {/* 2. Financial Info */}
                    <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-sm font-black mb-5 flex items-center gap-2 ${textMain}`}><Landmark className="text-emerald-500" size={18}/> {isRTL ? 'البيانات المالية' : 'Financials'}</h4>
                        <div className="space-y-4">
                            <DetailRow label={isRTL ? 'الحساب البنكي (الآيبان)' : 'IBAN'} value={selectedSub.bank_account} isMono isUppercase />
                            <DetailRow label={isRTL ? 'نوع الحساب' : 'Account Type'} value={selectedSub.account_type === 'Cash' ? (isRTL ? 'نقدي' : 'Cash') : (isRTL ? 'آجل' : 'Credit')} highlight={selectedSub.account_type === 'Cash' ? 'emerald' : 'blue'} />
                            <DetailRow label={isRTL ? 'شروط الدفع والمستخلصات' : 'Payment Terms'} value={selectedSub.payment_terms} />
                            <DetailRow label={isRTL ? 'تاريخ بداية التعامل' : 'Deal Start Date'} value={selectedSub.deal_start_date} />
                        </div>
                    </div>
                </div>

                {/* 3. Contact Persons Array */}
                {selectedSub.contact_persons && selectedSub.contact_persons.length > 0 && (
                    <div>
                        <h4 className={`text-sm font-black mb-4 flex items-center gap-2 px-2 ${textMain}`}><Users className="text-purple-500" size={18}/> {isRTL ? 'الأشخاص المسؤولون (Contact Persons)' : 'Contact Persons'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedSub.contact_persons.map((cp: any, idx: number) => (
                                <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><User size={16}/></div>
                                    <div>
                                        <div className={`font-bold text-sm ${textMain}`}>{cp.name || '-'}</div>
                                        <div className={`text-[10px] mt-1 ${textSub}`}>{cp.email || '-'}</div>
                                        <div className={`text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider`}>{cp.nationality || '-'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 4. Broker Details */}
                    {selectedSub.broker_details && Object.keys(selectedSub.broker_details).length > 0 ? (
                        <div className={`p-6 rounded-3xl border border-rose-100 dark:border-rose-900/30 ${isDark ? 'bg-rose-950/20' : 'bg-rose-50/50'}`}>
                            <h4 className="text-sm font-black mb-4 flex items-center justify-between text-rose-600">
                                <span className="flex items-center gap-2"><Briefcase size={18}/> {isRTL ? 'بيانات الوسيط' : 'Broker Details'}</span>
                                {selectedSub.broker_details.percentage && <span className="px-2 py-1 bg-rose-100 rounded text-xs">{selectedSub.broker_details.percentage}</span>}
                            </h4>
                            <div className="space-y-3">
                                <DetailRow label={isRTL ? 'الاسم' : 'Name'} value={selectedSub.broker_details.name} />
                                <DetailRow label={isRTL ? 'الهوية' : 'ID'} value={selectedSub.broker_details.id_number} />
                                <DetailRow label={isRTL ? 'الجوال' : 'Phone'} value={selectedSub.broker_details.phone} dir="ltr" />
                                <DetailRow label={isRTL ? 'الآيبان' : 'IBAN'} value={selectedSub.broker_details.bank_account} isMono />
                            </div>
                        </div>
                    ) : (
                        <div className={`p-6 rounded-3xl border flex items-center justify-center text-center ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={textSub}><Briefcase size={24} className="mx-auto mb-2 opacity-50"/> {isRTL ? 'لا يوجد وسيط مسجل' : 'No broker registered'}</div>
                        </div>
                    )}

                    {/* 5. Petty Cash Details */}
                    {selectedSub.petty_cash_details && Object.keys(selectedSub.petty_cash_details).length > 0 ? (
                        <div className={`p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 ${isDark ? 'bg-amber-950/20' : 'bg-amber-50/50'}`}>
                            <h4 className="text-sm font-black mb-4 flex items-center gap-2 text-amber-600"><Wallet size={18}/> {isRTL ? 'العهد المستلمة' : 'Petty Cash'}</h4>
                            <div className="space-y-3">
                                <DetailRow label={isRTL ? 'مبلغ العهدة' : 'Amount'} value={`${selectedSub.petty_cash_details.amount} SAR`} highlight="amber" />
                                <DetailRow label={isRTL ? 'تاريخ الاستلام' : 'Date'} value={selectedSub.petty_cash_details.date} />
                                <DetailRow label={isRTL ? 'التفاصيل' : 'Details'} value={selectedSub.petty_cash_details.details} />
                            </div>
                        </div>
                    ) : (
                        <div className={`p-6 rounded-3xl border flex items-center justify-center text-center ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={textSub}><Wallet size={24} className="mx-auto mb-2 opacity-50"/> {isRTL ? 'لا توجد عهد مالية' : 'No petty cash'}</div>
                        </div>
                    )}
                </div>

                {/* 6. Official Documents (Buttons) */}
                {selectedSub.document_urls && Object.keys(selectedSub.document_urls).length > 0 && (
                    <div>
                        <h4 className={`text-sm font-black mb-4 flex items-center gap-2 px-2 ${textMain}`}><Download className="text-indigo-500" size={18}/> {isRTL ? 'المرفقات والمستندات' : 'Documents'}</h4>
                        <div className="flex flex-wrap gap-3">
                            <DocumentButton url={selectedSub.document_urls.cr_url} label={isRTL ? 'السجل التجاري' : 'CR Copy'} isDark={isDark} />
                            <DocumentButton url={selectedSub.document_urls.tax_url} label={isRTL ? 'الشهادة الضريبية' : 'Tax Cert'} isDark={isDark} />
                            <DocumentButton url={selectedSub.document_urls.address_url} label={isRTL ? 'العنوان الوطني' : 'Address'} isDark={isDark} />
                            <DocumentButton url={selectedSub.document_urls.contract_url} label={isRTL ? 'نسخة العقد' : 'Contract'} isDark={isDark} />
                            <DocumentButton url={selectedSub.document_urls.broker_id_url} label={isRTL ? 'هوية الوسيط' : 'Broker ID'} isDark={isDark} />
                        </div>
                    </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Small Helper Components inside the file ---
function DetailRow({ label, value, isMono, isUppercase, dir, highlight }: any) {
    if (!value) return null;
let valClass = `font-black text-sm text-slate-900 dark:text-black ${isMono ? 'font-mono tracking-wider' : ''} ${isUppercase ? 'uppercase' : ''}`;    
    if (highlight === 'emerald') {
        valClass = 'font-black text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg';
    } else if (highlight === 'blue') {
        valClass = 'font-black text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg';
    } else if (highlight === 'amber') {
        valClass = 'font-black text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg';
    }

    return (
        <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
            <span className={valClass} dir={dir || 'auto'}>{value}</span>
        </div>
    );
}

function DocumentButton({ url, label, isDark }: { url?: string, label: string, isDark: boolean }) {
    if (!url) return null;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:border-blue-500' : 'bg-white border-slate-200 text-blue-700 hover:border-blue-400 hover:shadow-md'}`}>
            <ExternalLink size={14}/> {label}
        </a>
    );
}