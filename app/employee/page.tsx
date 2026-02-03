'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, CheckCircle, PlayCircle, Clock, HardHat, MapPin } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  status: string;
  due_date: string;
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // سنفترض أن الموظف الحالي هو 'worker@gms.com' للتجربة السريعة
  // في التطبيق الحقيقي نأخذ الإيميل من الجلسة
  const employeeEmail = 'worker@gms.com'; 

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    setLoading(true);
    
    // 1. نجيب ID الموظف أولاً
    const { data: userData } = await supabase.from('users').select('id, full_name').eq('email', employeeEmail).single();
    
    if (userData) {
        // 2. نجيب المهام المسندة له
        const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_to', userData.id)
            .order('id', { ascending: false });
            
        if (taskData) setTasks(taskData);
    }
    setLoading(false);
  };

  const updateTaskStatus = async (id: number, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    fetchMyTasks(); // تحديث القائمة
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Header للموبايل والموظف */}
      <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold">Workforce Portal</h1>
                <p className="text-slate-400 text-sm">Welcome back, Technician</p>
            </div>
            <button onClick={() => router.push('/login')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
                <LogOut size={20} />
            </button>
        </div>

        {/* Status Cards */}
        <div className="flex gap-4 overflow-x-auto pb-2">
            <div className="bg-blue-600 p-4 rounded-2xl min-w-[140px] shadow-lg shadow-blue-900/50">
                <div className="text-blue-200 text-xs mb-1">Pending Tasks</div>
                <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'Pending').length}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl min-w-[140px] border border-slate-700">
                <div className="text-slate-400 text-xs mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-400">{tasks.filter(t => t.status === 'Completed').length}</div>
            </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-slate-800 font-bold text-lg mb-4 flex items-center gap-2">
            <HardHat className="text-blue-600" /> My Assignments
        </h2>

        {loading ? (
            <div className="text-center py-10 text-slate-400">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <CheckCircle className="w-12 h-12 mx-auto text-green-200 mb-2" />
                <p>All caught up! No tasks assigned.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            task.status === 'Completed' ? 'bg-green-500' : 
                            task.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></div>

                        <div className="flex justify-between items-start mb-3 pl-2">
                            <h3 className="font-bold text-slate-800">{task.title}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                                task.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' : 
                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {task.status}
                            </span>
                        </div>
                        
                        <div className="pl-2 mb-4 text-sm text-slate-500 flex items-center gap-2">
                            <Clock size={14} /> Due: {task.due_date}
                        </div>

                        {/* Action Buttons */}
                        <div className="pl-2 flex gap-3">
                            {task.status === 'Pending' && (
                                <button 
                                    onClick={() => updateTaskStatus(task.id, 'In Progress')}
                                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <PlayCircle size={16} /> Start Task
                                </button>
                            )}
                            
                            {task.status === 'In Progress' && (
                                <button 
                                    onClick={() => updateTaskStatus(task.id, 'Completed')}
                                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Complete
                                </button>
                            )}

                            {task.status === 'Completed' && (
                                <div className="w-full py-2 text-center text-xs text-green-600 font-bold bg-green-50 rounded-lg">
                                    Task Finished Successfully
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}