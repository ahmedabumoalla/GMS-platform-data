'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, Shield, Mail, Briefcase, MapPin, Hash, Phone, 
  CreditCard, Calendar, UploadCloud, ChevronRight, ChevronLeft, 
  Loader2, CheckCircle2, Copy, Check, Users, Building, Globe
} from 'lucide-react';
import { useDashboard } from '../../layout';

export default function CreateUserPage() {
  const router = useRouter();
  const { lang } = useDashboard();
  const isRTL = lang === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<{id: string, full_name: string, job_title: string}[]>([]);
  const [successData, setSuccessData] = useState<{username: string, password: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // حالة النموذج (الحقول المطلوبة فقط: الاسم، الهوية، المسمى)
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    job_title: '',
    role: 'engineer',
    phone: '',
    email: '',
    address: '',
    bank_account: '',
    start_date: '',
    dob: '',
    region: '',
    branch: '',
    manager_id: '',
    id_copy_url: ''
  });

  // جلب قائمة المدراء (Project Managers & Super Admins)
  useEffect(() => {
    const fetchManagers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, job_title')
        .in('role', ['super_admin', 'project_manager', 'engineer'])
        .eq('status', 'active');
      if (data) setManagers(data);
    };
    fetchManagers();
  }, []);

  // حساب العمر تلقائياً
  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // دالة لضغط الصورة قبل الرفع
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // أقصى عرض
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          }, 'image/jpeg', 0.7); // ضغط بجودة 70%
        };
      };
    });
  };

  // معالجة رفع الملف (صورة أو PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      let fileToUpload: File | Blob = file;
      let fileName = `${Date.now()}_${file.name}`;

      // إذا كانت صورة، قم بضغطها
      if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
        fileName = `${Date.now()}_compressed.jpg`;
      }

      const { data, error } = await supabase.storage
        .from('employee-documents')
        .upload(`id_copies/${fileName}`, fileToUpload);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(`id_copies/${fileName}`);

      setFormData({ ...formData, id_copy_url: publicUrl.publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      alert(isRTL ? "فشل رفع الملف" : "Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // إرسال البيانات للـ API الجديد
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error);

      // عرض نافذة النجاح مع بيانات الدخول
      setSuccessData({
        username: data.user.username,
        password: data.user.temp_password
      });

    } catch (error: any) {
      console.error("Error creating user:", error);
      alert((isRTL ? 'حدث خطأ: ' : 'Error: ') + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCreds = () => {
    if(successData) {
        navigator.clipboard.writeText(`Username: ${successData.username}\nPassword: ${successData.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successData) {
    return (
      <div className={`max-w-3xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center animate-in zoom-in duration-300 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 border-4 border-white shadow-lg">
              <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">{isRTL ? 'تم إنشاء حساب الموظف بنجاح!' : 'Employee Account Created!'}</h2>
          <p className="text-slate-500 mb-8">{isRTL ? 'يرجى تزويد الموظف ببيانات الدخول التالية (تم توليد الرقم الوظيفي وكلمة المرور تلقائياً)' : 'Please provide the employee with these credentials'}</p>
          
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 max-w-md mx-auto space-y-6 relative text-start">
              <button onClick={copyCreds} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition flex items-center gap-2 text-xs font-bold shadow-sm`}>
                  {copied ? <><Check size={14} className="text-green-600"/> {isRTL ? 'تم النسخ' : 'Copied'}</> : <><Copy size={14}/> {isRTL ? 'نسخ' : 'Copy'}</>}
              </button>
              
              <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">{isRTL ? 'اسم المستخدم (الرقم الوظيفي)' : 'Username (Emp ID)'}</div>
                  <div className="text-2xl font-mono font-black text-blue-700 bg-white px-4 py-2 rounded-xl border border-slate-200 inline-block">{successData.username}</div>
              </div>
              <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">{isRTL ? 'كلمة المرور' : 'Password'}</div>
                  <div className="text-2xl font-mono font-black text-slate-800 bg-white px-4 py-2 rounded-xl border border-slate-200 inline-block">{successData.password}</div>
              </div>
          </div>

          <button onClick={() => router.push('/dashboard/users')} className="mt-10 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition active:scale-95">
              {isRTL ? 'العودة لقائمة المستخدمين' : 'Back to Users'}
          </button>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto space-y-6 pb-20 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900 mb-2 flex items-center gap-1 font-bold transition">
            {isRTL ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>} {isRTL ? 'عودة' : 'Back'}
          </button>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <UserPlus className="text-blue-600"/> {isRTL ? 'تسجيل موظف جديد' : 'Register New Employee'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{isRTL ? 'أدخل بيانات الموظف. الحقول المميزة بـ (*) إجبارية.' : 'Enter employee details. Fields marked with (*) are required.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Personal Info */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Shield className="text-slate-400" size={20}/> {isRTL ? 'المعلومات الأساسية' : 'Basic Information'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800" />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'رقم الهوية / الإقامة *' : 'National ID *'}</label>
                <div className="relative">
                    <Hash className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input required type="text" value={formData.national_id} onChange={e => setFormData({...formData, national_id: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 text-slate-600" />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'العمر' : 'Age'}</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 flex items-center justify-center">
                    {calculateAge(formData.dob) || '-'} {calculateAge(formData.dob) ? (isRTL ? 'سنة' : 'Years') : ''}
                  </div>
              </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'رقم الجوال' : 'Phone'}</label>
                <div className="relative">
                    <Phone className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input type="tel" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`} />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                <div className="relative">
                    <Mail className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input type="email" dir="ltr" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`} />
                </div>
            </div>
            <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'عنوان السكن' : 'Address'}</label>
                <div className="relative">
                    <MapPin className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                </div>
            </div>
          </div>
        </div>

        {/* Section 2: Job Details */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Briefcase className="text-slate-400" size={20}/> {isRTL ? 'معلومات الوظيفة' : 'Job Information'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'المسمى الوظيفي *' : 'Job Title *'}</label>
                <input required type="text" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} placeholder={isRTL ? 'مثال: مهندس موقع، فني كهرباء...' : 'e.g. Site Engineer'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800" />
            </div>
            
            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'صلاحيات النظام (Role)' : 'System Role'}</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 cursor-pointer">
                    <option value="technician">{isRTL ? 'فني / عامل' : 'Technician'}</option>
                    <option value="engineer">{isRTL ? 'مهندس' : 'Engineer'}</option>
                    <option value="project_manager">{isRTL ? 'مدير مشاريع' : 'Project Manager'}</option>
                    <option value="accountant">{isRTL ? 'محاسب' : 'Accountant'}</option>
                    <option value="super_admin">{isRTL ? 'مدير نظام (كامل الصلاحيات)' : 'Super Admin'}</option>
                </select>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'الإدارة التابع لها / المدير المباشر' : 'Direct Manager'}</label>
                <div className="relative">
                    <Users className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <select value={formData.manager_id} onChange={e => setFormData({...formData, manager_id: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 cursor-pointer ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}>
                        <option value="">{isRTL ? 'بدون مدير مباشر' : 'No Direct Manager'}</option>
                        {managers.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.job_title})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'تاريخ المباشرة' : 'Start Date'}</label>
                <div className="relative">
                    <Calendar className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-600 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'موقع العمل (المنطقة)' : 'Work Region'}</label>
                <div className="relative">
                    <Globe className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <select value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 cursor-pointer ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}>
                        <option value="">{isRTL ? 'اختر المنطقة...' : 'Select Region...'}</option>
                        <option value="المنطقة الوسطى">المنطقة الوسطى</option>
                        <option value="المنطقة الغربية">المنطقة الغربية</option>
                        <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                        <option value="المنطقة الجنوبية">المنطقة الجنوبية</option>
                        <option value="المنطقة الشمالية">المنطقة الشمالية</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'الفرع' : 'Branch'}</label>
                <div className="relative">
                    <Building className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input type="text" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} placeholder={isRTL ? 'مثال: فرع الرياض الرئيسي' : 'e.g. Riyadh Main Branch'} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                </div>
            </div>

            <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 mb-2 block">{isRTL ? 'رقم الحساب البنكي (الآيبان)' : 'Bank Account (IBAN)'}</label>
                <div className="relative">
                    <CreditCard className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                    <input type="text" dir="ltr" placeholder="SA0000000000000000000000" value={formData.bank_account} onChange={e => setFormData({...formData, bank_account: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4 text-right uppercase' : 'pl-10 pr-4 uppercase'}`} />
                </div>
            </div>
          </div>
        </div>

        {/* Section 3: Attachments */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-1">{isRTL ? 'صورة الهوية / الإقامة' : 'ID Copy'}</h3>
            <p className="text-xs text-slate-500">{isRTL ? 'ارفع صورة أو ملف PDF. سيتم ضغط الصور تلقائياً لتوفير المساحة.' : 'Upload Image or PDF. Images are auto-compressed.'}</p>
          </div>
          
          <div className="flex-shrink-0">
             <input type="file" id="id_upload" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploadingFile}/>
             <label htmlFor="id_upload" className={`cursor-pointer px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition ${formData.id_copy_url ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}`}>
                {uploadingFile ? <Loader2 size={18} className="animate-spin"/> : (formData.id_copy_url ? <CheckCircle2 size={18}/> : <UploadCloud size={18}/>)}
                {uploadingFile ? (isRTL ? 'جاري الرفع والضغط...' : 'Uploading...') : (formData.id_copy_url ? (isRTL ? 'تم رفع الملف بنجاح' : 'File Uploaded') : (isRTL ? 'اختر ملف للرفع' : 'Select File'))}
             </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
           <button 
             type="submit" 
             disabled={isSubmitting || uploadingFile} 
             className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 shadow-xl flex items-center gap-3 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20}/>}
             {isRTL ? 'حفظ وتسجيل الموظف' : 'Save and Register Employee'}
           </button>
        </div>
      </form>
    </div>
  );
}