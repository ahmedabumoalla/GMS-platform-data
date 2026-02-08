'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, Info, AlertTriangle, X, Search, 
  Filter, Trash2, Eye, Check, Clock, FileText, User, 
  ArrowRight, ShieldAlert, Activity, Globe, MoreHorizontal,
  Settings, CheckSquare
} from 'lucide-react';

// --- Types ---
type Severity = 'Critical' | 'Warning' | 'Info' | 'Success';
type Category = 'Operations' | 'QC' | 'Finance' | 'System' | 'HR';
type Status = 'Unread' | 'Read' | 'Archived';

interface NotificationLog {
  action: string;
  user: string;
  time: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string; // Relative time
  timestamp: string; // Exact date
  severity: Severity;
  category: Category;
  status: Status;
  actor: string; // Who triggered it
  role: string;
  linkedEntity: { type: string; id: string }; // e.g., Project ID
  isActionable: boolean;
  auditLog: NotificationLog[];
}

export default function NotificationsPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeFilter, setActiveFilter] = useState<'All' | Severity>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Mock Data ---
  useEffect(() => {
    setTimeout(() => {
      setNotifications([
        { 
          id: 'NTF-001', title: lang === 'ar' ? 'تجاوز في درجة حرارة الكابل' : 'Cable Temperature Critical', 
          message: lang === 'ar' ? 'تم رصد ارتفاع حرج في درجة حرارة الكابل الرئيسي قطاع 7.' : 'Critical temperature rise detected in Main Cable Sector 7.',
          time: '10m ago', timestamp: '2024-02-08 09:30 AM', severity: 'Critical', category: 'Operations', status: 'Unread',
          actor: 'IoT System', role: 'Automated', linkedEntity: { type: 'Asset', id: 'CBL-774' }, isActionable: true,
          auditLog: [{ action: 'Created', user: 'System', time: '09:30 AM' }]
        },
        { 
          id: 'NTF-002', title: lang === 'ar' ? 'فشل اختبار الجودة' : 'QC Inspection Failed', 
          message: lang === 'ar' ? 'تم رفض عينة الخرسانة للمشروع السكني بسبب عدم المطابقة.' : 'Concrete sample rejected due to non-compliance.',
          time: '1h ago', timestamp: '2024-02-08 08:15 AM', severity: 'Warning', category: 'QC', status: 'Unread',
          actor: 'Eng. Omar', role: 'QC Inspector', linkedEntity: { type: 'Inspection', id: 'INS-204' }, isActionable: true,
          auditLog: [{ action: 'Reported', user: 'Eng. Omar', time: '08:15 AM' }]
        },
        { 
          id: 'NTF-003', title: lang === 'ar' ? 'اعتماد المستخلص المالي' : 'Payment Certificate Approved', 
          message: lang === 'ar' ? 'تم اعتماد المستخلص رقم 450 وإرساله للمالية.' : 'Payment cert #450 approved and sent to finance.',
          time: '2h ago', timestamp: '2024-02-08 07:00 AM', severity: 'Success', category: 'Finance', status: 'Read',
          actor: 'Finance Mgr', role: 'Management', linkedEntity: { type: 'Invoice', id: 'INV-450' }, isActionable: false,
          auditLog: [{ action: 'Approved', user: 'Finance Mgr', time: '07:00 AM' }]
        },
        { 
          id: 'NTF-004', title: lang === 'ar' ? 'تذكير: اجتماع التخطيط' : 'Reminder: Planning Meeting', 
          message: lang === 'ar' ? 'الاجتماع الأسبوعي للفريق سيبدأ قريباً.' : 'Weekly team planning meeting starting soon.',
          time: '1d ago', timestamp: '2024-02-07 10:00 AM', severity: 'Info', category: 'HR', status: 'Read',
          actor: 'Admin', role: 'Coordinator', linkedEntity: { type: 'Meeting', id: 'MTG-101' }, isActionable: false,
          auditLog: []
        }
      ]);
      setLoading(false);
    }, 600);
  }, [lang]);

  // --- Actions ---
  const handleMarkAsRead = (id?: string) => {
    if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
        if (selectedNotif?.id === id) setSelectedNotif(prev => prev ? {...prev, status: 'Read'} : null);
    } else {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
        alert(lang === 'ar' ? 'تم تحديد الكل كمقروء' : 'All marked as read');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الإشعار؟' : 'Delete this notification?')) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedNotif(null);
    }
  };

  const handleAction = (type: string) => {
    if (!selectedNotif) return;
    
    // محاكاة إضافة سجل للتدقيق
    const newLog = { action: type, user: 'You', time: new Date().toLocaleTimeString() };
    const updatedNotif = { 
        ...selectedNotif, 
        auditLog: [newLog, ...selectedNotif.auditLog],
        status: 'Read' as Status 
    };

    setNotifications(prev => prev.map(n => n.id === selectedNotif.id ? updatedNotif : n));
    setSelectedNotif(updatedNotif);
    
    alert(lang === 'ar' ? `تم تنفيذ الإجراء: ${type}` : `Action executed: ${type}`);
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  // Filter Logic
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || n.severity === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;
  const criticalCount = notifications.filter(n => n.severity === 'Critical').length;

  // Helpers
  const getSeverityIcon = (severity: Severity) => {
    switch(severity) {
        case 'Critical': return <ShieldAlert size={20} className="text-red-600"/>;
        case 'Warning': return <AlertTriangle size={20} className="text-amber-600"/>;
        case 'Success': return <CheckCircle2 size={20} className="text-green-600"/>;
        default: return <Info size={20} className="text-blue-600"/>;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch(severity) {
        case 'Critical': return 'bg-red-50 border-red-100 border-r-4 border-r-red-500';
        case 'Warning': return 'bg-amber-50 border-amber-100 border-r-4 border-r-amber-500';
        case 'Success': return 'bg-green-50 border-green-100';
        default: return 'bg-white border-slate-100';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Command Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Bell className="text-blue-600" />
              {lang === 'ar' ? 'مركز العمليات والإشعارات' : 'Operational Alerts Center'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'متابعة التنبيهات الحرجة، الأنشطة، وتحديثات النظام' : 'Monitor critical alerts, activities, and system updates'}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <button onClick={() => handleMarkAsRead()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95">
                <CheckSquare size={16} /> {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All Read'}
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            <StatBadge label={lang === 'ar' ? 'غير مقروء' : 'Unread'} count={unreadCount} color="blue" active={true}/>
            <StatBadge label={lang === 'ar' ? 'حرج جداً' : 'Critical'} count={criticalCount} color="red" active={criticalCount > 0}/>
            <div className="h-10 w-px bg-slate-200 mx-2"></div>
            {/* Filters */}
            {['All', 'Critical', 'Warning', 'Info', 'Success'].map(f => (
                <button 
                    key={f} 
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${
                        activeFilter === f 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>

        {/* Search */}
        <div className="relative">
            <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
            <input 
                type="text" 
                placeholder={lang === 'ar' ? 'بحث في الإشعارات...' : 'Search notifications...'} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-blue-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* --- Section 2: Notification Feed --- */}
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحديث التنبيهات...' : 'Updating alerts...'}</div>
        ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="text-slate-300 mb-2"><Bell size={40} className="mx-auto"/></div>
                <p className="text-slate-500 font-bold">{lang === 'ar' ? 'لا توجد إشعارات مطابقة' : 'No matching notifications'}</p>
            </div>
        ) : (
            filteredNotifications.map(notif => (
                <div 
                    key={notif.id} 
                    onClick={() => { setSelectedNotif(notif); handleMarkAsRead(notif.id); }}
                    className={`group relative p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${getSeverityColor(notif.severity)} ${notif.status === 'Unread' ? 'shadow-sm' : 'opacity-80 hover:opacity-100'}`}
                >
                    <div className="flex gap-4 items-start">
                        <div className="mt-1">{getSeverityIcon(notif.severity)}</div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">{notif.category}</span>
                                    <h3 className={`text-sm font-bold truncate ${notif.status === 'Unread' ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h3>
                                    {notif.status === 'Unread' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{notif.time}</span>
                            </div>
                            
                            <p className="text-sm text-slate-600 line-clamp-1 group-hover:line-clamp-none transition-all">{notif.message}</p>
                            
                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><User size={12}/> {notif.actor}</span>
                                <span className="flex items-center gap-1"><Activity size={12}/> {notif.linkedEntity.type} #{notif.linkedEntity.id}</span>
                            </div>
                        </div>

                        {/* Quick Actions (Visible on Hover) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 self-center">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg">
                                <Trash2 size={16}/>
                            </button>
                            <button className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg">
                                <ArrowRight size={16} className={lang === 'ar' ? 'rotate-180' : ''}/>
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- Section 3: Details Drawer --- */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div className="flex gap-3">
                        <div className="mt-1">{getSeverityIcon(selectedNotif.severity)}</div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{selectedNotif.id}</div>
                            <h2 className="font-bold text-lg text-slate-900 leading-tight">{selectedNotif.title}</h2>
                        </div>
                    </div>
                    <button onClick={() => setSelectedNotif(null)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Main Message */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-slate-700 leading-relaxed">
                        {selectedNotif.message}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1">{lang === 'ar' ? 'المصدر' : 'Source'}</div>
                            <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <User size={14}/> {selectedNotif.actor}
                            </div>
                            <div className="text-[10px] text-slate-400">{selectedNotif.role}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1">{lang === 'ar' ? 'الوقت' : 'Timestamp'}</div>
                            <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <Clock size={14}/> {selectedNotif.timestamp}
                            </div>
                        </div>
                    </div>

                    {/* Linked Entity */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{lang === 'ar' ? 'الجهة المرتبطة' : 'Linked Entity'}</h4>
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg"><FileText size={18} className="text-slate-600"/></div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800">{selectedNotif.linkedEntity.type}</div>
                                    <div className="text-xs font-mono text-blue-600">{selectedNotif.linkedEntity.id}</div>
                                </div>
                            </div>
                            <button className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700">
                                {lang === 'ar' ? 'فتح' : 'Open'}
                            </button>
                        </div>
                    </div>

                    {/* Audit Log */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{lang === 'ar' ? 'سجل النشاط' : 'Audit Trail'}</h4>
                        <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                            {selectedNotif.auditLog.map((log, i) => (
                                <div key={i} className="pl-3 relative">
                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                    <div className="text-xs text-slate-600">
                                        <span className="font-bold">{log.action}</span> by {log.user}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{log.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
                    {selectedNotif.isActionable ? (
                        <>
                            <button onClick={() => handleAction('Resolve')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center justify-center gap-2">
                                <Check size={16}/> {lang === 'ar' ? 'معالجة / اعتماد' : 'Resolve / Approve'}
                            </button>
                            <button onClick={() => handleAction('Escalate')} className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 flex items-center justify-center gap-2">
                                <ShieldAlert size={16}/> {lang === 'ar' ? 'تصعيد' : 'Escalate'}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => handleAction('Archive')} className="w-full py-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-300">
                            {lang === 'ar' ? 'أرشفة' : 'Archive'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatBadge({ label, count, color, active }: any) {
    const colors: any = {
        blue: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600',
        red: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600',
    };
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${active ? 'shadow-md border-transparent' : 'border-slate-200'} ${colors[color]}`}>
            <span className="text-lg font-black">{count}</span>
            <span className={`text-xs font-bold ${active ? 'opacity-90' : 'opacity-70'}`}>{label}</span>
        </div>
    );
}