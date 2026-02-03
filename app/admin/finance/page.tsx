'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle, FileText, PieChart, ArrowUpRight, ArrowDownRight, Plus, X 
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
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState({
    type: 'Income',
    amount: '',
    description: ''
  });

  // Stats State (calculated automatically from real data)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingCount: 0
  });

  useEffect(() => {
    fetchFinancials();
  }, []);

  // 1. Fetch real data from DB
  const fetchFinancials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('financials')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  // 2. Calculate Statistics
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

  // 3. Add New Transaction (Real Data)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.amount || !newTrans.description) return;

    const { error } = await supabase.from('financials').insert({
        transaction_type: newTrans.type,
        amount: parseFloat(newTrans.amount),
        description: newTrans.description,
        is_verified: false // Requires verification later
    });

    if (!error) {
        setIsModalOpen(false);
        setNewTrans({ type: 'Income', amount: '', description: '' });
        fetchFinancials(); // Update table
        alert('Transaction recorded successfully');
    }
  };

  // 4. Verify Transaction
  const verifyTransaction = async (id: number) => {
    await supabase.from('financials').update({ is_verified: true }).eq('id', id);
    fetchFinancials();
  };

  const formatCurrency = (amount: number) => {
    // Changed locale to en-SA (Saudi Arabia English) for SAR currency
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  return (
    <div className="space-y-8 font-sans" dir="ltr">
      
      {/* Header + Add Button */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-blue-600" /> Financial Management
          </h2>
          <p className="text-slate-500 mt-1">Monitor cash flows and verify transactions.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition"
            >
                <Plus size={18} /> New Transaction
            </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Net Profit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><PieChart size={24} /></div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.netProfit >= 0 ? '+ Surplus' : '- Deficit'}
                </span>
            </div>
            <div className="text-slate-500 text-sm mb-1">Net Cash Flow</div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.netProfit)}</div>
        </div>

        {/* Income */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit mb-4"><ArrowUpRight size={24} /></div>
            <div className="text-slate-500 text-sm mb-1">Income</div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalIncome)}</div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit mb-4"><ArrowDownRight size={24} /></div>
            <div className="text-slate-500 text-sm mb-1">Expenses</div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalExpense)}</div>
        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4"><AlertCircle size={24} /></div>
            <div className="text-slate-500 text-sm mb-1">Pending Verification</div>
            <div className="text-2xl font-bold text-slate-800">{stats.pendingCount}</div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800">Daily Transaction Log</h3>
        </div>

        <div className="overflow-x-auto">
            {/* Switched to text-left for English */}
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                        <th className="p-5">Transaction Type</th>
                        <th className="p-5">Amount</th>
                        <th className="p-5">Description</th>
                        <th className="p-5">Date</th>
                        <th className="p-5">Status</th>
                        <th className="p-5">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                          <tr><td colSpan={6} className="p-10 text-center">Loading...</td></tr>
                    ) : transactions.length === 0 ? (
                        <tr><td colSpan={6} className="p-10 text-center text-slate-400">No transactions recorded. Start by adding a new transaction.</td></tr>
                    ) : transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="p-5">
                                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold w-fit ${
                                    t.transaction_type === 'Income' 
                                    ? 'bg-green-50 text-green-700 border border-green-100' 
                                    : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                    {t.transaction_type === 'Income' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                    {t.transaction_type === 'Income' ? 'Income' : 'Expense'}
                                </span>
                            </td>
                            <td className="p-5 font-bold text-slate-800">{formatCurrency(t.amount)}</td>
                            <td className="p-5 text-sm text-slate-600">{t.description}</td>
                            <td className="p-5 text-xs text-slate-500 font-mono">{new Date(t.created_at).toLocaleDateString('en-US')}</td>
                            <td className="p-5">
                                {t.is_verified ? 
                                    <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Verified</span> : 
                                    <span className="text-amber-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14}/> Pending</span>
                                }
                            </td>
                            <td className="p-5">
                                {!t.is_verified && (
                                    <button onClick={() => verifyTransaction(t.id)} className="px-3 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700">Verify</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal: Add New Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg">Record Transaction</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                </div>
                <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Transaction Type</label>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => setNewTrans({...newTrans, type: 'Income'})}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border ${newTrans.type === 'Income' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-500'}`}
                            >
                                Income
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewTrans({...newTrans, type: 'Expense'})}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold border ${newTrans.type === 'Expense' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200 text-slate-500'}`}
                            >
                                Expense
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Amount (SAR)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                            placeholder="0.00"
                            value={newTrans.amount}
                            onChange={(e) => setNewTrans({...newTrans, amount: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Description</label>
                        <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24 resize-none"
                            placeholder="e.g., Down payment from client..."
                            value={newTrans.description}
                            onChange={(e) => setNewTrans({...newTrans, description: e.target.value})}
                            required
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">
                        Save Transaction
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}