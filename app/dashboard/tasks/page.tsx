'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, CheckCircle, Activity, Clock, 
  Calendar, User, FileText, Search, Filter, X, 
  AlignLeft, Hash, ChevronLeft, UploadCloud, Image as ImageIcon, Send
} from 'lucide-react';

// --- Types ---
type Task = {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Review';
  due_date: string;
  users: { full_name: string; job_title: string };
  proof_files?: string[]; // ملفات الإثبات
  completion_note?: string; // ملاحظة الفني
};

type UserData = {
  id: number;
  full_name: string;
  job_title: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالة التحكم بالمودال
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // بيانات التحديث (للفني)
  const [updateNote, setUpdateNote] = useState('');
  
  // محاكاة جلب البيانات
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setTimeout(() => {
        // بيانات وهمية للموظفين
        const mockUsers: UserData[] = [
            { id: 101, full_name: "سعيد القحطاني", job_title: "فني كهرباء" },
            { id: 104, full_name: "عمر فاروق", job_title: "مهندس موقع" },
        ];
        setUsers(mockUsers);

        // بيانات وهمية للمهام (بالعربي)
        const mockTasks: Task[] = [
            { 
                id: 105, title: "صيانة أسلاك المولد - القطاع 7", 
                description: "فحص لوحة التحكم الرئيسية واستبدال الكابلات التالفة. تأكد من اتباع بروتوكولات السلامة.",
                status: "In Progress", due_date: "2024-02-20", assigned_to: 101,
                users: { full_name: "سعيد القحطاني", job_title: "فني كهرباء" },
                proof_files: [], completion_note: ""
            },
            { 
                id: 106, title: "اختبار إشارة الألياف الضوئية", 
                description: "إجراء اختبار OTDR لخط الاتصال الجديد.",
                status: "Pending", due_date: "2024-02-22", assigned_to: 104,
                users: { full_name: "عمر فاروق", job_title: "مهندس موقع" }
            },
        ];
        setTasks(mockTasks);
        setLoading(false);
    }, 800);
  };

  // دالة تحديث المهمة (للفني)
  const handleUpdateTask = (newStatus: 'Completed' | 'In Progress') => {
    if(!selectedTask) return;

    // محاكاة الحفظ
    setIsUploading(true);
    setTimeout(() => {
        const updatedTasks = tasks.map(t => 
            t.id === selectedTask.id 
            ? { ...t, status: newStatus, completion_note: updateNote } 
            : t
        );
        setTasks(updatedTasks);
        setIsUploading(false);
        setSelectedTask(null); // إغلاق المودال
        setUpdateNote(''); // تصفير الملاحظة
        alert(`تم تحديث حالة المهمة إلى ${newStatus === 'Completed' ? 'مكتملة' : 'قيد التنفيذ'} بنجاح! ✅`);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Review': return 'bg-purple-50 text-purple-700 border-purple-200';
        default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // ترجمة الحالة للعرض
  const getStatusText = (status: string) => {
      switch (status) {
          case 'Completed': return 'مكتملة';
          case 'In Progress': return 'قيد التنفيذ';
          case 'Pending': return 'معلقة';
          case 'Review': return 'قيد المراجعة';
          default: return status;
      }
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <CheckCircle className="text-blue-600"/> مهامي
            </h3>
            <p className="text-sm text-slate-500 mt-1">عرض المهام المسندة إليك وتحديث حالة الإنجاز.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-600">
                قيد الانتظار: {tasks.filter(t => t.status !== 'Completed').length}
            </div>
            <div className="bg-green-100 px-4 py-2 rounded-xl text-sm font-bold text-green-700">
                مكتملة: {tasks.filter(t => t.status === 'Completed').length}
            </div>
        </div>
      </div>

      {/* جدول المهام */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                    <tr>
                        <th className="p-6">تفاصيل المهمة</th>
                        <th className="p-6">الموعد النهائي</th>
                        <th className="p-6">الحالة</th>
                        <th className="p-6 text-left">الإجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading ? (
                        <tr><td colSpan={4} className="p-10 text-center text-slate-400 animate-pulse">جاري تحميل المهام...</td></tr>
                    ) : tasks.map(task => (
                        <tr 
                            key={task.id} 
                            onClick={() => setSelectedTask(task)}
                            className="hover:bg-blue-50/30 transition cursor-pointer group"
                        >
                            <td className="p-6">
                                <div className="font-bold text-slate-800">{task.title}</div>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Hash size={10}/> {task.id}
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg w-fit text-xs font-bold border border-slate-100">
                                    <Calendar size={14} className="text-slate-400" />
                                    {task.due_date}
                                </div>
                            </td>
                            <td className="p-6">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 w-fit ${getStatusColor(task.status)}`}>
                                    {getStatusText(task.status)}
                                </span>
                            </td>
                            <td className="p-6 text-left">
                                <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                                    تحديث
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- نافذة التحديث (مودال الفني) --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* الرأس */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">الرقم: #{selectedTask.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(selectedTask.status)}`}>{getStatusText(selectedTask.status)}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{selectedTask.title}</h3>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition border border-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* المحتوى: تفاصيل + أدوات الفني */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* وصف المهمة */}
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-sm text-blue-900">
                        <div className="font-bold mb-1 flex items-center gap-2"><AlignLeft size={16}/> التعليمات:</div>
                        {selectedTask.description}
                    </div>

                    <hr className="border-slate-100" />

                    {/* منطقة رفع الملفات (إثبات الإنجاز) */}
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                            <UploadCloud size={18} className="text-purple-600"/> إثبات الإنجاز
                        </h4>
                        
                        {/* Dropzone الوهمي */}
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer group">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition">
                                <ImageIcon size={20}/>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">اضغط لرفع الصور أو الملفات</p>
                            <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, PDF (الحد الأقصى 5 ميجابايت)</p>
                        </div>
                    </div>

                    {/* ملاحظات الفني */}
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                            <FileText size={18} className="text-slate-600"/> ملاحظات الفني
                        </h4>
                        <textarea 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition h-24 resize-none"
                            placeholder="صف ما تم إنجازه..."
                            value={updateNote}
                            onChange={(e) => setUpdateNote(e.target.value)}
                        ></textarea>
                    </div>

                </div>

                {/* التذييل: أزرار الإجراءات */}
                <div className="p-5 bg-white border-t border-slate-100 flex justify-between items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    {selectedTask.status !== 'Completed' ? (
                        <>
                            <button 
                                onClick={() => handleUpdateTask('In Progress')}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition text-sm"
                            >
                                قيد التنفيذ
                            </button>
                            <button 
                                onClick={() => handleUpdateTask('Completed')}
                                disabled={isUploading}
                                className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition text-sm flex items-center justify-center gap-2"
                            >
                                {isUploading ? 'جاري الحفظ...' : <><CheckCircle size={18}/> تحديد كمكتملة</>}
                            </button>
                        </>
                    ) : (
                        <div className="w-full text-center py-2 text-green-600 font-bold text-sm bg-green-50 rounded-xl border border-green-100">
                            تم إنجاز المهمة ✅
                        </div>
                    )}
                </div>

            </div>
        </div>
      )}

      {/* تنسيقات الحقول الحديثة */}
      <style jsx>{`
        .modern-input {
            @apply w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-normal;
        }
      `}</style>
    </div>
  );
}