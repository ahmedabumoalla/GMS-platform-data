'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // تأكد من مسار ملف السوبابيس لديك
import { 
  ReceiptText, Search, Plus, Filter, CheckCircle2, 
  AlertTriangle, ShieldCheck, QrCode, FileJson, Lock,
  ArrowRightLeft, FileCheck, Clock, Download, Loader2
} from 'lucide-react';
import { useDashboard } from '../../layout';

interface Invoice {
  id: string;
  invoice_number: string;
  crypto_hash: string;
  customer_name: string;
  invoice_type: 'B2B Standard' | 'B2C Simplified';
  created_at: string;
  total_amount: number;
  vat_amount: number;
  zatca_status: 'Cleared' | 'Reported' | 'Failed' | 'Pending';
}

export default function ZatcaEInvoicingPage() {
  const { lang } = useDashboard();
  const isRTL = lang === 'ar';
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Dictionary ---
  const t = {
    ar: {
      title: 'الفوترة الإلكترونية (ZATCA)',
      desc: 'بوابة الامتثال لضريبة القيمة المضافة - المرحلة الثانية (الربط والتكامل).',
      compliance: 'الربط مع هيئة الزكاة نشط 🟢',
      newInvoice: 'إنشاء فاتورة',
      search: 'بحث برقم الفاتورة، العميل...',
      loading: 'جاري جلب الفواتير...',
      table: { id: 'رقم الفاتورة', customer: 'العميل', type: 'النوع', amount: 'الإجمالي (مع الضريبة)', vat: 'الضريبة (15%)', status: 'حالة ZATCA' },
      status: { Cleared: 'معتمدة (Cleared)', Reported: 'مُبلغ عنها (Reported)', Failed: 'مرفوضة', Pending: 'قيد الإرسال' },
      details: {
        title: 'النزاهة التشفيرية والامتثال',
        hash: 'التشفير (Cryptographic Stamp)',
        xml: 'صيغة UBL XML',
        qr: 'رمز الاستجابة السريعة (QR)',
        download: 'تحميل PDF'
      }
    },
    en: {
      title: 'E-Invoicing (ZATCA)',
      desc: 'VAT Compliance Portal - Phase 2 (Integration).',
      compliance: 'ZATCA Integration Active 🟢',
      newInvoice: 'Create Invoice',
      search: 'Search Invoice ID, Customer...',
      loading: 'Fetching invoices...',
      table: { id: 'Invoice ID', customer: 'Customer', type: 'Type', amount: 'Total (Incl. VAT)', vat: 'VAT (15%)', status: 'ZATCA Status' },
      status: { Cleared: 'Cleared', Reported: 'Reported', Failed: 'Failed', Pending: 'Pending' },
      details: {
        title: 'Cryptographic Integrity & Compliance',
        hash: 'Cryptographic Stamp (Hash)',
        xml: 'UBL XML Format',
        qr: 'QR Code',
        download: 'Download PDF'
      }
    }
  }[lang];

  // جلب البيانات من القاعدة
  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      const { data, error } = await supabase
        .from('zatca_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
      } else {
        setInvoices(data || []);
      }
      setLoading(false);
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Invoice['zatca_status']) => {
    switch(status) {
      case 'Cleared': return <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-lg text-xs font-bold border border-green-200"><ShieldCheck size={14}/> {t.status.Cleared}</span>;
      case 'Reported': return <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200"><CheckCircle2 size={14}/> {t.status.Reported}</span>;
      case 'Failed': return <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-200"><AlertTriangle size={14}/> {t.status.Failed}</span>;
      case 'Pending': return <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200"><Clock size={14}/> {t.status.Pending}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ReceiptText className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t.desc}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-inner">
            <ArrowRightLeft size={14}/> {t.compliance}
          </div>
         <button 
  onClick={() => router.push('/dashboard/zatca/create')} // غيّر المسار حسب هيكلة ملفاتك
  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2 transition"
>
  <Plus size={16}/> {t.newInvoice}
</button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Table */}
        <div className="w-full xl:w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="relative w-full max-w-sm">
              <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input 
                type="text" 
                placeholder={t.search} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-white border border-slate-200 rounded-xl py-2 text-sm outline-none focus:border-blue-500 transition ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} 
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                <Loader2 className="animate-spin text-blue-500" /> {t.loading}
              </div>
            ) : (
              <table className="w-full text-start whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">{t.table.id}</th>
                    <th className="p-4">{t.table.customer}</th>
                    <th className="p-4 text-end">{t.table.amount}</th>
                    <th className="p-4">{t.table.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className={`hover:bg-blue-50/50 transition cursor-pointer ${selectedInvoice?.id === inv.id ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{inv.invoice_number}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(inv.created_at).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{inv.customer_name}</div>
                        <div className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-fit mt-1 border border-slate-200">{inv.invoice_type}</div>
                      </td>
                      <td className="p-4 text-end">
                        <div className="font-black text-slate-800">{Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">SAR</span></div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{t.table.vat}: <span className="font-mono">{Number(inv.vat_amount).toLocaleString()}</span></div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(inv.zatca_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invoice Cryptographic Details Panel */}
        <div className="w-full xl:w-1/3 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl text-white overflow-hidden relative flex flex-col">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 relative z-10 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileCheck className="text-blue-400" /> {t.details.title}
            </h3>
          </div>

          {selectedInvoice ? (
            <div className="p-6 space-y-6 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="text-center pb-6 border-b border-slate-800">
                <div className="text-3xl font-black mb-1">{Number(selectedInvoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">SAR</span></div>
                <div className="text-sm font-bold text-slate-300">{selectedInvoice.customer_name}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-2">{selectedInvoice.invoice_number}</div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Lock size={14}/> {t.details.hash}</span>
                    {selectedInvoice.zatca_status === 'Cleared' || selectedInvoice.zatca_status === 'Reported' ? <CheckCircle2 size={14} className="text-emerald-400"/> : <Clock size={14} className="text-slate-500"/>}
                  </div>
                  <div className="text-[10px] font-mono text-blue-300 break-all leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/50 shadow-inner">
                    {selectedInvoice.crypto_hash || 'PENDING_GENERATION'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-800 transition cursor-pointer">
                    <FileJson size={28} className="text-purple-400"/>
                    <span className="text-xs font-bold text-slate-300">{t.details.xml}</span>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-800 transition cursor-pointer">
                    <QrCode size={28} className="text-white"/>
                    <span className="text-xs font-bold text-slate-300">{t.details.qr}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10 text-center relative z-10">
              <ShieldCheck size={48} className="opacity-20 mb-4"/>
              <p>Select an invoice to view its cryptographic signature and ZATCA compliance details.</p>
            </div>
          )}

          {selectedInvoice && (
            <div className="p-5 border-t border-slate-800 bg-slate-900 relative z-10">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                <Download size={16}/> {t.details.download}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}