'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, CheckCircle, Activity, Clock, Calendar, User } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  status: string;
  due_date: string;
  users: { full_name: string }; // For linking employee name
};

type User = {
  id: number;
  full_name: string;
  job_title: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Task Form State
  const [newTask, setNewTask] = useState({ title: '', assigned_to: '', due_date: '' });

  // Fetch Data on Load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch active employees only (for dropdown)
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name, job_title')
      .eq('is_active', true)
      .neq('role', 'super_admin'); 
      
    if (userData) setUsers(userData);
    
    // 2. Fetch tasks with associated employee name
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*, users(full_name)')
      .order('id', { ascending: false });

    if (taskData) setTasks(taskData);
    
    setLoading(false);
  };

  // Assign Task Function
  const assignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assigned_to) return;

    const { error } = await supabase.from('tasks').insert({
        title: newTask.title,
        assigned_to: parseInt(newTask.assigned_to),
        due_date: newTask.due_date,
        status: 'Pending' // Default status
    });

    if (!error) {
        setNewTask({ title: '', assigned_to: '', due_date: '' }); // Reset form
        fetchData(); // Refresh list
        alert('Task assigned successfully!');
    } else {
        alert('Error assigning task');
    }
  };

  if (loading) return <div className="text-center text-slate-400 mt-10">Loading tasks...</div>;

  return (
    <div className="space-y-8 font-sans" dir="ltr">
      
      {/* 1. New Task Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Plus size={20}/></div>
            Assign New Task
          </h3>
          
          <form onSubmit={assignTask} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Task Title */}
              <div className="md:col-span-5">
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Task Details</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Generator maintenance in North Sector..." 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                    value={newTask.title} 
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
                    required 
                  />
              </div>

              {/* Select Employee */}
              <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Responsible Employee</label>
                  <div className="relative">
                    {/* Positioned icon to left for LTR standard */}
                    <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                    <select 
                        className="w-full p-3 pl-10 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none" 
                        value={newTask.assigned_to} 
                        onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})} 
                        required
                    >
                        <option value="">Select from list...</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.full_name} ({user.job_title})
                            </option>
                        ))}
                    </select>
                  </div>
              </div>

              {/* Due Date */}
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Due Date</label>
                  <div className="relative">
                    <input 
                        type="date" 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-sans" 
                        style={{ colorScheme: 'light' }} 
                        value={newTask.due_date} 
                        onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} 
                        required 
                    />
                  </div>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2">
                  <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all">
                      Submit Task
                  </button>
              </div>
          </form>
      </div>

      {/* 2. Tasks Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="font-bold text-lg text-slate-800">Task Tracking Log</h3>
                <p className="text-xs text-slate-400 mt-1">Statuses are updated automatically from employee accounts</p>
            </div>
            <div className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-500 shadow-sm">
                Total Count: {tasks.length}
            </div>
        </div>

        <div className="overflow-x-auto">
            {/* Changed text-right to text-left */}
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                        <th className="p-5">Task Details</th>
                        <th className="p-5">Assigned Employee</th>
                        <th className="p-5">Due Date</th>
                        <th className="p-5">Completion Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tasks.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400">No tasks recorded currently. Start by adding a new task.</td>
                        </tr>
                    ) : tasks.map(task => (
                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                            
                            <td className="p-5">
                                <div className="font-bold text-slate-800 text-base">{task.title}</div>
                                <div className="text-xs text-slate-400 mt-1">ID: #{task.id}</div>
                            </td>
                            
                            <td className="p-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                                        {task.users?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">
                                        {task.users?.full_name || 'Deleted Employee'}
                                    </span>
                                </div>
                            </td>
                            
                            <td className="p-5">
                                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit text-sm font-mono">
                                    <Calendar size={14} />
                                    <span>{task.due_date}</span>
                                </div>
                            </td>
                            
                            <td className="p-5">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 w-fit ${
                                    task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    task.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {task.status === 'Completed' && <CheckCircle size={14}/>}
                                    {task.status === 'In Progress' && <Activity size={14}/>}
                                    {task.status === 'Pending' && <Clock size={14}/>}
                                    
                                    {task.status === 'Completed' ? 'Completed' : 
                                     task.status === 'In Progress' ? 'In Progress' : 
                                     'Pending'}
                                </span>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}