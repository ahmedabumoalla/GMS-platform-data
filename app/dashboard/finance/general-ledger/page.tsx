'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, Search, Plus, ChevronDown, ChevronRight, 
  FileText, Folder, FolderOpen, Download, Calculator, 
  CheckCircle2, X, Save, Loader2, CalendarDays, MoreHorizontal, Settings
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

export default function GeneralLedgerPage() {
  const { lang, user } = useDashboard();
  const isRTL = lang === 'ar';

  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Date Filter States
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preselectedParentId, setPreselectedParentId] = useState<string>('');

  // --- Dictionary ---
  const t = {
    ar: {
      title: 'دليل الحسابات وكشف الحساب',
      desc: 'إدارة شجرة الحسابات المحاسبية وعرض الحركات والقيود المرتبطة بها.',
      search: 'ابحث عن حساب (الاسم أو الرمز)...',
      export: 'تصدير الكشف',
      coa: 'دليل الحسابات',
      addAccount: 'إضافة حساب',
      addSubAccount: 'إضافة حساب فرعي',
      table: { date: 'التاريخ', desc: 'البيان', ref: 'المرجع', debit: 'مدين', credit: 'دائن', balance: 'الرصيد', status: 'الحالة' },
      types: { Asset: 'أصول', Liability: 'خصوم', Equity: 'حقوق ملكية', Revenue: 'إيرادات', Expense: 'مصروفات' },
      filters: { period: 'الفترة', all: 'كل الفترات', today: 'اليوم', week: 'هذا الأسبوع', month: 'هذا الشهر', year: 'هذه السنة', custom: 'فترة مخصصة', from: 'من', to: 'إلى' },
      balances: { opening: 'الرصيد الافتتاحي للفترة', closing: 'الرصيد الختامي' },
      modals: {
        cancel: 'إلغاء', save: 'حفظ الحساب', newAccTitle: 'بطاقة حساب جديد',
        accCode: 'رمز الحساب', accNameAr: 'اسم الحساب (عربي)', accNameEn: 'اسم الحساب (إنجليزي)',
        accType: 'الطبيعة المحاسبية', accParent: 'يتفرع من (الحساب الأب)', rootNode: '-- حساب رئيسي (مستوى أول) --',
      },
      emptyLedger: 'الرجاء اختيار حساب من الشجرة الجانبية لاستعراض حركاته.',
      emptyTransactions: 'لا توجد حركات مالية لهذا الحساب في الفترة المحددة.'
    },
    en: {
      title: 'Chart of Accounts & Ledger',
      desc: 'Manage accounting tree and view related entries and transactions.',
      search: 'Search account (Name or Code)...',
      export: 'Export Ledger',
      coa: 'Chart of Accounts',
      addAccount: 'Add Account',
      addSubAccount: 'Add Sub-Account',
      table: { date: 'Date', desc: 'Description', ref: 'Reference', debit: 'Debit', credit: 'Credit', balance: 'Balance', status: 'Status' },
      types: { Asset: 'Assets', Liability: 'Liabilities', Equity: 'Equity', Revenue: 'Revenue', Expense: 'Expenses' },
      filters: { period: 'Period', all: 'All Time', today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', custom: 'Custom Range', from: 'From', to: 'To' },
      balances: { opening: 'Opening Balance', closing: 'Closing Balance' },
      modals: {
        cancel: 'Cancel', save: 'Save Account', newAccTitle: 'New Account Card',
        accCode: 'Account Code', accNameAr: 'Account Name (AR)', accNameEn: 'Account Name (EN)',
        accType: 'Account Type', accParent: 'Parent Account', rootNode: '-- Root Account (Level 1) --',
      },
      emptyLedger: 'Please select an account from the tree to view its ledger.',
      emptyTransactions: 'No financial transactions for this account in the selected period.'
    }
  }[lang];

  // --- 1. Fetch Chart of Accounts (COA) ---
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase.from('accounts').select('*').order('code', { ascending: true });
      if (error) throw error;

      if (data) {
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
        const { data, error } = await supabase
          .from('journal_lines')
          .select(`id, debit, credit, description, journal_entries!inner (date, reference, status, profiles (full_name))`)
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
    let start = new Date(0);
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

  const openingBalanceEntries = entries.filter(e => new Date(e.date) < filterStart);
  let openingBalance = openingBalanceEntries.reduce((sum, e) => {
    const isAssetOrExpense = selectedAccount?.type === 'Asset' || selectedAccount?.type === 'Expense';
    return isAssetOrExpense ? sum + (e.debit - e.credit) : sum + (e.credit - e.debit);
  }, 0);

  const periodEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= filterStart && d <= filterEnd;
  });

  let runningBalance = openingBalance;
  const ledgerRows = periodEntries.map(entry => {
    const isAssetOrExpense = selectedAccount?.type === 'Asset' || selectedAccount?.type === 'Expense';
    const netAmount = isAssetOrExpense ? (entry.debit - entry.credit) : (entry.credit - entry.debit);
    runningBalance += netAmount;
    return { ...entry, currentBalance: runningBalance };
  });

  const closingBalance = runningBalance;


  // --- 🚀 Tree & Search Logic (Enterprise Level) 🚀 ---
  
  // فلترة الشجرة بناءً على البحث
  const filteredTree = useMemo(() => {
    if (!searchQuery) return accounts;

    const filterNodes = (nodes: AccountNode[]): AccountNode[] => {
      return nodes.reduce((acc: AccountNode[], node) => {
        const matches = node.code.includes(searchQuery) || 
                        node.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        node.name_en.toLowerCase().includes(searchQuery.toLowerCase());
        
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        
        if (matches || filteredChildren.length > 0) {
          // إذا تطابق، نفتح المجلد تلقائياً
          if (filteredChildren.length > 0 && !expandedNodes.includes(node.id)) {
              setExpandedNodes(prev => [...prev, node.id]);
          }
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    };
    return filterNodes(accounts);
  }, [accounts, searchQuery]);

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const openAddChildModal = (parentId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPreselectedParentId(parentId);
      setIsAddAccountOpen(true);
  };

  // رسم الشجرة باحترافية
  const renderTree = (nodes: AccountNode[], depth = 0) => {
    return nodes.map((node, index) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.includes(node.id);
      const isSelected = selectedAccount?.id === node.id;
      const isLast = index === nodes.length - 1;

      return (
        <div key={node.id} className="relative">
          {/* خط التوصيل الشجري (Tree Line) */}
          {depth > 0 && (
            <div className={`absolute border-slate-300 dark:border-slate-700 ${isRTL ? 'border-r-2 right-0' : 'border-l-2 left-0'} top-0 bottom-0`} 
                 style={{ 
                     [isRTL ? 'right' : 'left']: `${(depth - 1) * 1.5 + 0.75}rem`,
                     height: isLast ? '24px' : '100%' 
                 }}>
            </div>
          )}
          {depth > 0 && (
              <div className={`absolute border-slate-300 dark:border-slate-700 border-t-2 w-4 top-6`}
                   style={{ [isRTL ? 'right' : 'left']: `${(depth - 1) * 1.5 + 0.75}rem` }}>
              </div>
          )}

          <div 
            onClick={() => setSelectedAccount(node)}
            className={`group relative flex items-center justify-between p-2 my-0.5 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-100/50 text-blue-800' : 'hover:bg-slate-100 text-slate-700'}`}
            style={{ paddingInlineStart: `${depth * 1.5 + 1.5}rem` }}
          >
            <div className="flex items-center gap-2">
              {/* أيقونة الفتح/الإغلاق للمجلدات */}
              {hasChildren ? (
                  <button onClick={(e) => toggleNode(node.id, e)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors z-10 bg-white rounded-md">
                      {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16} className={isRTL ? 'rotate-180' : ''}/>}
                  </button>
              ) : (
                  <div className="w-5 h-5 flex items-center justify-center text-slate-300 z-10 bg-white rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                  </div>
              )}

              {/* أيقونة نوع الحساب */}
              {hasChildren ? (
                  isExpanded ? <FolderOpen size={16} className="text-amber-500 fill-amber-100"/> : <Folder size={16} className="text-amber-500 fill-amber-100"/>
              ) : (
                  <FileText size={16} className="text-blue-500"/>
              )}

              {/* تفاصيل الحساب */}
              <div className={`text-sm ${hasChildren ? 'font-bold' : 'font-medium'} ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                {node.code} <span className="opacity-40 mx-1">|</span> {isRTL ? node.name_ar : node.name_en}
              </div>
            </div>

            {/* أزرار الإجراءات السريعة تظهر عند تمرير الماوس */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                <button onClick={(e) => openAddChildModal(node.id, e)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title={t.addSubAccount}>
                    <Plus size={14}/>
                </button>
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

  // --- Flatten Accounts for Dropdown in Modal ---
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

  // --- Add Account Handler ---
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
      
      setIsAddAccountOpen(false);
      setNewAcc({ code: '', name_ar: '', name_en: '', type: 'Asset', parentId: '' });
      setPreselectedParentId('');
      fetchAccounts(); 
    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'dir-rtl' : 'dir-ltr'} bg-slate-50 min-h-screen -m-8 p-8`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={28} /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t.desc}</p>
        </div>
        <button 
            onClick={() => {setPreselectedParentId(''); setIsAddAccountOpen(true);}}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition active:scale-95"
        >
            <Plus size={18}/> {t.addAccount}
        </button>
      </div>

      {/* Main Layout: Split View */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">
        
        {/* 🚀 Left Sidebar: Chart of Accounts (COA) 🚀 */}
        <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Settings size={18} className="text-blue-400"/> {t.coa}</h3>
            <MoreHorizontal size={18} className="text-slate-400 cursor-pointer hover:text-white"/>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className={`absolute top-3 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search} 
                  className={`w-full bg-white border border-slate-200 rounded-xl py-2.5 text-sm font-medium outline-none focus:border-blue-500 shadow-sm transition ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'}`} 
              />
            </div>
          </div>

          {/* Tree Container */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
            {loadingAccounts ? (
                <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>
            ) : (
                <div className="pb-10">
                    {renderTree(filteredTree)}
                </div>
            )}
          </div>
        </div>

        {/* Right Area: Selected Account Ledger */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedAccount ? (
            <>
              {/* Account Header */}
              <div className="p-6 border-b border-slate-100 bg-blue-900 text-white flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-800 text-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg font-mono border border-blue-700">{selectedAccount.code}</span>
                    <span className="text-xs text-blue-100 font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-lg">{(t.types as any)[selectedAccount.type]}</span>
                  </div>
                  <h3 className="font-black text-3xl mt-2">{isRTL ? selectedAccount.name_ar : selectedAccount.name_en}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">{t.balances.closing}</div>
                  <div className={`text-3xl font-mono font-black ${closingBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-bold text-blue-300 ml-1">{selectedAccount.currency}</span>
                  </div>
                </div>
              </div>

              {/* Toolbar & Date Filters */}
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                        <CalendarDays size={16} className="text-slate-400" />
                        <select 
                            value={dateFilter} 
                            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                            className="bg-transparent text-slate-700 text-xs font-bold outline-none cursor-pointer"
                        >
                            <option value="all">{t.filters.all}</option>
                            <option value="today">{t.filters.today}</option>
                            <option value="week">{t.filters.week}</option>
                            <option value="month">{t.filters.month}</option>
                            <option value="year">{t.filters.year}</option>
                            <option value="custom">{t.filters.custom}</option>
                        </select>
                    </div>

                    <AnimatePresence>
                        {dateFilter === 'custom' && (
                            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex items-center gap-2 overflow-hidden bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                                <span className="text-xs font-bold text-slate-400">{t.filters.from}</span>
                                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent text-slate-700 text-xs font-bold outline-none" />
                                <span className="text-xs font-bold text-slate-400 ml-2">{t.filters.to}</span>
                                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent text-slate-700 text-xs font-bold outline-none" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 transition px-4 py-2.5 bg-blue-50 rounded-xl border border-blue-200">
                  <Download size={14}/> {t.export}
                </button>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
                {loadingLedger ? (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
                ) : null}
                <table className="w-full text-start">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-black sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                    <tr>
                      <th className={`p-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.date}</th>
                      <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.desc}</th>
                      <th className={`p-4 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.ref}</th>
                      <th className={`p-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.debit}</th>
                      <th className={`p-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.credit}</th>
                      <th className={`p-4 whitespace-nowrap bg-blue-50/50 ${isRTL ? 'border-r text-left' : 'border-l text-right'}`}>{t.table.balance}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    
                    {/* Opening Balance Row */}
                    {dateFilter !== 'all' && (
                        <tr className="bg-slate-50/80 border-b-2 border-slate-200">
                            <td className="p-4 whitespace-nowrap text-xs text-slate-400 font-bold">-</td>
                            <td className="p-4 font-black text-slate-700">{t.balances.opening}</td>
                            <td className="p-4 whitespace-nowrap text-xs text-slate-400">-</td>
                            <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>-</td>
                            <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>-</td>
                            <td className={`p-4 whitespace-nowrap font-mono font-black border-slate-200 ${openingBalance < 0 ? 'text-red-600' : 'text-emerald-600'} ${isRTL ? 'text-left border-r' : 'text-right border-l'}`}>
                                {openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    )}

                    {ledgerRows.length > 0 ? ledgerRows.map(entry => (
                      <tr key={entry.id} className="hover:bg-blue-50/30 transition group">
                        <td className="p-4 whitespace-nowrap text-xs text-slate-500 font-bold">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition">{entry.description}</div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">By: {entry.user}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs font-mono font-bold text-slate-500">{entry.reference}</td>
                        <td className={`p-4 whitespace-nowrap font-mono font-black text-slate-700 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {entry.debit > 0 ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className={`p-4 whitespace-nowrap font-mono font-black text-slate-700 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {entry.credit > 0 ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className={`p-4 whitespace-nowrap font-mono font-black border-slate-100 bg-slate-50/30 group-hover:bg-transparent ${entry.currentBalance < 0 ? 'text-red-600' : 'text-emerald-600'} ${isRTL ? 'text-left border-r' : 'text-right border-l'}`}>
                          {entry.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="p-16 text-center text-slate-400 font-bold bg-slate-50/50">
                                <FileText size={32} className="mx-auto mb-3 opacity-20"/>
                                {t.emptyTransactions}
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 flex-col gap-4 p-10 text-center border-dashed border-2 border-slate-200 m-8 rounded-3xl">
              <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <BookOpen size={32}/>
              </div>
              <h3 className="font-black text-xl text-slate-700">دليل الحسابات</h3>
              <p className="text-slate-500 font-medium text-sm max-w-xs">{t.emptyLedger}</p>
            </div>
          )}
        </div>

      </div>

      {/* --- Add Account Modal (Smart) --- */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-black text-lg flex items-center gap-2"><FolderPlus size={20} className="text-blue-400"/> {t.modals.newAccTitle}</h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-5 bg-slate-50/50">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.accParent}</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-700 cursor-pointer transition" value={newAcc.parentId || preselectedParentId} onChange={(e) => setNewAcc({...newAcc, parentId: e.target.value})}>
                      <option value="">{t.modals.rootNode}</option>
                      {flatAccountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.accType}</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-700 cursor-pointer transition" value={newAcc.type} onChange={(e) => setNewAcc({...newAcc, type: e.target.value as AccountType})}>
                        {Object.entries(t.types).map(([key, val]) => <option key={key} value={key}>{val as string}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.accCode}</label>
                      <input type="text" value={newAcc.code} onChange={(e) => setNewAcc({...newAcc, code: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-mono font-black text-blue-600 shadow-inner" placeholder="10101" />
                    </div>
                  </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.accNameAr}</label>
                    <input type="text" value={newAcc.name_ar} onChange={(e) => setNewAcc({...newAcc, name_ar: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 shadow-sm" placeholder="مثال: البنك الأهلي" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.accNameEn}</label>
                    <input type="text" value={newAcc.name_en} onChange={(e) => setNewAcc({...newAcc, name_en: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800 shadow-sm" dir="ltr" placeholder="e.g. NCB Bank" />
                  </div>
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
              <button onClick={() => setIsAddAccountOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">{t.modals.cancel}</button>
              <button onClick={handleAddAccount} disabled={!newAcc.code || !newAcc.name_ar || isSaving} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition active:scale-95">
                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {t.modals.save}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// أيقونة إضافية للمجلد الجديد
function FolderPlus(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 10v6"></path>
            <path d="M9 13h6"></path>
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
        </svg>
    )
}