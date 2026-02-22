'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, Clock, Users, Plus, Search, Filter, 
  FileText, CheckCircle2, AlertTriangle, X, Eye, User,
  Globe, Target, Send, Loader2, List, Trash2, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout';

// --- Types ---
type MeetingStatus = 'Upcoming' | 'Completed' | 'Cancelled';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

interface Meeting {
  id: string;
  title: string;
  status: MeetingStatus;
  date: string;
  time: string;
  duration: string;
  organizer_id: string;
  organizer_name: string;
  attendee_ids: string[];
  attendee_names: string[];
  agenda: string;
  expected_outcomes: string;
}

export default function MeetingsSchedulerPage() {
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals States
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60 دقيقة',
    agenda: '',
    outcomes: '',
    attendees: [] as string[]
  });

  // --- 1. Fetch Real Data ---
  const fetchMeetingsAndUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. جلب المستخدمين (لاختيارهم كمدعوين)
      const { data: usersData } = await supabase.from('profiles').select('id, full_name, role');
      if (usersData) setAllUsers(usersData);

      // 2. جلب الاجتماعات (التي أنشأها المستخدم أو المدعو إليها)
      let query = supabase.from('meetings').select('*').order('meeting_date', { ascending: true }).order('meeting_time', { ascending: true });
      
      // إذا لم يكن أدمن، يرى فقط اجتماعاته أو التي دُعي إليها
      if (user.role !== 'admin' && user.role !== 'super_admin') {
          query = query.or(`organizer_id.eq.${user.id},attendee_ids.cs.{${user.id}}`);
      }

      const { data: meetingsData, error } = await query;
      if (error) throw error;

      if (meetingsData) {
          const formatted: Meeting[] = meetingsData.map(m => {
              const org = usersData?.find(u => u.id === m.organizer_id);
              const attNames = m.attendee_ids.map((id: string) => usersData?.find(u => u.id === id)?.full_name || 'Unknown');
              
              return {
                  id: m.id,
                  title: m.title,
                  status: m.status as MeetingStatus,
                  date: m.meeting_date,
                  time: m.meeting_time,
                  duration: m.duration,
                  organizer_id: m.organizer_id,
                  organizer_name: org?.full_name || 'Unknown',
                  attendee_ids: m.attendee_ids,
                  attendee_names: attNames,
                  agenda: m.agenda,
                  expected_outcomes: m.expected_outcomes
              };
          });
          setMeetings(formatted);
      }
    } catch (error: any) {
      console.error("Error fetching meetings:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingsAndUsers();
  }, [user]);

  // --- 2. Create Meeting & Send Notifications ---
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.date || !formData.time || formData.attendees.length === 0) {
        alert(isRTL ? 'الرجاء تعبئة الحقول الأساسية واختيار مدعو واحد على الأقل.' : 'Please fill required fields and select at least one attendee.');
        return;
    }
    setIsSubmitting(true);

    try {
        // 1. إدخال الاجتماع في قاعدة البيانات
        const { data: newMeeting, error } = await supabase.from('meetings').insert({
            title: formData.title,
            meeting_date: formData.date,
            meeting_time: formData.time,
            duration: formData.duration,
            agenda: formData.agenda,
            expected_outcomes: formData.outcomes,
            organizer_id: user.id,
            attendee_ids: formData.attendees,
            status: 'Upcoming'
        }).select('id').single();

        if (error) throw error;

        // 2. 🚀 النظام الذكي: إرسال تنبيهات (إشعارات) لكل المدعوين فوراً
        const notificationsToInsert = formData.attendees.map(attendeeId => ({
            user_id: attendeeId,
            title_ar: 'دعوة لاجتماع جديد',
            title_en: 'New Meeting Invitation',
            message_ar: `تمت دعوتك لاجتماع: ${formData.title} بتاريخ ${formData.date} الساعة ${formData.time}.`,
            message_en: `You are invited to a meeting: ${formData.title} on ${formData.date} at ${formData.time}.`,
            severity: 'Info',
            category: 'Operations',
            entity_type: 'Meeting',
            entity_id: newMeeting.id,
            is_actionable: false
        }));

        if (notificationsToInsert.length > 0) {
            await supabase.from('notifications').insert(notificationsToInsert);
        }

        alert(isRTL ? 'تم جدولة الاجتماع بنجاح وإرسال التنبيهات للمدعوين.' : 'Meeting scheduled and notifications sent successfully.');
        setIsNewMeetingOpen(false);
        setFormData({ title: '', date: '', time: '', duration: '60 دقيقة', agenda: '', outcomes: '', attendees: [] });
        fetchMeetingsAndUsers();

    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MeetingStatus) => {
      try {
          await supabase.from('meetings').update({ status: newStatus }).eq('id', id);
          setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
          if (activeMeeting?.id === id) setActiveMeeting({ ...activeMeeting, status: newStatus });
      } catch (error) {
          console.error("Error updating status", error);
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm(isRTL ? 'تأكيد حذف الاجتماع؟' : 'Confirm deletion?')) {
          try {
              await supabase.from('meetings').delete().eq('id', id);
              setMeetings(prev => prev.filter(m => m.id !== id));
              setIsDetailsOpen(false);
          } catch (error) {
              console.error("Error deleting", error);
          }
      }
  };

  // --- Filtering ---
  const filteredMeetings = meetings.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.organizer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingCount = meetings.filter(m => m.status === 'Upcoming').length;
  const completedCount = meetings.filter(m => m.status === 'Completed').length;

  // --- UI Helpers ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  const getStatusColor = (status: MeetingStatus) => {
    switch(status) {
        case 'Upcoming': return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200';
        case 'Completed': return isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'Cancelled': return isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200';
        default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const toggleAttendee = (id: string) => {
      setFormData(prev => ({
          ...prev,
          attendees: prev.attendees.includes(id) 
            ? prev.attendees.filter(aId => aId !== id) 
            : [...prev.attendees, id]
      }));
  };

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Calendar className="text-blue-600" />
              {isRTL ? 'جدولة وتنسيق الاجتماعات' : 'Meeting Scheduler'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'تحديد المواعيد، الأجندة، المخرجات، وإرسال تنبيهات تلقائية للفرق' : 'Schedule meetings, set agendas, outcomes, and notify teams.'}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <button onClick={() => setIsNewMeetingOpen(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition active:scale-95">
                <Plus size={18} /> {isRTL ? 'جدولة اجتماع' : 'Schedule Meeting'}
             </button>
          </div>
        </div>

        {/* Stats & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 custom-scrollbar">
                <StatBadge isDark={isDark} label={isRTL ? 'القادمة' : 'Upcoming'} count={upcomingCount} color="blue" />
                <StatBadge isDark={isDark} label={isRTL ? 'المكتملة' : 'Completed'} count={completedCount} color="emerald" />
                <StatBadge isDark={isDark} label={isRTL ? 'إجمالي المجدول' : 'Total Scheduled'} count={meetings.length} color="slate" />
            </div>
            <div className="relative w-full md:w-72 shrink-0">
                <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" placeholder={isRTL ? 'بحث...' : 'Search...'} 
                    className={`w-full rounded-xl py-2 text-sm outline-none transition border ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* --- Meetings Grid --- */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
            <div className={`col-span-full text-center py-20 flex flex-col items-center gap-3 ${textSub}`}>
                <Loader2 size={30} className="animate-spin text-blue-500"/>
                {isRTL ? 'جاري تحميل المواعيد...' : 'Loading schedules...'}
            </div>
        ) : filteredMeetings.length === 0 ? (
            <div className={`col-span-full text-center py-20 rounded-3xl border border-dashed ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-300'}`}>
                <Calendar size={40} className={`mx-auto mb-2 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}/>
                <p className={`font-bold ${textSub}`}>{isRTL ? 'لا توجد اجتماعات مجدولة' : 'No meetings scheduled'}</p>
            </div>
        ) : (
            filteredMeetings.map(meeting => (
                <div key={meeting.id} className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition relative flex flex-col ${cardBg} ${isDark ? 'hover:border-slate-600' : 'hover:border-blue-300'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Users size={24}/>
                            </div>
                            <div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-1 block w-fit ${getStatusColor(meeting.status)}`}>
                                    {isRTL ? {'Upcoming':'قادم','Completed':'مكتمل','Cancelled':'ملغي'}[meeting.status] : meeting.status}
                                </span>
                                <h3 className={`font-bold text-lg leading-tight line-clamp-1 ${textMain}`} title={meeting.title}>{meeting.title}</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`space-y-2 mb-6 flex-1 text-sm ${textSub}`}>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'}/> <span className="font-medium text-blue-500">{meeting.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'}/> {meeting.time} ({meeting.duration})
                        </div>
                        <div className="flex items-center gap-2 truncate">
                            <User size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} shrink-0/> {isRTL ? 'المنظم:' : 'By:'} {meeting.organizer_name}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="flex -space-x-2 rtl:space-x-reverse">
                                {meeting.attendee_names.slice(0, 3).map((name, i) => (
                                    <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${isDark ? 'bg-slate-700 text-white border-slate-900' : 'bg-slate-200 text-slate-700 border-white'}`} title={name}>
                                        {name.charAt(0)}
                                    </div>
                                ))}
                                {meeting.attendee_names.length > 3 && (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${isDark ? 'bg-slate-800 text-slate-400 border-slate-900' : 'bg-slate-100 text-slate-500 border-white'}`}>
                                        +{meeting.attendee_names.length - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs">{meeting.attendee_names?.length || meeting.attendee_ids.length} {isRTL ? 'مدعوين' : 'Invitees'}</span>
                        </div>
                    </div>

                    <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                        <button 
                            onClick={() => { setActiveMeeting(meeting); setIsDetailsOpen(true); }}
                            className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition border ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-blue-600 hover:bg-blue-50'}`}
                        >
                            <FileText size={16}/> {isRTL ? 'التفاصيل والمخرجات' : 'Details & Outcomes'}
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- Details Drawer --- */}
      <AnimatePresence>
      {isDetailsOpen && activeMeeting && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className={`w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                
                {/* Drawer Header */}
                <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-2 block w-fit ${getStatusColor(activeMeeting.status)}`}>
                            {isRTL ? {'Upcoming':'قادم','Completed':'مكتمل','Cancelled':'ملغي'}[activeMeeting.status] : activeMeeting.status}
                        </span>
                        <h2 className={`text-2xl font-black ${textMain}`}>{activeMeeting.title}</h2>
                        <div className={`flex flex-wrap items-center gap-4 mt-3 text-sm font-medium ${textSub}`}>
                            <span className="flex items-center gap-1.5"><Calendar size={16}/> {activeMeeting.date}</span>
                            <span className="flex items-center gap-1.5"><Clock size={16}/> {activeMeeting.time} ({activeMeeting.duration})</span>
                            <span className="flex items-center gap-1.5"><User size={16}/> {activeMeeting.organizer_name}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsDetailsOpen(false)} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-200 text-slate-500 shadow-sm border border-slate-100'}`}><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Agenda */}
                    <div>
                        <h3 className={`font-black text-sm flex items-center gap-2 mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            <List size={18}/> {isRTL ? 'أجندة ومحاور الاجتماع' : 'Meeting Agenda'}
                        </h3>
                        <div className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-slate-700'}`}>
                            {activeMeeting.agenda || (isRTL ? 'لم يتم كتابة أجندة' : 'No agenda provided')}
                        </div>
                    </div>

                    {/* Expected Outcomes */}
                    <div>
                        <h3 className={`font-black text-sm flex items-center gap-2 mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            <Target size={18}/> {isRTL ? 'المخرجات المتوقعة' : 'Expected Outcomes'}
                        </h3>
                        <div className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'bg-emerald-900/10 border-emerald-900/30 text-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                            {activeMeeting.expected_outcomes || (isRTL ? 'غير محدد' : 'Not specified')}
                        </div>
                    </div>

                    {/* Attendees List */}
                    <div>
                        <h3 className={`font-black text-sm flex items-center gap-2 mb-3 ${textMain}`}>
                            <Users size={18} className={textSub}/> {isRTL ? 'المدعوين' : 'Invitees'} ({activeMeeting.attendee_names.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {activeMeeting.attendee_names.map((name, i) => (
                                <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{name.charAt(0)}</div>
                                    <span className="truncate">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Controls (Organizer or Admin only) */}
                {(user?.id === activeMeeting.organizer_id || user?.role === 'admin' || user?.role === 'super_admin') && (
                    <div className={`p-5 border-t flex gap-3 ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                        {activeMeeting.status === 'Upcoming' && (
                            <>
                                <button onClick={() => handleUpdateStatus(activeMeeting.id, 'Completed')} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 transition">
                                    <CheckCircle2 size={18}/> {isRTL ? 'تحديد كمكتمل' : 'Mark Completed'}
                                </button>
                                <button onClick={() => handleUpdateStatus(activeMeeting.id, 'Cancelled')} className={`flex-1 py-3 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-200'}`}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                            </>
                        )}
                        <button onClick={() => handleDelete(activeMeeting.id)} className={`p-3 rounded-xl transition ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="Delete">
                            <Trash2 size={20}/>
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* --- New Meeting Modal (Scheduling & Invites) --- */}
      <AnimatePresence>
      {isNewMeetingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                
                <div className={`p-6 border-b flex justify-between items-center shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                    <h3 className={`font-black text-lg flex items-center gap-2 ${textMain}`}>
                        <Calendar className="text-blue-600"/> {isRTL ? 'جدولة اجتماع وإرسال دعوات' : 'Schedule & Invite'}
                    </h3>
                    <button onClick={() => setIsNewMeetingOpen(false)} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>
                
                <form onSubmit={handleCreateMeeting} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    
                    {/* Basic Info */}
                    <div>
                        <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'موضوع الاجتماع' : 'Meeting Title'}</label>
                        <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none transition text-sm font-bold border focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'}`} placeholder={isRTL ? "مثال: مراجعة خطة تسليم مشروع الملقا" : "e.g. Project Delivery Review"} />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'التاريخ' : 'Date'}</label>
                            <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'الوقت' : 'Time'}</label>
                            <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'المدة' : 'Duration'}</label>
                            <select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                <option value="30 دقيقة">30 Mins</option>
                                <option value="60 دقيقة">1 Hour</option>
                                <option value="90 دقيقة">1.5 Hours</option>
                                <option value="120 دقيقة">2 Hours</option>
                            </select>
                        </div>
                    </div>

                    {/* Invites (Users Checklist) */}
                    <div>
                        <label className={`text-xs font-bold mb-1.5 block flex justify-between ${textSub}`}>
                            <span>{isRTL ? 'اختيار المدعوين' : 'Select Invitees'}</span>
                            <span className="text-blue-500">{formData.attendees.length} {isRTL ? 'مختار' : 'selected'}</span>
                        </label>
                        <div className={`h-32 overflow-y-auto rounded-xl border p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            {allUsers.map(u => (
                                <label key={u.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border ${formData.attendees.includes(u.id) ? (isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200') : (isDark ? 'border-transparent hover:bg-slate-800' : 'border-transparent hover:bg-white')}`}>
                                    <input type="checkbox" checked={formData.attendees.includes(u.id)} onChange={() => toggleAttendee(u.id)} className="w-4 h-4 accent-blue-600 rounded" />
                                    <div>
                                        <div className={`text-sm font-bold ${textMain}`}>{u.full_name}</div>
                                        <div className={`text-[10px] ${textSub}`}>{u.role}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Agenda & Outcomes */}
                    <div>
                        <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'الأجندة ومحاور النقاش' : 'Agenda'}</label>
                        <textarea required value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none text-sm resize-none h-24 border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`} placeholder={isRTL ? "1. مراجعة كذا...\n2. مناقشة كذا..." : "1. Review...\n2. Discuss..."}></textarea>
                    </div>
                    <div>
                        <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'المخرجات المتوقعة' : 'Expected Outcomes'}</label>
                        <textarea required value={formData.outcomes} onChange={e => setFormData({...formData, outcomes: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none text-sm resize-none h-20 border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} placeholder={isRTL ? "مثال: اعتماد الخطة وتوزيع المهام للمرحلة القادمة" : "e.g. Plan approval and task distribution"}></textarea>
                    </div>

                    <div className={`pt-5 mt-2 border-t flex gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <button type="button" onClick={() => setIsNewMeetingOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{isRTL ? 'إلغاء' : 'Cancel'}</button>
                        <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} {isRTL ? 'حفظ وإرسال التنبيهات' : 'Save & Notify'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
}

// --- Helper Component ---
function StatBadge({ label, count, color, isDark }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: isDark ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        slate: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200',
    };
    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition shrink-0 ${colors[color]}`}>
            <span className="text-xl font-black">{count}</span>
            <span className="text-xs font-bold opacity-80">{label}</span>
        </div>
    );
}