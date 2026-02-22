'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, Search, Filter, Plus, ChevronDown, ChevronRight, 
  FileText, Lock, Unlock, Download, Calculator, Hash, 
  BrainCircuit, CheckCircle2, X, Save, PlusCircle, Trash2,
  AlertCircle, CalendarDays, ArrowRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout';

// --- Types ---
type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

interface AccountNode {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  type: AccountType;
  balance: number;
  currency: string;
  parent_id?: string | null;
  children?: AccountNode[];
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  status: 'Posted' | 'Draft';
  user: string;
}

interface JELine {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export default function GeneralLedgerPage() {
  const { lang, user } = useDashboard();
  const isRTL = lang === 'ar';

  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Date Filter States
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Dictionary ---
  const t = {
    ar: {
      title: 'دفتر الأستاذ العام',
      desc: 'إدارة شجرة الحسابات، القيود اليومية، وكشف الحساب اللحظي.',
      search: 'بحث في الحسابات...',
      newEntry: 'قيد يومية جديد',
      export: 'تصدير الكشف',
      periodLocked: 'الفترة مغلقة',
      periodOpen: 'الفترة مفتوحة',
      coa: 'شجرة الحسابات',
      addAccount: 'إضافة حساب',
      ledger: 'كشف الحساب',
      table: { date: 'التاريخ', desc: 'البيان', ref: 'المرجع', debit: 'مدين', credit: 'دائن', balance: 'الرصيد', status: 'الحالة' },
      types: { Asset: 'أصول', Liability: 'خصوم', Equity: 'حقوق ملكية', Revenue: 'إيرادات', Expense: 'مصروفات' },
      filters: { period: 'الفترة', all: 'كل الفترات', today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر', year: 'هذه السنة', custom: 'فترة مخصصة', from: 'من', to: 'إلى' },
      balances: { opening: 'الرصيد الافتتاحي للفترة', closing: 'الرصيد الختامي' },
      modals: {
        cancel: 'إلغاء', save: 'حفظ واعتماد', newAccTitle: 'إضافة حساب جديد',
        accCode: 'رمز الحساب', accNameAr: 'اسم الحساب (عربي)', accNameEn: 'اسم الحساب (إنجليزي)',
        accType: 'نوع الحساب', accParent: 'الحساب الرئيسي (اختياري)', rootNode: '-- حساب رئيسي (بدون أب) --',
        jeTitle: 'إنشاء قيد يومية', jeDate: 'تاريخ القيد', jeRef: 'الرقم المرجعي', jeDesc: 'البيان العام',
        addLine: 'إضافة سطر', account: 'الحساب', total: 'الإجمالي', outOfBalance: 'القيد غير متزن!', balanced: 'القيد متزن',
      }
    },
    en: {
      title: 'General Ledger',
      desc: 'Manage chart of accounts, journal entries, and real-time ledger.',
      search: 'Search accounts...',
      newEntry: 'New Journal Entry',
      export: 'Export Ledger',
      periodLocked: 'Period Locked',
      periodOpen: 'Period Open',
      coa: 'Chart of Accounts',
      addAccount: 'Add Account',
      ledger: 'Account Statement',
      table: { date: 'Date', desc: 'Description', ref: 'Reference', debit: 'Debit', credit: 'Credit', balance: 'Balance', status: 'Status' },
      types: { Asset: 'Assets', Liability: 'Liabilities', Equity: 'Equity', Revenue: 'Revenue', Expense: 'Expenses' },
      filters: { period: 'Period', all: 'All Time', today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', custom: 'Custom Range', from: 'From', to: 'To' },
      balances: { opening: 'Opening Balance for Period', closing: 'Closing Balance' },
      modals: {
        cancel: 'Cancel', save: 'Save & Post', newAccTitle: 'Add New Account',
        accCode: 'Account Code', accNameAr: 'Account Name (AR)', accNameEn: 'Account Name (EN)',
        accType: 'Account Type', accParent: 'Parent Account (Optional)', rootNode: '-- Root Account (No Parent) --',
        jeTitle: 'Create Journal Entry', jeDate: 'Posting Date', jeRef: 'Reference Number', jeDesc: 'General Description',
        addLine: 'Add Line', account: 'Account', total: 'Total', outOfBalance: 'Entry Out of Balance!', balanced: 'Entry is Balanced',
      }
    }
  }[lang];

  // --- 1. Fetch Chart of Accounts (COA) ---
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase.from('accounts').select('*').order('code', { ascending: true });
      if (error) throw error;

      if (data) {
        // Build Tree Structure Logically
        const accountMap = new Map<string, AccountNode>();
        const roots: AccountNode[] = [];

        data.forEach((acc: any) => {
          accountMap.set(acc.id, { ...acc, balance: 0, children: [] });
        });

        data.forEach((acc: any) => {
          const node = accountMap.get(acc.id)!;
          if (acc.parent_id && accountMap.has(acc.parent_id)) {
            accountMap.get(acc.parent_id)!.children!.push(node);
          } else {
            roots.push(node);
          }
        });

        setAccounts(roots);
        // Expand root nodes by default
        setExpandedNodes(roots.map(r => r.id));
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // --- 2. Fetch Ledger (Transactions) for Selected Account ---
  useEffect(() => {
    const fetchLedger = async () => {
      if (!selectedAccount) return;
      setLoadingLedger(true);
      try {
        // جلب سطور القيود الخاصة بهذا الحساب مع معلومات القيد الأساسي
        const { data, error } = await supabase
          .from('journal_lines')
          .select(`
            id, debit, credit, description,
            journal_entries!inner (date, reference, status, user_id, profiles (full_name))
          `)
          .eq('account_id', selectedAccount.id)
          .order('journal_entries(date)', { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedEntries: LedgerEntry[] = data.map((line: any) => ({
            id: line.id,
            date: line.journal_entries.date,
            description: line.description || (isRTL ? 'قيد يومية' : 'Journal Entry'),
            reference: line.journal_entries.reference,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            status: line.journal_entries.status,
            user: line.journal_entries.profiles?.full_name || 'System'
          }));
          
          // ترتيب زمني
          formattedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setEntries(formattedEntries);
        } else {
            setEntries([]);
        }
      } catch (error) {
        console.error("Error fetching ledger:", error);
      } finally {
        setLoadingLedger(false);
      }
    };

    fetchLedger();
  }, [selectedAccount]);

  // --- Date Filtering & Accounting Balance Logic ---
  const getDateRange = () => {
    const today = new Date();
    let start = new Date(0); // Epoch
    let end = new Date("2100-01-01");

    if (dateFilter === 'today') {
      start = new Date(today.setHours(0,0,0,0));
      end = new Date(today.setHours(23,59,59,999));
    } else if (dateFilter === 'week') {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      start = new Date(firstDay.setHours(0,0,0,0));
      end = new Date();
    } else if (dateFilter === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (dateFilter === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (dateFilter === 'custom') {
      start = customStartDate ? new Date(customStartDate) : new Date(0);
      end = customEndDate ? new Date(customEndDate) : new Date("2100-01-01");
    }
    return { start, end };
  };

  const { start: filterStart, end: filterEnd } = getDateRange();

  // 1. حساب الرصيد الافتتاحي (بناءً على القاعدة المحاسبية)
  const openingBalanceEntries = entries.filter(e => new Date(e.date) < filterStart);
  let openingBalance = openingBalanceEntries.reduce((sum, e) => {
    const isAssetOrExpense = selectedAccount?.type === 'Asset' || selectedAccount?.type === 'Expense';
    // الأصول والمصروفات: مدين - دائن. الخصوم والإيرادات: دائن - مدين
    return isAssetOrExpense 
        ? sum + (e.debit - e.credit) 
        : sum + (e.credit - e.debit);
  }, 0);

  // 2. تصفية قيود الفترة الحالية
  const periodEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= filterStart && d <= filterEnd;
  });

  // 3. حساب الرصيد التراكمي اللحظي
  let runningBalance = openingBalance;
  const ledgerRows = periodEntries.map(entry => {
    const isAssetOrExpense = selectedAccount?.type === 'Asset' || selectedAccount?.type === 'Expense';
    const netAmount = isAssetOrExpense ? (entry.debit - entry.credit) : (entry.credit - entry.debit);
    
    runningBalance += netAmount;
    
    return { ...entry, currentBalance: runningBalance };
  });

  const closingBalance = runningBalance;


  // --- Flatten Accounts for Dropdowns ---
  const flattenAccounts = (nodes: AccountNode[], prefix = ''): { id: string, label: string }[] => {
    let result: { id: string, label: string }[] = [];
    nodes.forEach(node => {
      result.push({ id: node.id, label: `${prefix}${node.code} - ${isRTL ? node.name_ar : node.name_en}` });
      if (node.children) {
        result = result.concat(flattenAccounts(node.children, prefix + '\u00A0\u00A0\u00A0\u00A0'));
      }
    });
    return result;
  };
  const flatAccountsList = flattenAccounts(accounts);

  // --- Tree Logic ---
  const toggleNode = (id: string) => {
    setExpandedNodes(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const renderTree = (nodes: AccountNode[], depth = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.includes(node.id);
      const isSelected = selectedAccount?.id === node.id;

      return (
        <div key={node.id}>
          <div 
            onClick={() => { if (hasChildren) toggleNode(node.id); else setSelectedAccount(node); }}
            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
            style={{ paddingInlineStart: `${depth * 1.2 + 0.5}rem` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center text-slate-400">
                {hasChildren ? (isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16} className={isRTL ? 'rotate-180' : ''}/>) : <Hash size={14} className="opacity-40"/>}
              </div>
              <div className={`text-sm ${hasChildren ? 'font-bold text-slate-800' : 'font-medium text-slate-600'} ${isSelected ? 'text-blue-700' : ''}`}>
                {node.code} <span className="opacity-50 mx-1">|</span> {isRTL ? node.name_ar : node.name_en}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {renderTree(node.children!, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  // --- Form States & Handlers ---
  
  // Add Account
  const [newAcc, setNewAcc] = useState({ code: '', name_ar: '', name_en: '', type: 'Asset' as AccountType, parentId: '' });

  const handleAddAccount = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('accounts').insert({
          code: newAcc.code,
          name_ar: newAcc.name_ar,
          name_en: newAcc.name_en,
          type: newAcc.type,
          parent_id: newAcc.parentId || null,
          currency: 'SAR'
      });
      if (error) throw error;
      
      alert(isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
      setIsAddAccountOpen(false);
      setNewAcc({ code: '', name_ar: '', name_en: '', type: 'Asset', parentId: '' });
      fetchAccounts(); // Refresh tree
    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  // Add Journal Entry (Double-Entry Logic)
  const [jeForm, setJeForm] = useState({ date: new Date().toISOString().split('T')[0], ref: '', desc: '' });
  const [jeLines, setJeLines] = useState<JELine[]>([
    { id: '1', accountId: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', description: '', debit: 0, credit: 0 }
  ]);

  const totalDebit = jeLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = jeLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  // يجب أن يكون المدين يساوي الدائن، وأن يكون أكبر من 0
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddJELine = () => setJeLines([...jeLines, { id: Math.random().toString(), accountId: '', description: '', debit: 0, credit: 0 }]);

  const updateJELine = (id: string, field: keyof JELine, value: string | number) => {
    setJeLines(jeLines.map(line => {
      if (line.id === id) {
        const newLine = { ...line, [field]: value };
        if (field === 'debit' && Number(value) > 0) newLine.credit = 0;
        if (field === 'credit' && Number(value) > 0) newLine.debit = 0;
        return newLine;
      }
      return line;
    }));
  };

  const removeJELine = (id: string) => {
    if (jeLines.length > 2) setJeLines(jeLines.filter(l => l.id !== id));
  };

  const handleSaveJE = async () => {
    if (!isBalanced || !user) return;
    
    // تأكد من أن كل السطور تحتوي على حساب
    if(jeLines.some(l => !l.accountId)) {
        alert(isRTL ? 'يرجى تحديد حساب لجميع السطور' : 'Please select an account for all lines');
        return;
    }

    setIsSaving(true);
    try {
        // 1. إدخال رأس القيد
        const { data: headerData, error: headerError } = await supabase.from('journal_entries').insert({
            date: jeForm.date,
            description: jeForm.desc,
            reference: jeForm.ref,
            status: 'Posted',
            user_id: user.id
        }).select('id').single();

        if (headerError) throw headerError;

        // 2. إدخال سطور القيد المرتبطة
        const linesToInsert = jeLines.filter(l => l.debit > 0 || l.credit > 0).map(l => ({
            entry_id: headerData.id,
            account_id: l.accountId,
            description: l.description || jeForm.desc,
            debit: l.debit,
            credit: l.credit
        }));

        const { error: linesError } = await supabase.from('journal_lines').insert(linesToInsert);
        if (linesError) throw linesError;

        alert(isRTL ? 'تم ترحيل القيد المزدوج بنجاح.' : 'Double-Entry Journal posted successfully.');
        setIsNewEntryOpen(false);
        setJeForm({ date: new Date().toISOString().split('T')[0], ref: '', desc: '' });
        setJeLines([{ id: '1', accountId: '', description: '', debit: 0, credit: 0 }, { id: '2', accountId: '', description: '', debit: 0, credit: 0 }]);
        
        // Refresh if looking at related account
        if (selectedAccount && jeLines.some(l => l.accountId === selectedAccount.id)) {
            setSelectedAccount({...selectedAccount}); // Force trigger ledger re-fetch
        }

    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t.desc}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${isLocked ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
          >
            {isLocked ? <Lock size={14}/> : <Unlock size={14}/>} {isLocked ? t.periodLocked : t.periodOpen}
          </button>
          <button 
            onClick={() => setIsNewEntryOpen(true)}
            disabled={isLocked}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16}/> {t.newEntry}
          </button>
        </div>
      </div>

      {/* Main Layout: Split View */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        
        {/* Left Sidebar: Chart of Accounts */}
        <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Hash size={18} className="text-blue-600"/> {t.coa}</h3>
            <button onClick={() => setIsAddAccountOpen(true)} className="p-1.5 bg-white border border-slate-200 rounded-md text-blue-600 hover:bg-blue-50 transition" title={t.addAccount}>
                <Plus size={16}/>
            </button>
          </div>
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input type="text" placeholder={t.search} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm outline-none focus:border-blue-500 transition ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'}`} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {loadingAccounts ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500"/></div>
            ) : (
                renderTree(accounts)
            )}
          </div>
        </div>

        {/* Right Area: Selected Account Ledger */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedAccount ? (
            <>
              {/* Account Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded font-mono border border-blue-200">{selectedAccount.code}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">{(t.types as any)[selectedAccount.type]}</span>
                  </div>
                  <h3 className="font-black text-2xl text-slate-900 mt-2">{isRTL ? selectedAccount.name_ar : selectedAccount.name_en}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.balances.closing}</div>
                  <div className={`text-3xl font-mono font-black ${closingBalance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-bold text-slate-500 ml-1">{selectedAccount.currency}</span>
                  </div>
                </div>
              </div>

              {/* Toolbar & Date Filters */}
              <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400" />
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none hover:border-blue-400 focus:border-blue-500 transition cursor-pointer"
                    >
                        <option value="all">{t.filters.all}</option>
                        <option value="today">{t.filters.today}</option>
                        <option value="week">{t.filters.week}</option>
                        <option value="month">{t.filters.month}</option>
                        <option value="year">{t.filters.year}</option>
                        <option value="custom">{t.filters.custom}</option>
                    </select>

                    <AnimatePresence>
                        {dateFilter === 'custom' && (
                            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xs text-slate-400 ml-2">{t.filters.from}</span>
                                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500" />
                                <span className="text-xs text-slate-400">{t.filters.to}</span>
                                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Download size={14}/> {t.export}
                </button>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/20 relative">
                {loadingLedger ? (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="animate-spin text-blue-500"/></div>
                ) : null}
                <table className="w-full text-start">
                  <thead className="bg-white text-slate-500 text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-100">
                    <tr>
                      <th className={`p-4 whitespace-nowrap bg-slate-50/90 backdrop-blur-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.date}</th>
                      <th className={`p-4 bg-slate-50/90 backdrop-blur-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.desc}</th>
                      <th className={`p-4 whitespace-nowrap bg-slate-50/90 backdrop-blur-sm ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.ref}</th>
                      <th className={`p-4 whitespace-nowrap bg-slate-50/90 backdrop-blur-sm ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.debit}</th>
                      <th className={`p-4 whitespace-nowrap bg-slate-50/90 backdrop-blur-sm ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.credit}</th>
                      <th className={`p-4 whitespace-nowrap bg-slate-50/90 backdrop-blur-sm border-slate-200 ${isRTL ? 'border-r text-left' : 'border-l text-right'}`}>{t.table.balance}</th>
                      <th className="p-4 text-center bg-slate-50/90 backdrop-blur-sm">{t.table.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    
                    {/* Opening Balance Row */}
                    {dateFilter !== 'all' && (
                        <tr className="bg-blue-50/50 border-b-2 border-blue-100">
                            <td className="p-4 whitespace-nowrap text-xs text-blue-600 font-bold">-</td>
                            <td className="p-4 font-bold text-blue-800">{t.balances.opening}</td>
                            <td className="p-4 whitespace-nowrap text-xs text-blue-600">-</td>
                            <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>-</td>
                            <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>-</td>
                            <td className={`p-4 whitespace-nowrap font-mono font-black border-blue-200 ${openingBalance < 0 ? 'text-red-600 bg-red-50/50' : 'text-blue-800 bg-blue-100/50'} ${isRTL ? 'text-left border-r' : 'text-right border-l'}`}>
                                {openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-center">-</td>
                        </tr>
                    )}

                    {ledgerRows.length > 0 ? ledgerRows.map(entry => (
                      <tr key={entry.id} className="hover:bg-blue-50/40 transition group cursor-pointer bg-white">
                        <td className="p-4 whitespace-nowrap text-xs text-slate-500 font-medium">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 group-hover:text-blue-700 transition">{entry.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">By: {entry.user}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs font-mono text-slate-500 bg-slate-50/50">{entry.reference}</td>
                        <td className={`p-4 whitespace-nowrap font-mono font-bold text-emerald-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {entry.debit > 0 ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className={`p-4 whitespace-nowrap font-mono font-bold text-red-600 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {entry.credit > 0 ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className={`p-4 whitespace-nowrap font-mono font-bold bg-slate-50/50 border-slate-100 ${entry.currentBalance < 0 ? 'text-red-600' : 'text-slate-800'} ${isRTL ? 'text-left border-r' : 'text-right border-l'}`}>
                          {entry.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          {entry.status === 'Posted' ? (
                            <span className="inline-flex items-center justify-center p-1.5 bg-green-100 text-green-700 rounded-lg" title="Posted"><CheckCircle2 size={16}/></span>
                          ) : (
                            <span className="inline-flex items-center justify-center p-1.5 bg-amber-100 text-amber-700 rounded-lg" title="Draft"><FileText size={16}/></span>
                          )}
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">لا توجد حركات في الفترة المحددة.</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3 p-10 text-center">
              <Calculator size={48} className="opacity-20"/>
              <p>Select an account from the chart to view its ledger.</p>
            </div>
          )}
        </div>

      </div>

      {/* --- Add Account Modal --- */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">{t.modals.newAccTitle}</h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.accParent}</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" value={newAcc.parentId} onChange={(e) => setNewAcc({...newAcc, parentId: e.target.value})}>
                  <option value="">{t.modals.rootNode}</option>
                  {flatAccountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.accCode}</label>
                  <input type="text" value={newAcc.code} onChange={(e) => setNewAcc({...newAcc, code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm font-mono font-bold" placeholder="e.g. 1130" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.accType}</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" value={newAcc.type} onChange={(e) => setNewAcc({...newAcc, type: e.target.value as AccountType})}>
                    {Object.entries(t.types).map(([key, val]) => <option key={key} value={key}>{val as string}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.accNameAr}</label>
                <input type="text" value={newAcc.name_ar} onChange={(e) => setNewAcc({...newAcc, name_ar: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.accNameEn}</label>
                <input type="text" value={newAcc.name_en} onChange={(e) => setNewAcc({...newAcc, name_en: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" dir="ltr" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button onClick={() => setIsAddAccountOpen(false)} className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">{t.modals.cancel}</button>
              <button onClick={handleAddAccount} disabled={!newAcc.code || !newAcc.name_ar || isSaving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {t.modals.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- New Journal Entry Modal (Enterprise Grade) --- */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2"><Calculator size={20} className="text-blue-400"/> {t.modals.jeTitle}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">DRAFT-ENTRY</p>
              </div>
              <button onClick={() => setIsNewEntryOpen(false)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition"><X size={20}/></button>
            </div>

            {/* Form Info */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.jeDate}</label>
                <input type="date" value={jeForm.date} onChange={e => setJeForm({...jeForm, date: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-700 shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.jeRef}</label>
                <input type="text" value={jeForm.ref} onChange={e => setJeForm({...jeForm, ref: e.target.value})} placeholder="e.g. INV-2024" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-mono font-bold text-slate-700 shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.modals.jeDesc}</label>
                <input type="text" value={jeForm.desc} onChange={e => setJeForm({...jeForm, desc: e.target.value})} placeholder="..." className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-700 shadow-sm" />
              </div>
            </div>

            {/* Lines Grid */}
            <div className="flex-1 overflow-y-auto bg-white p-6 custom-scrollbar">
              <table className="w-full">
                <thead className="text-xs uppercase font-bold text-slate-400 border-b-2 border-slate-100">
                  <tr>
                    <th className={`pb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t.modals.account}</th>
                    <th className={`pb-3 w-1/4 ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.desc}</th>
                    <th className={`pb-3 w-32 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.debit}</th>
                    <th className={`pb-3 w-32 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.credit}</th>
                    <th className="pb-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jeLines.map((line, index) => (
                    <tr key={line.id} className="group">
                      <td className={`py-2 ${isRTL ? 'pl-2' : 'pr-2'}`}>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 hover:border-slate-300 transition cursor-pointer"
                          value={line.accountId} onChange={e => updateJELine(line.id, 'accountId', e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          {flatAccountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input 
                          type="text" placeholder="..." value={line.description} onChange={e => updateJELine(line.id, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 hover:border-slate-300 transition"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input 
                          type="number" min="0" step="0.01" value={line.debit || ''} onChange={e => updateJELine(line.id, 'debit', e.target.value)}
                          className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-600 outline-none focus:border-emerald-500 hover:border-slate-300 transition placeholder:text-slate-300 ${isRTL ? 'text-left' : 'text-right'}`} placeholder="0.00"
                        />
                      </td>
                      <td className={`py-2 ${isRTL ? 'pr-2' : 'pl-2'}`}>
                        <input 
                          type="number" min="0" step="0.01" value={line.credit || ''} onChange={e => updateJELine(line.id, 'credit', e.target.value)}
                          className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-red-600 outline-none focus:border-red-500 hover:border-slate-300 transition placeholder:text-slate-300 ${isRTL ? 'text-left' : 'text-right'}`} placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <button onClick={() => removeJELine(line.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition opacity-0 group-hover:opacity-100">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <button onClick={handleAddJELine} className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                <PlusCircle size={14}/> {t.modals.addLine}
              </button>
            </div>

            {/* Footer & Balances */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-between shrink-0">
              
              {/* Balances Display */}
              <div className="flex gap-8 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className={isRTL ? 'text-left' : 'text-right'}>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t.modals.total} {t.table.debit}</div>
                  <div className="text-lg font-mono font-black text-emerald-600">{totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t.modals.total} {t.table.credit}</div>
                  <div className="text-lg font-mono font-black text-red-600">{totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex items-center justify-center min-w-[120px]">
                  {isBalanced ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-200"><CheckCircle2 size={14}/> {t.modals.balanced}</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold border border-red-200 animate-pulse"><AlertCircle size={14}/> {t.modals.outOfBalance}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => setIsNewEntryOpen(false)} className="px-6 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition">
                  {t.modals.cancel}
                </button>
                <button 
                  onClick={handleSaveJE} 
                  disabled={!isBalanced || isSaving}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition active:scale-95"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {t.modals.save}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}