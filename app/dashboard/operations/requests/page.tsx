'use client';

import { useState, useEffect } from 'react';
import { 
  Inbox, Filter, CheckCircle, XCircle, Clock, FileText, 
  Plus, Search, X, Check, Eye, DollarSign, Calendar, AlertCircle
} from 'lucide-react';
// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout';
// --- Types ---
type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
type RequestType = 'Material' | 'Leave' | 'Maintenance' | 'PettyCash';

interface RequestItem {
  id: string;
  type: RequestType;
  requester: string;
  date: string;
  status: RequestStatus;
  details: string;
  amount?: string; // للعهد المالية
  duration?: string; // للإجازات
}

export default function RequestsPage() {
  // ✅ استخدام اللغة من النظام العام
  const { lang } = useDashboard();
  
  const [activeTab, setActiveTab] = useState<'All' | RequestStatus>('All');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  // New Request Form State
  const [formData, setFormData] = useState({
    type: 'Material' as RequestType,
    details: '',
    amount: '',
    duration: '',
    reason: ''
  });

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true); // إعادة تفعيل اللودينج عند تغيير اللغة
    setTimeout(() => {
      setRequests([
        { 
          id: 'REQ-001', type: 'Material', 
          requester: lang === 'ar' ? 'سعيد القحطاني' : 'Saeed Al-Qahtani', 
          date: '2024-02-05', status: 'Pending', 
          details: lang === 'ar' ? 'أسلاك نحاسية 10مم (عدد 5 لفة) لمشروع التمديد' : '10mm Copper Wires (5 rolls) for wiring project' 
        },
        { 
          id: 'REQ-002', type: 'Leave', 
          requester: lang === 'ar' ? 'ياسر الحربي' : 'Yasser Al-Harbi', 
          date: '2024-02-04', status: 'Approved', 
          details: lang === 'ar' ? 'ظرف عائلي طارئ' : 'Emergency family circumstances', 
          duration: lang === 'ar' ? 'يوم واحد' : '1 Day' 
        },
        { 
          id: 'REQ-003', type: 'Maintenance', 
          requester: lang === 'ar' ? 'عمر فاروق' : 'Omar Farouk', 
          date: '2024-02-03', status: 'Rejected', 
          details: lang === 'ar' ? 'تغيير إطارات للسيارة رقم 55 بسبب التآكل' : 'Change tires for vehicle #55 due to wear' 
        },
        { 
          id: 'REQ-004', type: 'PettyCash', 
          requester: lang === 'ar' ? 'محمد علي' : 'Mohammed Ali', 
          date: '2024-02-02', status: 'Pending', 
          details: lang === 'ar' ? 'شراء وقود للمولدات وتشغيل الموقع' : 'Purchase fuel for generators and site ops', 
          amount: '500' 
        },
      ]);
      setLoading(false);
    }, 500);
  }, [lang]); // ✅ التحديث عند تغيير اللغة

  // --- Actions ---
  const handleAddRequest = () => {
    if (!formData.details) return;

    const newReq: RequestItem = {
      id: `REQ-00${requests.length + 1}`,
      type: formData.type,
      requester: lang === 'ar' ? 'مستخدم حالي' : 'Current User',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      details: formData.details,
      amount: formData.amount,
      duration: formData.duration
    };

    setRequests([newReq, ...requests]);
    setIsNewRequestOpen(false);
    setFormData({ type: 'Material', details: '', amount: '', duration: '', reason: '' });
  };

  const handleUpdateStatus = (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    setSelectedRequest(null);
  };

  const filteredRequests = requests.filter(req => activeTab === 'All' ? true : req.status === activeTab);

  // Helper Functions
  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'Approved': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold border border-green-100"><CheckCircle size={12}/> {lang === 'ar' ? 'معتمد' : 'Approved'}</span>;
        case 'Rejected': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold border border-red-100"><XCircle size={12}/> {lang === 'ar' ? 'مرفوض' : 'Rejected'}</span>;
        default: return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold border border-amber-100"><Clock size={12}/> {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>;
    }
  };

  const getRequestLabel = (type: string) => {
      switch(type) {
          case 'Material': return lang === 'ar' ? 'طلب مواد' : 'Material Request';
          case 'Leave': return lang === 'ar' ? 'إجازة' : 'Leave';
          case 'Maintenance': return lang === 'ar' ? 'صيانة' : 'Maintenance';
          case 'PettyCash': return lang === 'ar' ? 'عهدة مالية' : 'Petty Cash';
          default: return type;
      }
  };

  return (
    <div className={`space-y-6 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Inbox className="text-blue-600" /> {lang === 'ar' ? 'إدارة الطلبات والخدمات' : 'Requests & Services Mgmt'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{lang === 'ar' ? 'متابعة واعتماد الطلبات الإدارية والتشغيلية' : 'Track and approve administrative and operational requests'}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'بحث برقم الطلب...' : 'Search Request ID...'} 
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm outline-none focus:border-blue-500 transition ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                />
            </div>
            <button 
                onClick={() => setIsNewRequestOpen(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center gap-2 transition"
            >
                <Plus size={16}/> {lang === 'ar' ? 'طلب جديد' : 'New Request'}
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {tab === 'All' 
                    ? (lang === 'ar' ? 'الكل' : 'All') 
                    : tab === 'Pending' 
                        ? (lang === 'ar' ? 'قيد الانتظار' : 'Pending') 
                        : tab === 'Approved' 
                            ? (lang === 'ar' ? 'المعتمدة' : 'Approved') 
                            : (lang === 'ar' ? 'المرفوضة' : 'Rejected')}
            </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                <tr>
                    <th className="p-5">{lang === 'ar' ? 'رقم الطلب' : 'Request ID'}</th>
                    <th className="p-5">{lang === 'ar' ? 'نوع الطلب' : 'Type'}</th>
                    <th className="p-5">{lang === 'ar' ? 'مقدم الطلب' : 'Requester'}</th>
                    <th className="p-5">{lang === 'ar' ? 'التفاصيل / المبلغ' : 'Details / Amount'}</th>
                    <th className="p-5">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="p-5">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className={`p-5 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {loading ? (
                    <tr><td colSpan={7} className="p-10 text-center text-slate-400">{lang === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading requests...'}</td></tr>
                ) : filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition group">
                        <td className="p-5 font-mono text-xs text-slate-400">{req.id}</td>
                        <td className="p-5 font-bold text-slate-800">{getRequestLabel(req.type)}</td>
                        <td className="p-5 text-sm text-slate-600">{req.requester}</td>
                        <td className="p-5 text-sm text-slate-500">
                            {req.type === 'PettyCash' && <span className="text-green-600 font-bold ml-1">{req.amount} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>}
                            <span className="truncate max-w-xs block">{req.details}</span>
                        </td>
                        <td className="p-5 text-sm text-slate-500">{req.date}</td>
                        <td className="p-5">{getStatusBadge(req.status)}</td>
                        <td className={`p-5 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>
                            <button 
                                onClick={() => setSelectedRequest(req)}
                                className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                            >
                                <Eye size={14}/> {lang === 'ar' ? 'عرض' : 'View'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- New Request Modal --- */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'إضافة طلب جديد' : 'New Request'}</h3>
                    <button onClick={() => setIsNewRequestOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* نوع الطلب */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'نوع الطلب' : 'Request Type'}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Material', 'PettyCash', 'Leave', 'Maintenance'].map((type) => (
                                <button 
                                    key={type}
                                    onClick={() => setFormData({...formData, type: type as RequestType})}
                                    className={`py-3 rounded-xl text-xs font-bold border transition ${
                                        formData.type === type 
                                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {getRequestLabel(type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* حقول ديناميكية بناءً على النوع */}
                    {formData.type === 'PettyCash' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'المبلغ المطلوب (ر.س)' : 'Amount (SAR)'}</label>
                            <div className="relative">
                                <DollarSign className={`absolute top-3 text-slate-400 w-4 h-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`}/>
                                <input 
                                    type="number" 
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 outline-none focus:border-blue-500 text-sm font-bold ${lang === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {formData.type === 'Leave' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'مدة الإجازة' : 'Duration'}</label>
                            <div className="relative">
                                <Calendar className={`absolute top-3 text-slate-400 w-4 h-4 ${lang === 'ar' ? 'right-3' : 'left-3'}`}/>
                                <input 
                                    type="text" 
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 outline-none focus:border-blue-500 text-sm ${lang === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
                                    placeholder={lang === 'ar' ? 'مثال: 3 أيام...' : 'e.g. 3 Days...'}
                                    value={formData.duration}
                                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* التفاصيل العامة */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                            {formData.type === 'PettyCash' ? (lang === 'ar' ? 'الغرض من الصرف' : 'Purpose') : (lang === 'ar' ? 'تفاصيل الطلب' : 'Details')}
                        </label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm h-32 resize-none placeholder:text-slate-400"
                            placeholder={formData.type === 'PettyCash' ? (lang === 'ar' ? "مثال: شراء ديزل..." : "e.g. Buying diesel...") : (lang === 'ar' ? "اكتب التفاصيل هنا..." : "Type details here...")}
                            value={formData.details}
                            onChange={(e) => setFormData({...formData, details: e.target.value})}
                        ></textarea>
                        {formData.type === 'PettyCash' && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><AlertCircle size={10}/> {lang === 'ar' ? 'يرجى إرفاق الفواتير لاحقاً.' : 'Please attach receipts later.'}</p>}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button onClick={() => setIsNewRequestOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={handleAddRequest} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg">{lang === 'ar' ? 'إرسال الطلب' : 'Submit'}</button>
                </div>
            </div>
        </div>
      )}

      {/* --- View Request Modal --- */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{getRequestLabel(selectedRequest.type)}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedRequest.id}</p>
                    </div>
                    <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1">{lang === 'ar' ? 'مقدم الطلب' : 'Requester'}</div>
                            <div className="font-bold text-slate-700">{selectedRequest.requester}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1">{lang === 'ar' ? 'التاريخ' : 'Date'}</div>
                            <div className="font-bold text-slate-700">{selectedRequest.date}</div>
                        </div>
                    </div>

                    {selectedRequest.type === 'PettyCash' && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                            <span className="text-sm text-green-800 font-bold">{lang === 'ar' ? 'المبلغ المطلوب' : 'Amount'}</span>
                            <span className="text-lg font-black text-green-700">{selectedRequest.amount} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
                        </div>
                    )}
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs text-slate-400 mb-2">{lang === 'ar' ? 'التفاصيل' : 'Details'}</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{selectedRequest.details}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-sm font-bold text-slate-500">{lang === 'ar' ? 'الحالة الحالية:' : 'Current Status:'}</span>
                        {getStatusBadge(selectedRequest.status)}
                    </div>
                </div>

                {selectedRequest.status === 'Pending' && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                        <button 
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'Rejected')}
                            className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition flex items-center justify-center gap-2"
                        >
                            <X size={16}/> {lang === 'ar' ? 'رفض' : 'Reject'}
                        </button>
                        <button 
                            onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved')}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center justify-center gap-2 transition"
                        >
                            <Check size={16}/> {lang === 'ar' ? 'اعتماد' : 'Approve'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}