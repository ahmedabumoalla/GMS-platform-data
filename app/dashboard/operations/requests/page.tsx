'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Inbox, Filter, CheckCircle, XCircle, Clock, FileText, 
  Plus, Search, X, Check, Eye, DollarSign, Calendar, AlertCircle, 
  Loader2, ArrowUpCircle, ShieldCheck, Send, Briefcase, UserPlus,
  MessageCircleQuestion, CornerDownLeft, MessageSquareReply
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout';

// --- Types ---
type DBRequestStatus = 'pending' | 'manager_approved' | 'approved' | 'rejected' | 'needs_clarification';
type RequestType = 'Material' | 'Leave' | 'Maintenance' | 'PettyCash' | 'manpower' | 'other';

interface RequestItem {
  id: string; 
  displayId: string; 
  type: RequestType;
  submitter_id: string; // لمعرفة صاحب الطلب الحقيقي
  requester: string;
  requester_role: string;
  date: string;
  status: DBRequestStatus;
  details: string;
  amount?: string; 
  duration?: string; 
  project_name?: string;
  project_id?: string;
  new_emp_data?: { full_name: string; phone: string; national_id: string; job_title: string; }; 
  
  // حقول دورة العمل الجديدة
  rejection_reason?: string;
  clarification_note?: string;
  clarification_reply?: string;
}

export default function RequestsPage() {
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [activeTab, setActiveTab] = useState<'All' | DBRequestStatus>('All');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [projects, setProjects] = useState<{id: string, title: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Interactive Actions in Modal
  const [actionType, setActionType] = useState<'none' | 'Reject' | 'Clarify' | 'Reply'>('none');
  const [actionText, setActionText] = useState('');

  // New Request Form State
  const [formData, setFormData] = useState({
    project_id: '',
    type: 'Material' as RequestType,
    details: '',
    amount: '',
    duration: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // --- 1. Fetch Real Data ---
  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. المشاريع
      let pQuery = supabase.from('projects').select('id, title, manager_name');
      if (user.role === 'project_manager') pQuery = pQuery.ilike('manager_name', `%${user.full_name || ''}%`);
      const { data: myProjects } = await pQuery;
      if (myProjects) setProjects(myProjects);

      // 2. الطلبات العادية
      let reqQuery = supabase.from('technician_requests').select('*').order('created_at', { ascending: false });
      if (user.role === 'project_manager') {
          const projIds = myProjects?.map(p => p.id) || [];
          if (projIds.length > 0) reqQuery = reqQuery.or(`user_id.eq.${user.id},project_id.in.(${projIds.join(',')})`);
          else reqQuery = reqQuery.eq('user_id', user.id);
      } else if (!isAdmin) {
          reqQuery = reqQuery.eq('user_id', user.id);
      }
      const { data: reqData } = await reqQuery;

      // 3. طلبات التوظيف (القوى العاملة)
      let empQuery = supabase.from('pending_employees').select('*').order('created_at', { ascending: false });
      if (user.role === 'project_manager' || !isAdmin) empQuery = empQuery.eq('requested_by', user.id);
      const { data: empData } = await empQuery;

      // 4. جلب بيانات المستخدمين للدمج
      const allUserIds = [...new Set([ ...(reqData?.map(r => r.user_id) || []), ...(empData?.map(e => e.requested_by) || []) ].filter(Boolean))];
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name, role').in('id', allUserIds);
      
      const reqProjectIds = [...new Set(reqData?.map(r => r.project_id).filter(Boolean) || [])];
      const { data: allProjectsData } = await supabase.from('projects').select('id, title').in('id', reqProjectIds);

      // 5. دمج البيانات
      const combinedRequests: RequestItem[] = [];

      reqData?.forEach((r: any, index: number) => {
          const profile = profilesData?.find(p => p.id === r.user_id);
          const proj = allProjectsData?.find(p => p.id === r.project_id);
          combinedRequests.push({
              id: r.id,
              displayId: `REQ-${Math.floor(1000 + index + Math.random() * 9000)}`,
              type: r.request_type,
              submitter_id: r.user_id,
              requester: profile?.full_name || 'Unknown',
              requester_role: profile?.role || 'user',
              date: new Date(r.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
              status: r.status as DBRequestStatus,
              details: r.description || '',
              amount: r.amount?.toString(),
              duration: r.start_date, 
              project_name: proj?.title,
              project_id: r.project_id,
              rejection_reason: r.rejection_reason,
              clarification_note: r.clarification_note,
              clarification_reply: r.clarification_reply
          });
      });

      empData?.forEach((e: any, index: number) => {
          const profile = profilesData?.find(p => p.id === e.requested_by);
          combinedRequests.push({
              id: e.id,
              displayId: `EMP-${Math.floor(1000 + index + Math.random() * 9000)}`,
              type: 'manpower',
              submitter_id: e.requested_by,
              requester: profile?.full_name || 'Unknown',
              requester_role: profile?.role || 'user',
              date: new Date(e.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
              status: e.status as DBRequestStatus,
              details: isRTL ? `طلب إضافة فني جديد: ${e.full_name} (${e.job_title})` : `New tech request: ${e.full_name} (${e.job_title})`,
              new_emp_data: { full_name: e.full_name, phone: e.phone, national_id: e.national_id, job_title: e.job_title },
              rejection_reason: e.rejection_reason,
              clarification_note: e.clarification_note,
              clarification_reply: e.clarification_reply
          });
      });

      combinedRequests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRequests(combinedRequests);
      
    } catch (error: any) {
      console.error("Error fetching requests:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [user, isRTL, isAdmin]);

  // --- 2. Advanced Workflow Actions ---
  const executeWorkflowAction = async (req: RequestItem, action: 'Approve' | 'Reject' | 'Clarify' | 'Reply', textData: string = '') => {
      if (!user) return;
      setActionLoading(req.id);

      try {
          const tableName = req.type === 'manpower' ? 'pending_employees' : 'technician_requests';
          let payload: any = {};

          if (action === 'Approve') {
              payload.status = isAdmin ? 'approved' : 'manager_approved';
              if (req.type === 'manpower' && payload.status === 'approved') {
                  // في حالة الموافقة النهائية على موظف
                  alert(isRTL ? `تم اعتماد الفني وسيتم إنشاء حسابه برقم جواله.` : `Tech approved, account will be created.`);
              }
          } 
          else if (action === 'Reject') {
              if (!textData) throw new Error(isRTL ? 'يجب إدخال سبب الرفض' : 'Rejection reason is required');
              payload.status = 'rejected';
              payload.rejection_reason = textData;
          } 
          else if (action === 'Clarify') {
              if (!textData) throw new Error(isRTL ? 'يجب كتابة طلب التوضيح' : 'Clarification note is required');
              payload.status = 'needs_clarification';
              payload.clarification_note = textData;
          } 
          else if (action === 'Reply') {
              if (!textData) throw new Error(isRTL ? 'يجب كتابة الرد' : 'Reply is required');
              payload.clarification_reply = textData;
              // إعادة الطلب للمدير أو الأدمن بناءً على من قام برفعه
              payload.status = user.role === 'project_manager' ? 'manager_approved' : 'pending';
          }

          const { error } = await supabase.from(tableName).update(payload).eq('id', req.id);
          if (error) throw error;

          // تحديث الواجهة فوراً
          fetchRequests();
          setSelectedRequest(null);
          setActionType('none');
          setActionText('');

      } catch (error: any) {
          alert(error.message);
      } finally {
          setActionLoading(null);
      }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.details || !user) return;
      setIsSubmitting(true);

      try {
          const initialStatus = user.role === 'project_manager' ? 'manager_approved' : 'pending';
          const { error } = await supabase.from('technician_requests').insert({
              user_id: user.id,
              project_id: formData.project_id || null,
              request_type: formData.type,
              description: formData.details,
              amount: formData.amount ? parseFloat(formData.amount) : null,
              status: initialStatus
          });
          if (error) throw error;
          
          alert(isRTL ? 'تم إنشاء الطلب بنجاح' : 'Request created successfully');
          setIsNewRequestOpen(false);
          fetchRequests();
      } catch (error: any) {
          alert('Error: ' + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- UI Helpers ---
  const filteredRequests = requests.filter(req => {
      const matchesTab = activeTab === 'All' ? true : req.status === activeTab;
      const matchesSearch = req.displayId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            req.requester.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: DBRequestStatus) => {
    switch(status) {
        case 'approved': 
            return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}><ShieldCheck size={12}/> {isRTL ? 'اعتماد نهائي' : 'Final Approved'}</span>;
        case 'manager_approved': 
            return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'text-blue-700 bg-blue-50 border-blue-200'}`}><ArrowUpCircle size={12}/> {isRTL ? 'بانتظار الإدارة' : 'Pending Admin'}</span>;
        case 'rejected': 
            return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'text-red-700 bg-red-50 border-red-200'}`}><XCircle size={12}/> {isRTL ? 'مرفوض' : 'Rejected'}</span>;
        case 'needs_clarification': 
            return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'text-purple-700 bg-purple-50 border-purple-200'}`}><MessageCircleQuestion size={12}/> {isRTL ? 'بانتظار توضيح' : 'Needs Info'}</span>;
        default: 
            return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isDark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'text-amber-700 bg-amber-50 border-amber-200'}`}><Clock size={12}/> {isRTL ? 'انتظار المشرف' : 'Pending PM'}</span>;
    }
  };

  const getRequestLabel = (type: string) => {
      const labels: any = { 'Material': 'طلب مواد', 'Leave': 'إجازة', 'Maintenance': 'صيانة', 'PettyCash': 'عهدة مالية', 'manpower': 'توظيف فني' };
      return isRTL ? (labels[type] || 'أخرى') : type;
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`space-y-6 min-h-screen ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-3xl border shadow-sm backdrop-blur-xl ${cardBg}`}>
        <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
                <Inbox className="text-blue-600" /> {isRTL ? 'سير عمل الطلبات والاعتمادات' : 'Requests Workflow'}
            </h1>
            <p className={`text-sm mt-1 font-medium ${textSub}`}>
                {isAdmin ? (isRTL ? 'إدارة الطلبات، التوضيحات، والاعتمادات النهائية.' : 'Manage requests, clarifications, and final approvals.') : (isRTL ? 'متابعة طلباتك والرد على استفسارات الإدارة.' : 'Track your requests and reply to admin notes.')}
            </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? 'بحث...' : 'Search...'} 
                    className={`w-full rounded-xl py-2 text-sm outline-none transition border ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'} ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
                />
            </div>
            <button onClick={() => setIsNewRequestOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg flex items-center gap-2 transition">
                <Plus size={16}/> {isRTL ? 'طلب جديد' : 'New Request'}
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl w-fit overflow-x-auto ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {[
            { id: 'All', ar: 'الكل', en: 'All' },
            { id: 'pending', ar: 'عند المشرف', en: 'Pending PM' },
            { id: 'manager_approved', ar: 'عند الإدارة', en: 'Pending Admin' },
            { id: 'needs_clarification', ar: 'بانتظار توضيح', en: 'Needs Info' },
            { id: 'approved', ar: 'المعتمدة', en: 'Approved' },
            { id: 'rejected', ar: 'المرفوضة', en: 'Rejected' },
        ].map((tab) => (
            <button 
                key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeTab === tab.id ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
            >
                {isRTL ? tab.ar : tab.en}
            </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className={`rounded-3xl shadow-sm border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
            <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                <thead className={`text-xs font-bold border-b ${isDark ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    <tr>
                        <th className="p-4 px-6">{isRTL ? 'الطلب' : 'Request'}</th>
                        <th className="p-4">{isRTL ? 'المشروع' : 'Project'}</th>
                        <th className="p-4">{isRTL ? 'مقدم الطلب' : 'Requester'}</th>
                        <th className="p-4">{isRTL ? 'التفاصيل' : 'Details'}</th>
                        <th className="p-4">{isRTL ? 'الحالة' : 'Status'}</th>
                        <th className={`p-4 px-6 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-50'}`}>
                    {loading ? (
                        <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" size={30}/></td></tr>
                    ) : filteredRequests.length === 0 ? (
                        <tr><td colSpan={6} className={`p-10 text-center font-medium ${textSub}`}>{isRTL ? 'لا توجد طلبات.' : 'No requests.'}</td></tr>
                    ) : filteredRequests.map(req => (
                        <tr key={req.id} className={`transition group ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                            <td className="p-4 px-6">
                                <div className={`font-bold flex items-center gap-1 ${req.type === 'manpower' ? 'text-purple-500' : textMain}`}>
                                    {req.type === 'manpower' && <UserPlus size={14}/>} {getRequestLabel(req.type)}
                                </div>
                                <div className={`font-mono text-[10px] mt-0.5 ${textSub}`}>{req.displayId}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                    {req.project_name || (isRTL ? 'عام' : 'General')}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className={`font-bold text-xs ${textMain}`}>{req.requester}</div>
                                <div className={`text-[10px] uppercase ${textSub}`}>{req.requester_role}</div>
                            </td>
                            <td className="p-4 max-w-[200px]">
                                {req.type === 'PettyCash' && <span className="text-emerald-500 font-bold ml-1">{req.amount} {isRTL ? 'ر.س' : 'SAR'} - </span>}
                                <span className={`truncate block text-xs ${textSub}`}>{req.details}</span>
                            </td>
                            <td className="p-4">{getStatusBadge(req.status)}</td>
                            <td className={`p-4 px-6 ${isRTL ? 'text-left' : 'text-right'}`}>
                                <button 
                                    onClick={() => { setSelectedRequest(req); setActionType('none'); setActionText(''); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto border ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-blue-600 hover:bg-blue-50'}`}
                                >
                                    <Eye size={14}/> {isRTL ? 'معاينة' : 'View'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- View Request Modal (Interactive Workflow) --- */}
      <AnimatePresence>
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                
                {/* Modal Header */}
                <div className={`p-5 border-b flex justify-between items-center shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(selectedRequest.status)}
                            <p className={`text-xs font-mono ${textSub}`}>{selectedRequest.displayId}</p>
                        </div>
                        <h3 className={`font-black text-lg flex items-center gap-2 ${selectedRequest.type === 'manpower' ? 'text-purple-600 dark:text-purple-400' : textMain}`}>
                            {selectedRequest.type === 'manpower' && <UserPlus size={18}/>}
                            {getRequestLabel(selectedRequest.type)}
                        </h3>
                    </div>
                    <button onClick={() => setSelectedRequest(null)} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`text-xs mb-1 ${textSub}`}>{isRTL ? 'مقدم الطلب' : 'Requester'}</div>
                            <div className={`font-bold text-sm ${textMain}`}>{selectedRequest.requester} <span className="text-[10px] font-normal text-blue-500 bg-blue-500/10 px-1 rounded ml-1">{selectedRequest.requester_role}</span></div>
                        </div>
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className={`text-xs mb-1 ${textSub}`}>{isRTL ? 'المشروع' : 'Project'}</div>
                            <div className={`font-bold text-sm ${textMain} truncate`}>{selectedRequest.project_name || (isRTL ? 'عام' : 'General')}</div>
                        </div>
                    </div>

                    {/* Monetary/Specific Info */}
                    {selectedRequest.type === 'PettyCash' && (
                        <div className={`p-4 rounded-xl border flex justify-between items-center ${isDark ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-100'}`}>
                            <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{isRTL ? 'المبلغ المطلوب' : 'Amount'}</span>
                            <span className={`text-xl font-black ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>{selectedRequest.amount} <span className="text-xs">{isRTL ? 'ر.س' : 'SAR'}</span></span>
                        </div>
                    )}

                    {/* Main Details */}
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <div className={`text-xs font-bold mb-2 ${textSub}`}>{isRTL ? 'تفاصيل الطلب' : 'Details'}</div>
                        <p className={`text-sm leading-relaxed ${textMain}`}>{selectedRequest.details}</p>
                    </div>

                    {/* 🚀 Communication Loop (Clarifications & Rejections) */}
                    {(selectedRequest.rejection_reason || selectedRequest.clarification_note || selectedRequest.clarification_reply) && (
                        <div className="space-y-3 pt-2">
                            {selectedRequest.rejection_reason && (
                                <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
                                    <div className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1"><XCircle size={14}/> {isRTL ? 'سبب الرفض الإداري:' : 'Rejection Reason:'}</div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}>{selectedRequest.rejection_reason}</p>
                                </div>
                            )}

                            {selectedRequest.clarification_note && (
                                <div className={`p-4 rounded-xl border ${isDark ? 'bg-purple-900/10 border-purple-900/30' : 'bg-purple-50 border-purple-200'}`}>
                                    <div className="text-xs font-bold text-purple-500 mb-1 flex items-center gap-1"><MessageCircleQuestion size={14}/> {isRTL ? 'طلب توضيح من الإدارة:' : 'Admin Clarification Note:'}</div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>{selectedRequest.clarification_note}</p>
                                </div>
                            )}

                            {selectedRequest.clarification_reply && (
                                <div className={`p-4 rounded-xl border ml-6 rtl:mr-6 rtl:ml-0 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-300 shadow-sm'}`}>
                                    <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${textSub}`}><CornerDownLeft size={14}/> {isRTL ? 'رد مقدم الطلب:' : 'Submitter Reply:'}</div>
                                    <p className={`text-sm font-medium ${textMain}`}>{selectedRequest.clarification_reply}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 🚀 Dynamic Action Forms */}
                <div className={`border-t shrink-0 ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    
                    {/* Action Input Area (Visible when a button is clicked) */}
                    <AnimatePresence>
                        {actionType !== 'none' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 border-b border-inherit bg-white dark:bg-slate-900">
                                <label className={`text-xs font-bold mb-2 block ${actionType === 'Reject' ? 'text-red-500' : 'text-blue-500'}`}>
                                    {actionType === 'Reject' ? (isRTL ? 'اكتب سبب الرفض:' : 'Rejection Reason:') : 
                                     actionType === 'Clarify' ? (isRTL ? 'اكتب الاستفسار / التوضيح المطلوب:' : 'Clarification Request:') :
                                     (isRTL ? 'اكتب ردك للإدارة:' : 'Your Reply:')}
                                </label>
                                <textarea 
                                    className={`w-full rounded-xl p-3 text-sm outline-none border focus:ring-2 transition min-h-[80px] resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/30' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500/30'}`}
                                    placeholder={isRTL ? "اكتب هنا..." : "Type here..."}
                                    value={actionText}
                                    onChange={(e) => setActionText(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => setActionType('none')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>{isRTL ? 'إلغاء' : 'Cancel'}</button>
                                    <button 
                                        onClick={() => executeWorkflowAction(selectedRequest, actionType, actionText)}
                                        disabled={!actionText.trim() || actionLoading === selectedRequest.id}
                                        className={`flex-[2] py-2 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition ${actionType === 'Reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {actionLoading === selectedRequest.id ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} 
                                        {isRTL ? 'إرسال' : 'Submit'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Base Action Buttons */}
                    {actionType === 'none' && (
                        <div className="p-5 flex flex-wrap gap-3">
                            {/* For Admins / PMs when pending */}
                            {((isAdmin && (selectedRequest.status === 'pending' || selectedRequest.status === 'manager_approved' || selectedRequest.status === 'needs_clarification')) || 
                              (user?.role === 'project_manager' && selectedRequest.status === 'pending')) && (
                                <>
                                    <button onClick={() => setActionType('Reject')} className="flex-1 py-3 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center justify-center gap-2">
                                        <XCircle size={16}/> {isRTL ? 'رفض' : 'Reject'}
                                    </button>
                                    <button onClick={() => setActionType('Clarify')} className="flex-1 py-3 bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400 rounded-xl font-bold text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition flex items-center justify-center gap-2">
                                        <MessageCircleQuestion size={16}/> {isRTL ? 'طلب توضيح' : 'Clarify'}
                                    </button>
                                    <button onClick={() => executeWorkflowAction(selectedRequest, 'Approve')} disabled={actionLoading === selectedRequest.id} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                        {actionLoading === selectedRequest.id ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} 
                                        {isAdmin ? (isRTL ? 'اعتماد نهائي' : 'Final Approve') : (isRTL ? 'رفع للإدارة' : 'Escalate')}
                                    </button>
                                </>
                            )}
                            
                            {/* For Submitters when clarification is needed */}
                            {(user?.id === selectedRequest.submitter_id && selectedRequest.status === 'needs_clarification') && (
                                <button onClick={() => setActionType('Reply')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2">
                                    <MessageSquareReply size={18}/> {isRTL ? 'الرد على الإدارة وإعادة الطلب' : 'Reply & Resubmit'}
                                </button>
                            )}

                            {/* Informational State if no action available */}
                            {(!isAdmin && user?.role !== 'project_manager' && selectedRequest.status !== 'needs_clarification') && (
                                <div className={`w-full text-center py-2 text-sm font-bold ${textSub}`}>
                                    {isRTL ? 'الطلب قيد الإجراء أو مكتمل' : 'Request is being processed or completed'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
      )}
      </AnimatePresence>
      
      {/* New Request Modal Setup exists in code above... */}
    </div>
  );
}