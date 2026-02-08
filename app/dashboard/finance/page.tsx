'use client';

import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase'; // <-- تم تعطيل هذا السطر مؤقتاً
import { 
  Wallet, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle, PieChart, ArrowUpLeft, ArrowDownLeft, Plus, X 
} from 'lucide-react';

type Transaction = {
  id: number;
  transaction_type: 'Income' | 'Expense';
  amount: number;
  description: string;
  is_verified: boolean;
  created_at: string;
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات المودال
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState({
    type: 'Income',
    amount: '',
    description: ''
  });

  // حالة الإحصائيات
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingCount: 0
  });

  useEffect(() => {
    fetchFinancials();
  }, []);

  // 1. جلب البيانات (محاكاة)
  const fetchFinancials = async () => {
    setLoading(true);
    
    setTimeout(() => {
        const mockData: Transaction[] = [
            { id: 1, transaction_type: 'Income', amount: 50000, description: 'مشروع أ - الدفعة المقدمة', is_verified: true, created_at: '2024-02-01' },
            { id: 2, transaction_type: 'Expense', amount: 12000, description: 'شراء معدات', is_verified: true, created_at: '2024-02-02' },
            { id: 3, transaction_type: 'Income', amount: 25000, description: 'خدمات استشارية', is_verified: false, created_at: '2024-02-03' },
            { id: 4, transaction_type: 'Expense', amount: 3500, description: 'أدوات مكتبية', is_verified: false, created_at: '2024-02-04' },
        ];

        setTransactions(mockData);
        calculateStats(mockData);
        setLoading(false);
    }, 800);
  };

  // 2. حساب الإحصائيات
  const calculateStats = (data: Transaction[]) => {
    const income = data
      .filter(t => t.transaction_type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = data
      .filter(t => t.transaction_type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      pendingCount: data.filter(t => !t.is_verified).length
    });
  };

  // 3. إضافة معاملة جديدة (محاكاة)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.amount || !newTrans.description) return;

    const newTransaction: Transaction = {
        id: Math.random(),
        transaction_type: newTrans.type as 'Income' | 'Expense',
        amount: parseFloat(newTrans.amount),
        description: newTrans.description,
        is_verified: false,
        created_at: new Date().toISOString()
    };

    const updatedList = [newTransaction, ...transactions];
    setTransactions(updatedList);
    calculateStats(updatedList);
    
    setIsModalOpen(false);
    setNewTrans({ type: 'Income', amount: '', description: '' });
    alert('تم تسجيل المعاملة بنجاح (وضع المعاينة)');
  };

  // 4. التحقق من المعاملة (محاكاة)
  const verifyTransaction = async (id: number) => {
    const updatedList = transactions.map(t => 
        t.id === id ? { ...t, is_verified: true } : t
    );
    setTransactions(updatedList);
    calculateStats(updatedList);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* الترويسة وزر الإضافة */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-blue-600" /> الإدارة المالية
          </h2>
          <p className="text-slate-500 mt-1">مراقبة التدفقات النقدية والتحقق من المعاملات.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition"
            >
                <Plus size={18} /> معاملة جديدة
            </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* صافي الربح */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><PieChart size={24} /></div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.netProfit >= 0 ? '+ فائض' : '- عجز'}
                </span>
            </div>
            <div className="text-slate-500 text-sm mb-1">صافي التدفق النقدي</div>
            <div className="text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(stats.netProfit)}</div>
        </div>

        {/* الإيرادات */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit mb-4"><ArrowUpLeft size={24} /></div>
            <div className="text-slate-500 text-sm mb-1">الإيرادات</div>
            <div className="text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(stats.totalIncome)}</div>
        </div>

        {/* المصروفات */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mb-4"><ArrowDownLeft size={24} /></div>
            <div className="text-slate-500 text-sm mb-1">المصروفات</div>
            <div className="text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(stats.totalExpense)}</div>
        </div>

        {/* قيد الانتظار */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4"><AlertCircle size={24} /></div>
            <div className="text-slate-500 text-sm mb-1">قيد المراجعة</div>
            <div className="text-2xl font-bold text-slate-800">{stats.pendingCount}</div>
        </div>
      </div>

      {/* جدول المعاملات */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800">سجل المعاملات اليومي</h3>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                        <th className="p-5">نوع المعاملة</th>
                        <th className="p-5">المبلغ</th>
                        <th className="p-5">الوصف</th>
                        <th className="p-5">التاريخ</th>
                        <th className="p-5">الحالة</th>
                        <th className="p-5">الإجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                          <tr><td colSpan={6} className="p-10 text-center">جاري التحميل...</td></tr>
                    ) : transactions.length === 0 ? (
                        <tr><td colSpan={6} className="p-10 text-center text-slate-400">لا توجد معاملات مسجلة.</td></tr>
                    ) : transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="p-5">
                                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold w-fit ${
                                    t.transaction_type === 'Income' 
                                    ? 'bg-green-50 text-green-700 border border-green-100' 
                                    : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {t.transaction_type === 'Income' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                    {t.transaction_type === 'Income' ? 'إيراد' : 'مصروف'}
                                </span>
                            </td>
                            <td className="p-5 font-bold text-slate-800" dir="ltr">{formatCurrency(t.amount)}</td>
                            <td className="p-5 text-sm text-slate-600">{t.description}</td>
                            <td className="p-5 text-xs text-slate-500 font-mono">{new Date(t.created_at).toLocaleDateString('ar-SA')}</td>
                            <td className="p-5">
                                {t.is_verified ? 
                                    <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> معتمد</span> : 
                                    <span className="text-amber-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14}/> قيد الانتظار</span>
                                }
                            </td>
                            <td className="p-5">
                                {!t.is_verified && (
                                    <button onClick={() => verifyTransaction(t.id)} className="px-3 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700">اعتماد</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* مودال: إضافة معاملة جديدة */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg">تسجيل معاملة</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                </div>
                <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">نوع المعاملة</label>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setNewTrans({...newTrans, type: 'Income'})}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border ${newTrans.type === 'Income' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-500'}`}
                            >
                                إيراد (دخل)
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewTrans({...newTrans, type: 'Expense'})}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border ${newTrans.type === 'Expense' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-500'}`}
                            >
                                مصروف (خرج)
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">المبلغ (ر.س)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-left ltr"
                            placeholder="0.00"
                            value={newTrans.amount}
                            onChange={(e) => setNewTrans({...newTrans, amount: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">الوصف</label>
                        <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24 resize-none"
                            placeholder="مثال: دفعة مقدمة من العميل..."
                            value={newTrans.description}
                            onChange={(e) => setNewTrans({...newTrans, description: e.target.value})}
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">
                        حفظ المعاملة
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}