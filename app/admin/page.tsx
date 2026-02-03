'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  performance_score: number;
  job_title: string;
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id');
      
      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // 2. Calculate real statistics from fetched data
  const totalEmployees = users.length;
  const activeEmployees = users.filter(u => u.is_active).length;
  const inactiveEmployees = users.filter(u => !u.is_active).length;
  
  // Calculate average performance (Sum / Count)
  const averagePerformance = totalEmployees > 0
    ? Math.round(users.reduce((acc, user) => acc + (user.performance_score || 0), 0) / totalEmployees)
    : 0;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        Loading real data...
      </div>
    );
  }

  return (
    // Changed dir="rtl" to dir="ltr" (standard for English)
    <div className="space-y-8 font-sans" dir="ltr">
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Employees" 
          value={totalEmployees} 
          icon={<Users className="text-blue-600" />} 
          bg="bg-blue-50" 
          desc="Registered in system"
        />
        <StatCard 
          title="Active Employees" 
          value={activeEmployees} 
          icon={<UserCheck className="text-green-600" />} 
          bg="bg-green-50" 
          desc="Currently available"
        />
        <StatCard 
          title="Inactive / On Leave" 
          value={inactiveEmployees} 
          icon={<UserX className="text-red-600" />} 
          bg="bg-red-50" 
          desc="Disabled accounts"
        />
        <StatCard 
          title="Avg. Performance" 
          value={`${averagePerformance}%`} // Swapped % position for English
          icon={<Activity className="text-purple-600" />} 
          bg="bg-purple-50" 
          desc="Based on ratings"
        />
      </div>

      {/* Detailed Employee Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-lg text-slate-800">Employee List</h3>
             <p className="text-slate-400 text-sm mt-1">Live data from database</p>
           </div>
           <div className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold text-slate-500">
             Just updated
           </div>
        </div>
        
        <div className="overflow-x-auto">
          {/* Changed text-right to text-left for English */}
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="p-5">Name / Job Title</th>
                <th className="p-5">Role</th>
                <th className="p-5">Performance Status</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-5">
                    <div className="font-bold text-slate-800">{user.full_name}</div>
                    <div className="text-xs text-slate-500 mt-1">{user.job_title || 'Not specified'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                  </td>
                  
                  <td className="p-5">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${user.performance_score >= 90 ? 'bg-green-500' : user.performance_score >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                          style={{width: `${user.performance_score || 0}%`}}
                        ></div>
                      </div>
                      <span className="text-xs font-bold">{user.performance_score || 0}%</span>
                    </div>
                  </td>

                  <td className="p-5">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700">
                        <UserCheck size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700">
                        <UserX size={14} /> Inactive
                      </span>
                    )}
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

// Stat Card Component
function StatCard({ title, value, icon, bg, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bg}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        <span className="text-[10px] text-slate-400 mb-1.5">{desc}</span>
      </div>
    </div>
  );
}