'use client';

import { useState } from 'react';
import { X, UserPlus, Shield, Mail, Lock, User, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AddUserModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'employee',
    jobTitle: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/dashboard/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert('User created successfully! ✅');
      onClose();
      setFormData({ fullName: '', email: '', password: '', role: 'employee', jobTitle: '' }); // Reset

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200" dir="ltr">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
              <UserPlus className="text-blue-400" /> Add New User
            </h3>
            <p className="text-slate-400 text-xs mt-1">Create accounts and assign system permissions.</p>
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-2 rounded-full transition"><X size={20}/></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {/* Name & Job Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
                <input required type="text" placeholder="John Doe"
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-sm font-semibold"
                  onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500">Job Title</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
                <input required type="text" placeholder="e.g. Site Engineer"
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-sm font-semibold"
                  onChange={e => setFormData({...formData, jobTitle: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Email & Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Email Access</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <input required type="email" placeholder="user@gms-platform.com"
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-sm font-semibold"
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <input required type="password" placeholder="••••••••"
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-sm font-semibold"
                onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          {/* Role Selection (The Permissions Part) */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Shield size={12} className="text-purple-500"/> Assign System Role (Permissions)
            </label>
            <div className="grid grid-cols-1 gap-2">
              <select 
                className="w-full p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl outline-none focus:ring-2 focus:ring-purple-200 font-bold text-sm"
                onChange={e => setFormData({...formData, role: e.target.value})}
                value={formData.role}
              >
                <optgroup label="Management">
                  <option value="super_admin">👑 Super Admin (Full Access)</option>
                  <option value="manager">👔 General Manager</option>
                </optgroup>
                <optgroup label="Strategic Feeders">
                  <option value="project_manager">📁 Project Manager (Contracts)</option>
                  <option value="financial_advisor">💰 Financial Advisor (Audit)</option>
                </optgroup>
                <optgroup label="Field Operations">
                  <option value="supervisor">👷 Field Supervisor</option>
                  <option value="technician">🔧 Technician / Engineer</option>
                  <option value="employee">👤 Regular Employee</option>
                </optgroup>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 px-1">
              * Super Admins can manage everything. Project Managers & Advisors can feed the Black Box.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition active:scale-95">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Create Account</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}