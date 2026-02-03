'use client';

import { useEffect, useState, use } from 'react'; // أضفنا use لفك تغليف الـ params
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  FileText, Calendar, DollarSign, PieChart, Users, 
  ArrowLeft, Download, CheckCircle, Clock, AlertTriangle 
} from 'lucide-react';

// تعريف الأنواع
type ContractDetail = {
  id: number;
  project_name: string;
  client_name: string;
  value: number;
  status: string;
  start_date: string;
  end_date: string;
  total_expenses: number;
  completion_rate: number;
  pdf_url: string;
  manager_id: number;
  users?: { full_name: string }; // اسم المشرف (Join)
};

type Employee = {
  id: number;
  full_name: string;
  job_title: string;
};

// تعريف نوع الـ Props للصفحة الديناميكية
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContractDetailsPage({ params }: PageProps) {
  // فك تغليف الـ params باستخدام use() في Next.js 15+ أو التعامل معها كـ Promise
  const resolvedParams = use(params);
  const contractId = resolvedParams.id;

  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    setLoading(true);

    // 1. جلب تفاصيل العقد + اسم المشرف
    const { data: contractData, error } = await supabase
      .from('contracts')
      .select('*, users:manager_id(full_name)') // نفترض أن manager_id مربوط بجدول users
      .eq('id', contractId)
      .single();

    if (contractData) {
      // تصحيح نوع البيانات القادمة من الـ Join
      const formattedContract = {
        ...contractData,
        users: Array.isArray(contractData.users) ? contractData.users[0] : contractData.users
      };
      setContract(formattedContract);

      // 2. جلب الموظفين العاملين تحت هذا المشرف (كفريق للعقد)
      if (contractData.manager_id) {
        const { data: teamData } = await supabase
          .from('users')
          .select('id, full_name, job_title')
          .eq('supervisor_id', contractData.manager_id);
        
        if (teamData) setTeam(teamData);
      }
    }
    setLoading(false);
  };

  // حساب الأيام المتبقية
  const calculateDaysLeft = (endDate: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // تنسيق العملة
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) return <div className="text-center mt-20 text-slate-400">جاري تحميل تفاصيل العقد...</div>;
  if (!contract) return <div className="text-center mt-20 text-red-500">العقد غير موجود أو تم حذفه.</div>;

  const netProfit = contract.value - contract.total_expenses;
  const daysLeft = calculateDaysLeft(contract.end_date);

  return (
    <div className="space-y-8 font-sans pb-10" dir="rtl">
      
      {/* رأس الصفحة وزر العودة */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 text-slate-500 transition">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-800">{contract.project_name}</h1>
            <p className="text-slate-500 text-sm">العميل: {contract.client_name}</p>
        </div>
        <div className={`mr-auto px-4 py-2 rounded-xl text-sm font-bold ${
            contract.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
            {contract.status === 'Approved' ? 'مشروع نشط' : 'قيد المراجعة'}
        </div>
      </div>

      {/* بطاقات المعلومات الرئيسية (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* الميزانية والربح */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 md:col-span-2">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div>
                        <p className="text-xs text-slate-400 mb-1">قيمة العقد الإجمالية</p>
                        <p className="text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(contract.value)}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">المصاريف حتى الآن</p>
                        <p className="text-xl font-bold text-red-500" dir="ltr">{formatCurrency(contract.total_expenses)}</p>
                    </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign /></div>
            </div>
            
            {/* شريط الربح */}
            <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">صافي الربح المتوقع:</span>
                <span className="text-lg font-bold text-green-600" dir="ltr">{formatCurrency(netProfit)}</span>
            </div>
        </div>

        {/* الإنجاز والوقت */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between mb-2">
                <span className="text-slate-500 text-xs font-bold">نسبة الإنجاز</span>
                <span className="text-blue-600 font-bold">{contract.completion_rate}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${contract.completion_rate}%` }}></div>
            </div>
            
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <Clock size={18} className="text-amber-500" />
                <div>
                    <p className="text-xs text-slate-400">المدة المتبقية</p>
                    <p className="font-bold text-slate-800">{daysLeft} يوم</p>
                </div>
            </div>
        </div>

        {/* فريق العمل */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-purple-600" />
                <h3 className="font-bold text-sm">القوة البشرية</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">المشرف المسؤول:</span>
                    <span className="font-bold">{contract.users?.full_name || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">عدد الفنيين:</span>
                    <span className="font-bold">{team.length} أفراد</span>
                </div>
            </div>
            <button className="w-full mt-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition">
                عرض تفاصيل الفريق
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* القسم الأيمن: تفاصيل وعرض PDF */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText className="text-slate-400" /> وثيقة العقد الرسمية
                </h3>
                
                {contract.pdf_url ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600 font-medium mb-2">ملف العقد متاح للمعاينة</p>
                        <div className="flex justify-center gap-3">
                            <a 
                                href={contract.pdf_url} 
                                target="_blank" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <FileText size={16} /> فتح العقد (PDF)
                            </a>
                            <a 
                                href={contract.pdf_url} 
                                download
                                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2"
                            >
                                <Download size={16} /> تحميل
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
                        <AlertTriangle className="mx-auto mb-2" />
                        لم يتم إرفاق ملف PDF لهذا العقد بعد.
                    </div>
                )}
            </div>

            {/* تفاصيل التواريخ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                    <span className="text-xs text-green-600 font-bold block mb-1">تاريخ البدء</span>
                    <div className="flex items-center gap-2 font-bold text-green-800">
                        <Calendar size={18} /> {contract.start_date || 'غير محدد'}
                    </div>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                    <span className="text-xs text-red-600 font-bold block mb-1">تاريخ النهاية</span>
                    <div className="flex items-center gap-2 font-bold text-red-800">
                        <Clock size={18} /> {contract.end_date || 'غير محدد'}
                    </div>
                </div>
            </div>
        </div>

        {/* القسم الأيسر: فريق العمل */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="text-slate-400" /> الفريق المنفذ
            </h3>
            <div className="space-y-4">
                {team.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">لا يوجد فريق مرتبط بالمشرف حالياً.</p>
                ) : team.map((member, i) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm text-slate-600">
                            {i + 1}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-slate-800">{member.full_name}</div>
                            <div className="text-xs text-slate-500">{member.job_title}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}