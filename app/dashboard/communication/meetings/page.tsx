'use client';

import { useState, useEffect } from 'react';
import { 
  Video, Calendar, Clock, Users, Plus, Link as LinkIcon, 
  Search, Filter, MoreVertical, FileText, CheckCircle2, 
  AlertTriangle, BrainCircuit, Mic, Monitor, PhoneOff, 
  MessageSquare, ShieldCheck, X, ChevronRight, ChevronLeft,
  PlayCircle, StopCircle, FileBadge, Globe, Download, Save,
  User, List // ✅ تم إضافة User و List الناقصة
} from 'lucide-react';

// --- Types ---
type MeetingStatus = 'Live' | 'Upcoming' | 'Completed' | 'Cancelled';
type Sensitivity = 'Internal' | 'Confidential' | 'Public';

interface ActionItem {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  status: 'Pending' | 'Completed';
}

interface Meeting {
  id: string;
  title: string;
  type: 'Video' | 'Hybrid';
  status: MeetingStatus;
  date: string;
  time: string;
  duration: string;
  organizer: string;
  department: string;
  attendees: number;
  reference: string; 
  sensitivity: Sensitivity;
  agenda: string[];
  aiReport?: {
    summary: string;
    decisions: string[];
    risks: string[];
    actionItems: ActionItem[];
  };
}

export default function MeetingsPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Modals/Drawers
  const [isLiveRoomOpen, setIsLiveRoomOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);

  // Live Room Simulation States
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);

  // --- Mock Data ---
  useEffect(() => {
    setTimeout(() => {
      setMeetings([
        { 
          id: 'MTG-101', title: lang === 'ar' ? 'الاجتماع الأسبوعي للمشاريع' : 'Weekly Project Review', 
          type: 'Video', status: 'Live', date: 'Today', time: '10:00 - 11:00', duration: '60m',
          organizer: 'Eng. Ahmed', department: 'Operations', attendees: 8, reference: 'PRJ-2024-001', sensitivity: 'Internal',
          agenda: ['Review progress', 'Safety incidents', 'Next week plan'],
          aiReport: {
            summary: 'Meeting focused on delays in Sector 4. Safety record is clean.',
            decisions: ['Approve overtime for Team A', 'Pause excavation in Zone B'],
            risks: ['Material shortage expected next week'],
            actionItems: [
              { id: 'ACT-1', task: 'Order cement', owner: 'Procurement', dueDate: '2024-02-12', status: 'Pending' }
            ]
          }
        },
        { 
          id: 'MTG-102', title: lang === 'ar' ? 'مراجعة الميزانية الربع سنوية' : 'Quarterly Budget Review', 
          type: 'Video', status: 'Upcoming', date: 'Tomorrow', time: '02:00 - 03:30', duration: '90m',
          organizer: 'Finance Dept', department: 'Finance', attendees: 4, reference: 'FIN-Q1', sensitivity: 'Confidential',
          agenda: ['Q1 Variance', 'Q2 Forecast', 'Cost saving initiatives']
        },
        { 
          id: 'MTG-103', title: lang === 'ar' ? 'مقابلة مهندسين جدد' : 'New Engineers Interview', 
          type: 'Video', status: 'Completed', date: 'Yesterday', time: '09:00 - 12:00', duration: '180m',
          organizer: 'HR Dept', department: 'HR', attendees: 3, reference: 'HR-REC-24', sensitivity: 'Internal',
          agenda: ['Candidate A', 'Candidate B', 'Final scoring'],
          aiReport: {
            summary: 'Interviewed 2 candidates. Candidate A showed strong technical skills.',
            decisions: ['Proceed with offer for Candidate A'],
            risks: [],
            actionItems: [
              { id: 'ACT-2', task: 'Prepare offer letter', owner: 'HR', dueDate: '2024-02-10', status: 'Completed' }
            ]
          }
        },
      ]);
      setLoading(false);
    }, 600);
  }, [lang]);

  // --- Actions ---
  const handleJoinMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting);
    setIsLiveRoomOpen(true);
    setLiveTranscript([lang === 'ar' ? 'النظام: بدأ تسجيل الاجتماع...' : 'System: Recording started...']);
  };

  const handleViewDetails = (meeting: Meeting) => {
    setActiveMeeting(meeting);
    setIsDetailsOpen(true);
  };

  const handleCreateMeeting = () => {
    setIsNewMeetingOpen(false);
    alert(lang === 'ar' ? 'تم جدولة الاجتماع بنجاح وإرسال الدعوات' : 'Meeting scheduled and invites sent');
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const getStatusColor = (status: MeetingStatus) => {
    switch(status) {
        case 'Live': return 'bg-red-50 text-red-600 border-red-200 animate-pulse';
        case 'Upcoming': return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Command Center Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Video className="text-blue-600" />
              {lang === 'ar' ? 'مركز عمليات الاجتماعات' : 'Meeting Ops Command Center'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'إدارة وحوكمة الاجتماعات الداخلية مع التحليل الذكي' : 'Internal meeting governance, recording, and AI analysis'}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <button onClick={() => setIsNewMeetingOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center gap-2 shadow-lg transition active:scale-95">
                <Plus size={18} /> {lang === 'ar' ? 'اجتماع جديد' : 'New Meeting'}
             </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'اجتماعات اليوم' : 'Meetings Today'} value="5" color="blue" icon={Calendar} />
            <StatCard label={lang === 'ar' ? 'جاري الآن' : 'Live Now'} value="1" color="red" icon={Video} />
            <StatCard label={lang === 'ar' ? 'بانتظار التقرير' : 'Pending Reports'} value="2" color="amber" icon={FileText} />
            <StatCard label={lang === 'ar' ? 'المهام المفتوحة' : 'Open Actions'} value="12" color="emerald" icon={CheckCircle2} />
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                <input type="text" placeholder={lang === 'ar' ? 'بحث في الاجتماعات، الأجندة...' : 'Search meetings, agenda...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                <Filter size={18} />
            </button>
        </div>
      </div>

      {/* --- Section 2: Meeting Cards Grid --- */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل جدول الاجتماعات...' : 'Loading schedule...'}</div>
        ) : meetings.map(meeting => (
            <div key={meeting.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition relative overflow-hidden group flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            {meeting.type === 'Video' ? <Video size={24}/> : <Users size={24}/>}
                        </div>
                        <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(meeting.status)} flex items-center gap-1 w-fit mb-1`}>
                                {meeting.status === 'Live' && <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>}
                                {meeting.status}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">{meeting.id}</div>
                        </div>
                    </div>
                    {/* ✅ تم الإصلاح: إزالة الخاصية title من الأيقونة ووضعها في div */}
                    {meeting.sensitivity === 'Confidential' && (
                        <div title="Confidential">
                            <ShieldCheck size={16} className="text-amber-500"/>
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{meeting.title}</h3>
                
                {/* Meta */}
                <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={16} className="text-slate-400"/> {meeting.time} ({meeting.duration})
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={16} className="text-slate-400"/> {meeting.attendees} {lang === 'ar' ? 'مشارك' : 'Attendees'}
                    </div>
                    
                    {/* ✅ استخدام User المستوردة بشكل صحيح */}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User size={16} className="text-slate-400"/> {meeting.organizer}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mt-2">
                        <LinkIcon size={12}/> {meeting.reference}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                    {meeting.status === 'Live' ? (
                        <button 
                            onClick={() => handleJoinMeeting(meeting)}
                            className="col-span-2 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-100 flex items-center justify-center gap-2 transition active:scale-95"
                        >
                            <PlayCircle size={16}/> {lang === 'ar' ? 'انضمام الآن' : 'Join Live'}
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => handleViewDetails(meeting)}
                                className="col-span-2 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2 transition"
                            >
                                {meeting.status === 'Completed' ? <FileBadge size={16}/> : <FileText size={16}/>}
                                {meeting.status === 'Completed' ? (lang === 'ar' ? 'عرض التقرير الذكي' : 'View AI Report') : (lang === 'ar' ? 'التفاصيل والأجندة' : 'Details & Agenda')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        ))}
      </div>

      {/* --- 3. Live Room Interface (Full Screen Modal) --- */}
      {isLiveRoomOpen && activeMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Room Header */}
            <div className="h-16 border-b border-slate-700 flex justify-between items-center px-6 bg-slate-800/50 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div className="bg-red-600 px-3 py-1 rounded text-xs font-bold animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full"></span> {activeMeeting.duration}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">{activeMeeting.title}</h2>
                        <p className="text-xs text-slate-400">{activeMeeting.id} • {activeMeeting.reference}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-800">
                        <ShieldCheck size={12}/> {lang === 'ar' ? 'مشفر' : 'Encrypted'}
                    </span>
                </div>
            </div>

            {/* Room Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Stage */}
                <div className="flex-1 p-4 grid grid-cols-2 gap-4 relative">
                    <div className="bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-700">
                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">A</div>
                        <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-xs">Ahmed (Host)</div>
                    </div>
                    <div className="bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-700">
                        <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold">S</div>
                        <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-xs">Saeed (Site)</div>
                    </div>
                    
                    <div className="absolute top-4 right-4 w-64 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 text-sm">
                        <div className="flex items-center gap-2 text-purple-400 font-bold mb-2 text-xs uppercase">
                            <BrainCircuit size={14}/> {lang === 'ar' ? 'تحليل مباشر' : 'Live Analysis'}
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                            {lang === 'ar' ? 'تم رصد قرار: اعتماد العمل الإضافي. هل تريد إضافته للمحضر؟' : 'Decision detected: Overtime approved. Add to minutes?'}
                        </p>
                        <button className="mt-2 text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded w-full transition">
                            {lang === 'ar' ? 'إضافة' : 'Add to Log'}
                        </button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-700 font-bold flex justify-between">
                        <span>{lang === 'ar' ? 'الأجندة' : 'Agenda'}</span>
                        <span className="text-xs text-slate-400">1/3</span>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {activeMeeting.agenda.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                <input type="checkbox" checked={i === 0} className="accent-blue-600 w-4 h-4"/>
                                <span className={i === 0 ? 'line-through text-slate-500' : ''}>{item}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-700 text-xs text-slate-400">
                        {liveTranscript[0]}
                    </div>
                </div>
            </div>

            {/* Room Footer Controls */}
            <div className="h-20 bg-slate-900 border-t border-slate-700 flex justify-center items-center gap-4">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {isMuted ? <Mic size={24} className="opacity-50"/> : <Mic size={24}/>}
                </button>
                <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-4 rounded-full transition ${!isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {isVideoOn ? <Video size={24}/> : <Video size={24} className="opacity-50"/>}
                </button>
                <button className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 text-green-400">
                    <Monitor size={24}/>
                </button>
                <div className="w-px h-8 bg-slate-700 mx-2"></div>
                <button onClick={() => setIsLiveRoomOpen(false)} className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 font-bold text-white shadow-lg shadow-red-900/50 flex items-center gap-2">
                    <PhoneOff size={20}/> {lang === 'ar' ? 'إنهاء الاجتماع' : 'End Meeting'}
                </button>
            </div>
        </div>
      )}

      {/* --- 4. Meeting Details & AI Report Drawer --- */}
      {isDetailsOpen && activeMeeting && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(activeMeeting.status)}`}>{activeMeeting.status}</span>
                            <span className="text-xs text-slate-500 font-mono">{activeMeeting.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{activeMeeting.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={14}/> {activeMeeting.date}</span>
                            <span className="flex items-center gap-1"><Clock size={14}/> {activeMeeting.time}</span>
                            <span className="flex items-center gap-1"><User size={14}/> {activeMeeting.organizer}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* AI Executive Summary */}
                    {activeMeeting.aiReport && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-3 text-purple-700 font-bold">
                                <BrainCircuit size={20}/> {lang === 'ar' ? 'الملخص التنفيذي (AI)' : 'Executive Summary (AI)'}
                            </div>
                            <p className="text-slate-700 leading-relaxed text-sm">{activeMeeting.aiReport.summary}</p>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="bg-white/60 p-3 rounded-xl">
                                    <div className="text-xs font-bold text-green-700 uppercase mb-2">{lang === 'ar' ? 'القرارات' : 'Decisions'}</div>
                                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                        {activeMeeting.aiReport.decisions.map((d, i) => <li key={i}>{d}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-white/60 p-3 rounded-xl">
                                    <div className="text-xs font-bold text-red-700 uppercase mb-2">{lang === 'ar' ? 'المخاطر' : 'Risks'}</div>
                                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                        {activeMeeting.aiReport.risks.length > 0 ? activeMeeting.aiReport.risks.map((r, i) => <li key={i}>{r}</li>) : <span className="text-slate-400 italic">None</span>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Items Table */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-blue-600"/> {lang === 'ar' ? 'المهام والتوصيات' : 'Action Items'}
                        </h3>
                        {activeMeeting.aiReport?.actionItems ? (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left rtl:text-right">
                                    <thead className="bg-slate-50 font-bold text-slate-500">
                                        <tr>
                                            <th className="p-3">{lang === 'ar' ? 'المهمة' : 'Task'}</th>
                                            <th className="p-3">{lang === 'ar' ? 'المسؤول' : 'Owner'}</th>
                                            <th className="p-3">{lang === 'ar' ? 'الموعد' : 'Due Date'}</th>
                                            <th className="p-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeMeeting.aiReport.actionItems.map((action) => (
                                            <tr key={action.id}>
                                                <td className="p-3 font-medium text-slate-800">{action.task}</td>
                                                <td className="p-3 text-slate-600">{action.owner}</td>
                                                <td className="p-3 text-slate-500">{action.dueDate}</td>
                                                <td className="p-3"><span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">{action.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <div className="text-slate-400 text-sm italic text-center p-4 bg-slate-50 rounded-xl">No actions recorded yet.</div>}
                    </div>

                    {/* Agenda (✅ تم استخدام List بشكل صحيح) */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <List size={18} className="text-slate-500"/> {lang === 'ar' ? 'جدول الأعمال' : 'Agenda'}
                        </h3>
                        <div className="space-y-2">
                            {activeMeeting.agenda.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                    <span className="text-sm text-slate-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2">
                        <Download size={16}/> {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                    </button>
                    <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                        <CheckCircle2 size={16}/> {lang === 'ar' ? 'اعتماد المحضر' : 'Approve Minutes'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- 5. New Meeting Modal (Simple Form) --- */}
      {isNewMeetingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'جدولة اجتماع جديد' : 'Schedule New Meeting'}</h3>
                    <button onClick={() => setIsNewMeetingOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'عنوان الاجتماع' : 'Meeting Title'}</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-bold text-sm" placeholder="e.g. Project Kickoff" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'التاريخ' : 'Date'}</label>
                            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'الوقت' : 'Time'}</label>
                            <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'الأجندة (بند في كل سطر)' : 'Agenda (one per line)'}</label>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm h-24 resize-none"></textarea>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button onClick={() => setIsNewMeetingOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={handleCreateMeeting} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg">{lang === 'ar' ? 'جدولة وإرسال' : 'Schedule & Send'}</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs font-bold text-slate-400">{label}</div>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}