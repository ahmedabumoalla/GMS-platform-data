'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, Briefcase, Banknote, ArrowRight, Loader2, 
  CheckCircle2, MapPin, UploadCloud 
} from 'lucide-react';

// Mock Location Picker loading
const LocationPicker = dynamic(() => import('./LocationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">Loading Map...</div>
});

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  userId: number;
  onDataAdded: () => void;
};

const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition text-sm text-slate-800 font-semibold";
const labelClass = "block text-xs font-bold text-slate-500 mb-2";

export default function BlackBoxEntry({ isOpen, onClose, onDataAdded }: Props) {
  const [entryType, setEntryType] = useState<'contract' | 'finance'>('contract');
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // مدراء وهميين
  const managers = [
    { id: 1, full_name: 'Ahmed Manager' },
    { id: 2, full_name: 'Sarah Supervisor' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // محاكاة عملية الحفظ
    setTimeout(() => {
        setLoading(false);
        alert('تم حفظ البيانات بنجاح (وضع التصميم) ✅');
        onDataAdded();
        onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200" dir="ltr">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-bold text-2xl text-slate-800">Central Data Entry</h3>
            <p className="text-slate-400 text-xs mt-1">Add strategic data to the system core (Black Box).</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition border border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div 
              onClick={() => setEntryType('contract')}
              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                entryType === 'contract' 
                  ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                  : 'border-white bg-white hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${entryType === 'contract' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Briefcase size={20} />
                </div>
                {entryType === 'contract' && <CheckCircle2 className="text-blue-600" size={20} />}
              </div>
              <h4 className={`font-bold ${entryType === 'contract' ? 'text-blue-900' : 'text-slate-800'}`}>New Contract / Project</h4>
            </div>

            <div 
              onClick={() => setEntryType('finance')}
              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                entryType === 'finance' 
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md' 
                  : 'border-white bg-white hover:border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-3 rounded-xl ${entryType === 'finance' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Banknote size={20} />
                </div>
                {entryType === 'finance' && <CheckCircle2 className="text-emerald-600" size={20} />}
              </div>
              <h4 className={`font-bold ${entryType === 'finance' ? 'text-emerald-900' : 'text-slate-800'}`}>Financial Transaction</h4>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {entryType === 'contract' ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex bg-white border-b border-slate-100 px-6 pt-4 gap-6 text-sm font-bold text-slate-500 overflow-x-auto">
                   <button type="button" onClick={() => setActiveTab(1)} className={`pb-3 border-b-2 whitespace-nowrap transition ${activeTab === 1 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>1. Basic Info</button>
                   <button type="button" onClick={() => setActiveTab(2)} className={`pb-3 border-b-2 whitespace-nowrap transition ${activeTab === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>2. Financials</button>
                   <button type="button" onClick={() => setActiveTab(3)} className={`pb-3 border-b-2 whitespace-nowrap transition ${activeTab === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>3. Scope & Map</button>
                   <button type="button" onClick={() => setActiveTab(4)} className={`pb-3 border-b-2 whitespace-nowrap transition ${activeTab === 4 ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'}`}>4. Files</button>
                </div>

                <div className="p-6">
                  {activeTab === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Project Name</label>
                          <input type="text" className={inputClass} placeholder="e.g. Street Lighting Phase 1" required />
                        </div>
                        <div>
                          <label className={labelClass}>Owning Entity (Client)</label>
                          <input type="text" className={inputClass} placeholder="e.g. Riyadh Municipality" required />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Responsible Project Managers</label>
                          <select multiple className={`${inputClass} h-24`}>
                            {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Total Contract Value (SAR)</label>
                          <input type="number" className={inputClass} placeholder="0.00" required/>
                        </div>
                        <div>
                          <label className={labelClass}>Expected Margin (%)</label>
                          <input type="number" className={inputClass} placeholder="e.g. 15%" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className={`${labelClass} flex items-center gap-2`}>
                          <MapPin size={16} className="text-blue-600"/> Define Project Range (Start - End)
                        </label>
                        <div className="bg-slate-100 rounded-xl overflow-hidden h-[300px] border border-slate-200 z-0 relative">
                           {/* خريطة وهمية للعرض فقط */}
                           <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                             [Map Component Placeholder for UI Mode]
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 4 && (
                    <div className="text-center py-8 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                        <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
                        <h4 className="font-bold text-slate-700">Click to upload Contract PDF</h4>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-2">
                    {activeTab > 1 && <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:bg-white">Previous</button>}
                  </div>
                  <div className="flex gap-2">
                    {activeTab < 4 ? (
                      <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">Next</button>
                    ) : (
                      <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={16}/> : 'Confirm & Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Financial Transaction Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Transaction Type</label>
                    <select className={inputClass}>
                      <option value="Income">📥 Income (Revenue)</option>
                      <option value="Expense">📤 Expense (Cost)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Amount (SAR)</label>
                    <input required type="number" placeholder="0.00" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description / Statement</label>
                  <textarea required placeholder="Describe the transaction..." className={`${inputClass} h-24 resize-none`}></textarea>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                    {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={18} /> Confirm Entry</>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}