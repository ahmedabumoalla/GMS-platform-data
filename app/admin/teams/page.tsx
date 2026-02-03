'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, Briefcase, CheckCircle, AlertCircle, Shield } from 'lucide-react';

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  job_title: string;
  supervisor_id: number | null;
  is_active: boolean;
};

export default function TeamsPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch all users
    const { data: allUsers } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (allUsers) {
      // Filter Managers
      const managersList = allUsers.filter(u => u.role === 'manager');
      setManagers(managersList);

      // Filter Employees and Engineers (everyone who is not a manager or super_admin)
      const employeesList = allUsers.filter(u => u.role === 'employee' || u.role === 'engineer' || (u.role !== 'manager' && u.role !== 'super_admin'));
      setEmployees(employeesList);
    }
    
    setLoading(false);
  };

  // Assign Supervisor Function
  const assignSupervisor = async (employeeId: number, supervisorId: string) => {
    const newSupervisorId = supervisorId === "null" ? null : parseInt(supervisorId);
    
    // Update Database
    const { error } = await supabase
      .from('users')
      .update({ supervisor_id: newSupervisorId })
      .eq('id', employeeId);

    if (!error) {
        // Update UI locally (optimistic update)
        setEmployees(employees.map(emp => 
            emp.id === employeeId ? { ...emp, supervisor_id: newSupervisorId } : emp
        ));
        
        // alert('Supervisor updated successfully');
    } else {
        alert('Error updating supervisor');
    }
  };

  // Helper to get Supervisor Name
  const getSupervisorName = (id: number | null) => {
    if (!id) return null;
    return managers.find(m => m.id === id)?.full_name;
  };

  if (loading) return <div className="text-center text-slate-400 mt-10">Loading organizational structure...</div>;

  return (
    <div className="space-y-8 font-sans" dir="ltr">
      
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-blue-600" /> Teams & Supervisors Management
            </h2>
            <p className="text-slate-500 mt-1">Linking technicians and engineers to field supervisors to assign approval cycles.</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-400">Supervisors Count</div>
                <div className="font-bold text-blue-600">{managers.length}</div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-400">Technicians</div>
                <div className="font-bold text-slate-700">{employees.length}</div>
            </div>
        </div>
      </div>

      {/* Linking Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Changed text-right to text-left */}
        <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                    <th className="p-5">Employee / Technician</th>
                    <th className="p-5">Job Title</th>
                    <th className="p-5">Current Supervisor</th>
                    <th className="p-5">Assign New Supervisor</th>
                    <th className="p-5">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-5">
                            <div className="font-bold text-slate-800">{emp.full_name}</div>
                            <div className="text-xs text-slate-400 mt-1">{emp.email}</div>
                        </td>
                        <td className="p-5">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                {emp.job_title || 'Unspecified'}
                            </span>
                        </td>
                        <td className="p-5">
                            {emp.supervisor_id ? (
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-fit text-sm font-bold">
                                    <CheckCircle size={14} />
                                    {getSupervisorName(emp.supervisor_id)}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit text-sm font-bold">
                                    <AlertCircle size={14} />
                                    Unlinked
                                </div>
                            )}
                        </td>
                        <td className="p-5">
                            <select 
                                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                                value={emp.supervisor_id || "null"}
                                onChange={(e) => assignSupervisor(emp.id, e.target.value)}
                            >
                                <option value="null">-- Select Supervisor --</option>
                                {managers.map(mgr => (
                                    <option key={mgr.id} value={mgr.id}>
                                        {mgr.full_name} ({mgr.job_title})
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td className="p-5">
                             {emp.is_active ? <span className="text-green-500 text-xs">● Active</span> : <span className="text-red-500 text-xs">● Inactive</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        {employees.length === 0 && (
            <div className="p-10 text-center text-slate-400">
                No employees available to link at the moment.
            </div>
        )}
      </div>
    </div>
  );
}