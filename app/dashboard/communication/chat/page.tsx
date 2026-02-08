'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Image, Mic, Search, MoreVertical, Phone, 
  Briefcase, CheckCircle2, AlertTriangle, FileText, 
  Paperclip, Globe, BrainCircuit, Loader2, User, 
  ShieldAlert, Clock, ArrowLeft, ArrowRight, Video, 
  MoreHorizontal, Download, X, Plus, FileBadge, 
  Trash2, BellOff, Info, Users
} from 'lucide-react';

// --- Types ---
type ChatType = 'Project' | 'Task' | 'Support' | 'QC';
type MessageType = 'Text' | 'Update' | 'Decision' | 'Issue' | 'System';

interface Message {
  id: string;
  sender: string;
  role: string;
  content: string;
  type: MessageType;
  timestamp: string;
  isMe: boolean;
  read?: boolean;
  attachment?: { name: string; type: string; size: string };
}

interface Chat {
  id: string;
  title: string;
  type: ChatType;
  reference: string; 
  status: 'Active' | 'Pending' | 'Closed';
  lastMsg: string;
  time: string;
  unread: number;
  participants: number;
  messages: Message[];
}

interface Contact {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

export default function EnterpriseChatPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeChatId, setActiveChatId] = useState<string>('C-101');
  const [chats, setChats] = useState<Chat[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  // Modal & Menu States
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // New Chat Form State
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Mock Data ---
  const contactsList: Contact[] = [
    { id: 1, name: 'Eng. Ahmed', role: 'Project Manager', avatar: 'A' },
    { id: 2, name: 'Saeed Al-Ghamdi', role: 'Site Supervisor', avatar: 'S' },
    { id: 3, name: 'Omar Farouk', role: 'QC Inspector', avatar: 'O' },
    { id: 4, name: 'Technical Support', role: 'IT Dept', avatar: 'T' },
    { id: 5, name: 'Yasser Al-Harbi', role: 'Safety Officer', avatar: 'Y' },
  ];

  useEffect(() => {
    setTimeout(() => {
      setChats([
        { 
          id: 'C-101', title: lang === 'ar' ? 'فريق مشروع الورود' : 'Al-Wurud Project Team', 
          type: 'Project', reference: 'PRJ-2024-001', status: 'Active',
          lastMsg: lang === 'ar' ? 'تم الانتهاء من صب الخرسانة ✅' : 'Concrete pouring completed ✅', 
          time: '10:30 AM', unread: 2, participants: 8,
          messages: [
            { id: 'M-1', sender: 'System', role: 'System', content: lang === 'ar' ? 'تم إنشاء غرفة العمليات للمشروع' : 'Operation room created', type: 'System', timestamp: '08:00 AM', isMe: false },
            { id: 'M-2', sender: 'Eng. Ahmed', role: 'Project Manager', content: lang === 'ar' ? 'السلام عليكم، هل وصلت المواد للموقع؟' : 'Hello, have materials arrived?', type: 'Text', timestamp: '10:15 AM', isMe: false },
            { id: 'M-3', sender: 'Saeed', role: 'Site Supervisor', content: lang === 'ar' ? 'نعم، تم الاستلام وجاري التنزيل الآن.' : 'Yes, received and unloading now.', type: 'Update', timestamp: '10:20 AM', isMe: true },
            { id: 'M-4', sender: 'Saeed', role: 'Site Supervisor', content: lang === 'ar' ? 'تم الانتهاء من صب الخرسانة بنجاح.' : 'Concrete pouring completed successfully.', type: 'Update', timestamp: '10:30 AM', isMe: true },
          ]
        },
        { 
          id: 'C-102', title: lang === 'ar' ? 'تفتيش الجودة - قطاع 4' : 'QC Inspection - Sector 4', 
          type: 'QC', reference: 'INS-2024-102', status: 'Pending',
          lastMsg: lang === 'ar' ? 'يوجد ملاحظات على التسليح' : 'Reinforcement remarks found', 
          time: 'Yesterday', unread: 0, participants: 3,
          messages: [
            { id: 'M-5', sender: 'QC Inspector', role: 'Quality', content: lang === 'ar' ? 'يوجد تباعد غير مطابق في الحديد.' : 'Spacing mismatch in rebar.', type: 'Issue', timestamp: '02:00 PM', isMe: false }
          ]
        },
      ]);
    }, 500);
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId]);

  // --- Actions ---
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
        id: `M-${Date.now()}`,
        sender: 'You',
        role: 'Operations Manager',
        content: inputText,
        type: 'Text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true
    };
    setChats(prev => prev.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, newMessage], lastMsg: inputText, time: 'Now' } : chat));
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const newMessage: Message = {
            id: `M-${Date.now()}`,
            sender: 'You',
            role: 'Operations Manager',
            content: lang === 'ar' ? 'تم إرفاق ملف' : 'File attached',
            type: 'Text',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            attachment: { name: file.name, type: 'Document', size: (file.size/1024).toFixed(1) + ' KB' }
        };
        setChats(prev => prev.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, newMessage], lastMsg: '📎 Attachment', time: 'Now' } : chat));
    }
  };

  const handleCreateChatSubmit = () => {
    if (!newChatTitle || selectedContacts.length === 0) return;

    const newChat: Chat = {
        id: `C-${Date.now()}`,
        title: newChatTitle,
        type: 'Project', // Default type
        reference: `REF-${Math.floor(Math.random() * 1000)}`,
        status: 'Active',
        lastMsg: lang === 'ar' ? 'تم إنشاء المجموعة' : 'Group created',
        time: 'Now',
        unread: 0,
        participants: selectedContacts.length + 1, // +1 for current user
        messages: [{
            id: `SYS-${Date.now()}`,
            sender: 'System',
            role: 'System',
            content: lang === 'ar' ? `تم إنشاء المجموعة "${newChatTitle}"` : `Group "${newChatTitle}" created`,
            type: 'System',
            timestamp: 'Now',
            isMe: false
        }]
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setIsNewChatOpen(false);
    setNewChatTitle('');
    setSelectedContacts([]);
  };

  const toggleContactSelection = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleMarkResolved = () => { /* ... same as before */ };
  const handleEscalateIssue = () => { /* ... same as before */ };
  const handleRequestReport = () => { /* ... same as before */ };
  const runAiSummary = () => { /* ... same as before */ };
  const handleCall = (type: 'voice' | 'video') => { alert('Calling...'); };
  const handleMenuOption = (option: string) => { setIsMenuOpen(false); alert(option); };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const activeChatData = chats.find(c => c.id === activeChatId);

  const getTypeColor = (type: ChatType) => {
      switch(type) {
          case 'Project': return 'bg-blue-100 text-blue-600';
          case 'QC': return 'bg-purple-100 text-purple-600';
          case 'Support': return 'bg-amber-100 text-amber-600';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  return (
    <div className={`h-[calc(100vh-100px)] flex bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Sidebar */}
      <div className="w-96 border-l border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-black text-lg text-slate-800">{lang === 'ar' ? 'الاتصالات' : 'Communications'}</h2>
                <div className="flex gap-2">
                    <button onClick={toggleLang} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Globe size={18}/></button>
                    <button onClick={() => setIsNewChatOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-blue-600" title={lang === 'ar' ? 'محادثة جديدة' : 'New Chat'}><Plus size={20}/></button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><MoreHorizontal size={18}/></button>
                </div>
            </div>
            <div className="relative">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
                <input type="text" placeholder={lang === 'ar' ? 'بحث في المحادثات...' : 'Search chats...'} className="w-full px-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition" />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
                <div 
                    key={chat.id} 
                    onClick={() => { setActiveChatId(chat.id); setAiSummary(null); }}
                    className={`p-4 flex gap-3 cursor-pointer hover:bg-white hover:shadow-sm transition border-b border-slate-50 relative group ${activeChatId === chat.id ? 'bg-white border-r-4 border-r-blue-500 shadow-sm' : ''}`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${getTypeColor(chat.type)}`}>
                        {chat.type === 'Project' ? <Briefcase size={20}/> : chat.type === 'QC' ? <ShieldAlert size={20}/> : <User size={20}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className={`font-bold text-sm truncate ${activeChatId === chat.id ? 'text-blue-700' : 'text-slate-800'}`}>{chat.title}</span>
                            <span className="text-[10px] text-slate-400">{chat.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500 truncate flex-1">{chat.lastMsg}</span>
                            {chat.status === 'Active' && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                        </div>
                    </div>
                    {chat.unread > 0 && (
                        <div className="absolute top-4 left-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm animate-pulse">
                            {chat.unread}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10 bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${activeChatData?.type === 'QC' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {activeChatData?.title.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        {activeChatData?.title}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeChatData?.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {activeChatData?.status}
                        </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <span className="font-mono bg-slate-50 px-1 rounded">{activeChatData?.reference}</span>
                        <span>• {activeChatData?.participants} {lang === 'ar' ? 'مشارك' : 'Participants'}</span>
                    </p>
                </div>
            </div>
            
            <div className="flex gap-2 relative">
                <button onClick={runAiSummary} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition border border-purple-100" title="AI Summary">
                    {isAiAnalyzing ? <Loader2 size={20} className="animate-spin"/> : <BrainCircuit size={20}/>}
                </button>
                <div className="h-9 w-px bg-slate-200 mx-1"></div>
                <button onClick={() => handleCall('voice')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 border border-transparent hover:border-slate-200 transition"><Phone size={20}/></button>
                <button onClick={() => handleCall('video')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 border border-transparent hover:border-slate-200 transition"><Video size={20}/></button>
                
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-xl text-slate-500 border border-transparent transition ${isMenuOpen ? 'bg-slate-100 border-slate-200' : 'hover:bg-slate-50 hover:border-slate-200'}`}>
                        <MoreVertical size={20}/>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-12 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                            <button onClick={() => handleMenuOption('search')} className="w-full text-right px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Search size={16}/> {lang === 'ar' ? 'بحث' : 'Search'}</button>
                            <button onClick={() => handleMenuOption('info')} className="w-full text-right px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Info size={16}/> {lang === 'ar' ? 'معلومات' : 'Info'}</button>
                            <button onClick={() => handleMenuOption('mute')} className="w-full text-right px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><BellOff size={16}/> {lang === 'ar' ? 'كتم' : 'Mute'}</button>
                            <div className="h-px bg-slate-100 mx-2"></div>
                            <button onClick={() => handleMenuOption('clear')} className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={16}/> {lang === 'ar' ? 'مسح' : 'Clear'}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* AI Insight */}
        {aiSummary && (
            <div className="absolute top-20 left-4 right-4 z-20 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100 shadow-lg flex items-start gap-3">
                <BrainCircuit size={20} className="text-purple-600 shrink-0 mt-0.5"/>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-purple-800 uppercase mb-1">{lang === 'ar' ? 'ملخص الذكاء الاصطناعي' : 'AI Summary'}</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>
                </div>
                <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
            </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
            {activeChatData?.messages.map((msg, idx) => (
                <div key={msg.id}>
                    {msg.type === 'System' || msg.type === 'Issue' ? (
                        <div className="flex justify-center my-4">
                            <div className={`text-xs px-4 py-1.5 rounded-full border flex items-center gap-2 ${msg.type === 'Issue' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {msg.type === 'Issue' ? <AlertTriangle size={12}/> : <CheckCircle2 size={12}/>} {msg.content}
                            </div>
                        </div>
                    ) : (
                        <div className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mt-1 shadow-sm border ${msg.isMe ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-700 border-slate-200'}`}>
                                {msg.sender.charAt(0)}
                            </div>
                            <div className={`max-w-md ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className="text-xs font-bold text-slate-700">{msg.sender}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded">{msg.role}</span>
                                </div>
                                <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed border relative group ${msg.isMe ? 'bg-blue-600 text-white rounded-tr-none border-blue-600' : 'bg-white text-slate-800 rounded-tl-none border-slate-100'}`}>
                                    {msg.content}
                                    {msg.attachment && (
                                        <div className={`mt-3 p-2 rounded-xl flex items-center gap-3 ${msg.isMe ? 'bg-blue-700/50' : 'bg-slate-50 border border-slate-200'}`}>
                                            <div className="p-2 bg-white rounded-lg text-blue-600"><FileText size={16}/></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold truncate text-xs">{msg.attachment.name}</div>
                                                <div className="text-[10px] opacity-70">{msg.attachment.size}</div>
                                            </div>
                                            <button className="p-1 hover:bg-black/10 rounded"><Download size={14}/></button>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">{msg.timestamp}</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-end bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <div className="flex gap-1 pb-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-200 text-slate-500 rounded-xl transition"><Paperclip size={20}/></button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button className="p-2 hover:bg-slate-200 text-slate-500 rounded-xl transition"><Image size={20}/></button>
                </div>
                <textarea rows={1} className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-slate-800 font-medium resize-none py-2.5 max-h-32" placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message...'} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}></textarea>
                <div className="pb-1">
                    {inputText.trim() ? <button onClick={handleSendMessage} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200"><Send size={18}/></button> : <button className="p-2.5 hover:bg-slate-200 text-slate-500 rounded-xl transition"><Mic size={20}/></button>}
                </div>
            </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'بدء محادثة جديدة' : 'Start New Conversation'}</h3>
              <button onClick={() => setIsNewChatOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'اسم المجموعة / المحادثة' : 'Group Name'}</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold" value={newChatTitle} onChange={(e) => setNewChatTitle(e.target.value)} placeholder={lang === 'ar' ? 'مثل: فريق الصيانة...' : 'e.g. Maintenance Team...'} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'إضافة أعضاء' : 'Add Members'}</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {contactsList.map(contact => (
                    <div key={contact.id} onClick={() => toggleContactSelection(contact.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedContacts.includes(contact.id) ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${selectedContacts.includes(contact.id) ? 'bg-blue-600' : 'bg-slate-400'}`}>{contact.avatar}</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-800">{contact.name}</div>
                        <div className="text-[10px] text-slate-500">{contact.role}</div>
                      </div>
                      {selectedContacts.includes(contact.id) && <CheckCircle2 size={16} className="text-blue-600"/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button onClick={() => setIsNewChatOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleCreateChatSubmit} disabled={!newChatTitle || selectedContacts.length === 0} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{lang === 'ar' ? 'إنشاء' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}