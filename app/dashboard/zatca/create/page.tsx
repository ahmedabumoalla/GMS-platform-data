'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../../layout';
import { 
  ArrowLeft, ArrowRight, Plus, Trash2, Save, Users, 
  Receipt, Building2, MapPin, Tag, Info, Package, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface DbItem { id: string; name_ar: string; name_en: string; base_price: number; unit: string; sku: string; stock_quantity: number; item_type: string; }
interface DbCustomer { id: string; name_ar: string; name_en: string; tax_number: string | null; phone: string | null; }
interface OrgInfo { name_ar: string; name_en: string; tax_number: string; city: string; street_name: string; }
interface InvoiceLine { item_id: string; quantity: number; unit_price: number; discount: number; unit: string; name_ar: string; name_en: string; }

export default function CreateProfessionalInvoicePage() {
  const router = useRouter();
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';

  // --- Dictionary ---
  const t = {
    ar: {
      title: 'منصة GMS المحاسبية',
      subtitle: 'نظام إدارة الفواتير والمخزون الذكي',
      back: 'رجوع',
      newCust: 'عميل جديد',
      newItem: 'صنف جديد',
      orgLoading: 'جاري التحميل...',
      taxNo: 'الرقم الضريبي:',
      taxInvoice: 'فاتورة ضريبية',
      date: 'التاريخ:',
      custData: 'بيانات العميل',
      selectCust: '--- اختر عميل من السجل ---',
      b2c: 'فاتورة ضريبية مبسطة (B2C)',
      b2b: 'فاتورة ضريبية قياسية (B2B)',
      payType: 'طريقة الدفع',
      cash: 'كاش',
      credit: 'آجل',
      partial: 'جزئي',
      table: { item: 'الصنف', qty: 'الكمية', stock: 'المخزون', price: 'السعر', discount: 'الخصم', total: 'المجموع' },
      selectItem: 'اختر صنف...',
      addLine: 'إضافة سطر جديد',
      summary: 'الحساب النهائي',
      subtotal: 'قبل الضريبة',
      discountTotal: 'إجمالي الخصم',
      vat: 'الضريبة (15%)',
      grandTotal: 'الإجمالي المستحق',
      paidNow: 'المبلغ المدفوع الآن',
      save: 'إصدار الفاتورة',
      saving: 'جاري الحفظ...',
      modals: {
        addCustTitle: 'إضافة عميل جديد',
        custName: 'اسم العميل',
        custPhone: 'رقم الجوال',
        saveCust: 'حفظ العميل',
        addItemTitle: 'إضافة صنف للمخزون',
        itemNameAr: 'اسم الصنف (عربي)',
        itemNameEn: 'اسم الصنف (إنجليزي)',
        price: 'سعر البيع',
        initialStock: 'الكمية الأولية',
        saveItem: 'إضافة للمخزون'
      }
    },
    en: {
      title: 'GMS Accounting Platform',
      subtitle: 'Smart Invoice & Inventory System',
      back: 'Back',
      newCust: 'New Customer',
      newItem: 'New Item',
      orgLoading: 'Loading...',
      taxNo: 'Tax Number:',
      taxInvoice: 'Tax Invoice',
      date: 'Date:',
      custData: 'Customer Details',
      selectCust: '--- Select Customer from Registry ---',
      b2c: 'Simplified Tax Invoice (B2C)',
      b2b: 'Standard Tax Invoice (B2B)',
      payType: 'Payment Method',
      cash: 'Cash',
      credit: 'Credit',
      partial: 'Partial',
      table: { item: 'Item', qty: 'Quantity', stock: 'Stock', price: 'Price', discount: 'Discount', total: 'Total' },
      selectItem: 'Select item...',
      addLine: 'Add New Line',
      summary: 'Final Summary',
      subtotal: 'Subtotal',
      discountTotal: 'Total Discount',
      vat: 'VAT (15%)',
      grandTotal: 'Grand Total',
      paidNow: 'Amount Paid Now',
      save: 'Issue Invoice',
      saving: 'Saving...',
      modals: {
        addCustTitle: 'Add New Customer',
        custName: 'Customer Name',
        custPhone: 'Phone Number',
        saveCust: 'Save Customer',
        addItemTitle: 'Add Inventory Item',
        itemNameAr: 'Item Name (AR)',
        itemNameEn: 'Item Name (EN)',
        price: 'Selling Price',
        initialStock: 'Initial Stock',
        saveItem: 'Add to Stock'
      }
    }
  }[lang];

  const [loading, setLoading] = useState(false);
  
  // Data States
  const [dbItems, setDbItems] = useState<DbItem[]>([]);
  const [dbCustomers, setDbCustomers] = useState<DbCustomer[]>([]);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);

  // Form States
  const [selectedCust, setSelectedCust] = useState('');
  const [invoiceType, setInvoiceType] = useState('B2C Simplified');
  const [paymentType, setPaymentType] = useState<'Cash' | 'Credit' | 'Partial'>('Cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([
    { item_id: '', quantity: 1, unit_price: 0, discount: 0, unit: 'Pcs', name_ar: '', name_en: '' }
  ]);

  // Modals States
  const [showCustModal, setShowCustModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // New Entity States
  const [newCust, setNewCust] = useState({ name_ar: '', name_en: '', tax: '', phone: '', cr: '' });
  const [newItem, setNewItem] = useState({ name_ar: '', name_en: '', price: 0, stock: 0, unit: 'Pcs' });

  useEffect(() => {
    const loadInitialData = async () => {
      const [itemsRes, customersRes, orgRes] = await Promise.all([
        supabase.from('zatca_items').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('my_organization').select('*').single()
      ]);
      if (itemsRes.data) setDbItems(itemsRes.data);
      if (customersRes.data) setDbCustomers(customersRes.data);
      if (orgRes.data) setOrgInfo(orgRes.data);
    };
    loadInitialData();
  }, []);

  // --- Handlers for Modals ---
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('customers').insert([{
      name_ar: newCust.name_ar,
      name_en: newCust.name_en || newCust.name_ar,
      tax_number: newCust.tax,
      phone: newCust.phone,
      cr_number: newCust.cr
    }]).select().single();
    
    if (data) {
      setDbCustomers([...dbCustomers, data]);
      setSelectedCust(data.id);
      setShowCustModal(false);
      setNewCust({ name_ar: '', name_en: '', tax: '', phone: '', cr: '' });
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const skuGen = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await supabase.from('zatca_items').insert([{
      name_ar: newItem.name_ar,
      name_en: newItem.name_en || newItem.name_ar,
      sku: skuGen,
      base_price: newItem.price,
      stock_quantity: newItem.stock,
      unit: newItem.unit,
      item_type: 'Product'
    }]).select().single();
    
    if (data) {
      setDbItems([...dbItems, data]);
      setShowItemModal(false);
      setNewItem({ name_ar: '', name_en: '', price: 0, stock: 0, unit: 'Pcs' });
    }
  };

  // --- Calculations ---
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    invoiceLines.forEach(line => {
      const lineSub = line.quantity * line.unit_price;
      subtotal += lineSub;
      totalDiscount += Number(line.discount) || 0;
    });
    const vat = (subtotal - totalDiscount) * 0.15;
    return { subtotal, totalDiscount, vat, grandTotal: (subtotal - totalDiscount) + vat };
  };

  const totals = calculateTotals();

  const handleItemChange = (index: number, itemId: string) => {
    const item = dbItems.find(i => i.id === itemId);
    const newLines = [...invoiceLines];
    if (item) {
      newLines[index] = { 
        ...newLines[index], 
        item_id: itemId, 
        unit_price: item.base_price, 
        unit: item.unit,
        name_ar: item.name_ar,
        name_en: item.name_en
      };
      setInvoiceLines(newLines);
    }
  };

  const addLine = () => {
    setInvoiceLines([...invoiceLines, { item_id: '', quantity: 1, unit_price: 0, discount: 0, unit: 'Pcs', name_ar: '', name_en: '' }]);
  };

  const handleSubmit = async () => {
    if(!selectedCust) return alert(isRTL ? 'الرجاء اختيار العميل' : 'Please select a customer');
    if(invoiceLines.some(l => !l.item_id)) return alert(isRTL ? 'الرجاء اختيار الأصناف' : 'Please select items');
    
    setLoading(true);
    try {
      const invNumberStr = `INV-${Date.now().toString().slice(-6)}`;
      
      const { data: inv, error: invErr } = await supabase.from('zatca_invoices').insert([{
        custom_invoice_no: invNumberStr,
        customer_id: selectedCust,
        invoice_type: invoiceType,
        payment_status: paymentType,
        subtotal: totals.subtotal,
        total_discount: totals.totalDiscount,
        tax_total: totals.vat,
        grand_total: totals.grandTotal,
        paid_amount: paymentType === 'Cash' ? totals.grandTotal : paidAmount
      }]).select().single();

      if (invErr) throw invErr;

      for (const line of invoiceLines) {
        await supabase.from('zatca_invoice_items').insert({
          invoice_id: inv.id,
          item_id: line.item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_amount: line.discount,
          vat_amount: ((line.quantity * line.unit_price) - line.discount) * 0.15,
          line_total: line.quantity * line.unit_price
        });

        // Update Stock
        const currentItem = dbItems.find(i => i.id === line.item_id);
        if (currentItem && currentItem.item_type !== 'Service') {
          await supabase.from('zatca_items').update({ stock_quantity: currentItem.stock_quantity - line.quantity }).eq('id', line.item_id);
        }
      }

      alert(isRTL ? "تم حفظ الفاتورة بنجاح!" : "Invoice saved successfully!");
      router.push('/dashboard/finance/e-invoicing'); // توجيه لصفحة الفواتير
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${bgMain} min-h-screen ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className={`flex justify-between items-center p-6 rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            {isRTL ? <ArrowRight size={24}/> : <ArrowLeft size={24}/>}
          </button>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textMain}`}>{t.title}</h1>
            <p className={`text-sm italic ${textSub}`}>{t.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowCustModal(true)} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
             <Users size={18}/> {t.newCust}
           </button>
           <button onClick={() => setShowItemModal(true)} className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ${isDark ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
             <Package size={18}/> {t.newItem}
           </button>
        </div>
      </div>

      {/* Org Header */}
      <div className={`relative p-8 rounded-3xl border overflow-hidden shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`absolute ${isRTL ? 'left-10' : 'right-10'} top-1/2 -translate-y-1/2 opacity-5 pointer-events-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Building2 size={160} />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-2">
            <h1 className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>{orgInfo ? (isRTL ? orgInfo.name_ar : orgInfo.name_en) : t.orgLoading}</h1>
            <div className={`flex items-center gap-2 font-bold ${textSub}`}>
              <Tag size={16}/> {t.taxNo} {orgInfo?.tax_number}
            </div>
            <div className={`flex items-center gap-2 text-sm ${textSub}`}>
              <MapPin size={16}/> {orgInfo?.city}, {orgInfo?.street_name}
            </div>
          </div>
          <div className={`space-y-2 ${isRTL ? 'text-left' : 'text-right'}`}>
            <div className={`inline-block px-6 py-2 rounded-full font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>{t.taxInvoice}</div>
            <p className={`font-mono ${textSub}`}>{t.date} {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          
          {/* Customer Selection */}
          <div className={`p-6 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-blue-600" size={20}/>
              <h3 className={`font-bold ${textMain}`}>{t.custData}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                className={`w-full p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-blue-500/20 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'}`}
                value={selectedCust}
                onChange={(e) => setSelectedCust(e.target.value)}
              >
                <option value="">{t.selectCust}</option>
                {dbCustomers.map(c => (
                  <option key={c.id} value={c.id}>{isRTL ? c.name_ar : c.name_en} {c.tax_number ? `(${c.tax_number})` : '(B2C)'}</option>
                ))}
              </select>
              <select 
                className={`w-full p-4 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-blue-500/20 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'}`}
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
              >
                <option value="B2C Simplified">{t.b2c}</option>
                <option value="B2B Standard">{t.b2b}</option>
              </select>
            </div>
          </div>

          {/* Payment Type */}
          <div className={`p-6 rounded-3xl border ${cardBg}`}>
              <h3 className={`font-bold mb-4 ${textMain}`}>{t.payType}</h3>
              <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {(['Cash', 'Credit', 'Partial'] as const).map(type => (
                  <button 
                    key={type}
                    onClick={() => setPaymentType(type)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${paymentType === type ? (isDark ? 'bg-slate-700 text-blue-400 shadow' : 'bg-white text-blue-600 shadow') : textSub}`}
                  >
                    {type === 'Cash' ? t.cash : type === 'Credit' ? t.credit : t.partial}
                  </button>
                ))}
              </div>
          </div>

          {/* Items Table */}
          <div className={`rounded-3xl border overflow-hidden shadow-sm ${cardBg}`}>
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
                <thead className={`border-b text-sm ${isDark ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  <tr>
                    <th className="p-4">{t.table.item}</th>
                    <th className="p-4 text-center">{t.table.qty}</th>
                    <th className="p-4 text-center">{t.table.stock}</th>
                    <th className="p-4 text-center">{t.table.price}</th>
                    <th className="p-4 text-center">{t.table.discount}</th>
                    <th className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.total}</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {invoiceLines.map((line, idx) => {
                    const currentStock = dbItems.find(i => i.id === line.item_id)?.stock_quantity || 0;
                    return(
                    <tr key={idx} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-4 min-w-[200px]">
                        <select 
                          className={`w-full p-2 font-bold outline-none rounded-lg ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'}`}
                          value={line.item_id}
                          onChange={(e) => handleItemChange(idx, e.target.value)}
                        >
                          <option value="">{t.selectItem}</option>
                          {dbItems.map(i => <option key={i.id} value={i.id}>{isRTL ? i.name_ar : i.name_en}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number" min="1"
                            className={`w-16 text-center font-bold rounded-lg p-2 outline-none focus:ring-2 ring-blue-500/20 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`}
                            value={line.quantity || ''}
                            onChange={(e) => {
                              const nl = [...invoiceLines];
                              nl[idx].quantity = Number(e.target.value);
                              setInvoiceLines(nl);
                            }}
                          />
                          <span className={`text-xs ${textSub}`}>{line.unit}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-md font-bold ${currentStock > 0 ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600')}`}>
                          {currentStock}
                        </span>
                      </td>
                      <td className={`p-4 text-center font-bold ${textMain}`}>{line.unit_price}</td>
                      <td className="p-4 text-center">
                        <input 
                          type="number" min="0"
                          className={`w-20 p-2 rounded-lg text-center font-bold outline-none focus:ring-2 ring-red-500/20 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}
                          value={line.discount || ''}
                          onChange={(e) => {
                            const nl = [...invoiceLines];
                            nl[idx].discount = Number(e.target.value);
                            setInvoiceLines(nl);
                          }}
                        />
                      </td>
                      <td className={`p-4 font-black ${textMain} ${isRTL ? 'text-left' : 'text-right'}`}>
                        {((line.quantity * line.unit_price) - (line.discount || 0)).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setInvoiceLines(invoiceLines.filter((_, i) => i !== idx))}
                          className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <button 
              onClick={addLine}
              className={`w-full p-4 font-bold border-t transition flex items-center justify-center gap-2 ${isDark ? 'border-slate-800 text-blue-400 hover:bg-slate-800/50' : 'border-slate-100 text-blue-600 hover:bg-blue-50'}`}
            >
              <Plus size={18}/> {t.addLine}
            </button>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
             <div className="relative z-10 space-y-4">
               <h3 className="text-xl font-black border-b border-slate-800 pb-4">{t.summary}</h3>
               
               <div className="flex justify-between text-slate-400 font-medium text-sm"><span>{t.subtotal}</span><span>{totals.subtotal.toFixed(2)}</span></div>
               <div className="flex justify-between text-red-400 font-medium text-sm"><span>{t.discountTotal}</span><span>-{totals.totalDiscount.toFixed(2)}</span></div>
               <div className="flex justify-between text-blue-400 font-medium text-sm"><span>{t.vat}</span><span>{totals.vat.toFixed(2)}</span></div>
               
               <div className="pt-4 mt-2 border-t border-slate-800">
                 <div className="text-xs text-slate-500 uppercase font-bold mb-1">{t.grandTotal}</div>
                 <div className="text-4xl font-black text-white">{totals.grandTotal.toFixed(2)} <span className="text-sm text-slate-400 font-normal">SAR</span></div>
               </div>
               
               {paymentType === 'Partial' && (
                 <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                   <label className="text-xs text-blue-400 font-bold">{t.paidNow}</label>
                   <input 
                    type="number" 
                    className="w-full bg-slate-800 p-3 rounded-xl outline-none font-bold text-white ring-1 ring-slate-700 focus:ring-blue-500 transition" 
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                   />
                 </div>
               )}

               <button 
                 disabled={loading || !selectedCust || invoiceLines.length === 0}
                 onClick={handleSubmit}
                 className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 p-4 rounded-2xl font-black mt-6 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95"
               >
                 {loading ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} 
                 {loading ? t.saving : t.save}
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Add Customer Modal */}
      <AnimatePresence>
      {showCustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
            <button onClick={() => setShowCustModal(false)} className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} transition ${textSub} hover:text-red-500`}><X/></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users/></div>
              <h3 className={`text-xl font-black ${textMain}`}>{t.modals.addCustTitle}</h3>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input required placeholder={t.modals.custName} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewCust({...newCust, name_ar: e.target.value, name_en: e.target.value})}/>
              <input placeholder={isRTL ? "الرقم الضريبي (إن وجد)" : "Tax Number (Optional)"} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewCust({...newCust, tax: e.target.value})}/>
              <input required placeholder={t.modals.custPhone} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewCust({...newCust, phone: e.target.value})}/>
              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-blue-500 transition active:scale-95">
                {t.modals.saveCust}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* 2. Add Item Modal */}
      <AnimatePresence>
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
            <button onClick={() => setShowItemModal(false)} className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} transition ${textSub} hover:text-red-500`}><X/></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Package/></div>
              <h3 className={`text-xl font-black ${textMain}`}>{t.modals.addItemTitle}</h3>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input required placeholder={t.modals.itemNameAr} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewItem({...newItem, name_ar: e.target.value})}/>
              <input placeholder={t.modals.itemNameEn} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewItem({...newItem, name_en: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.01" placeholder={t.modals.price} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewItem({...newItem, price: Number(e.target.value)})}/>
                <input required type="number" placeholder={t.modals.initialStock} className={`w-full p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/20 font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} onChange={(e)=>setNewItem({...newItem, stock: Number(e.target.value)})}/>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition active:scale-95 mt-2">
                {t.modals.saveItem}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
}