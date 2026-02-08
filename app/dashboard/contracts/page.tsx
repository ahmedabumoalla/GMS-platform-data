'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Calendar, DollarSign, Users, 
  ArrowRight, Download, Clock, AlertTriangle, X, Phone, Mail, 
  TrendingUp, Activity
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
  manager_name?: string; 
};

type Employee = {
  id: number;
  full_name: string;
  job_title: string;
  phone?: string;
  email?: string;
  project_performance: number; // الأداء في المشروع
  overall_performance: number; // الأداء العام
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContractDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const contractId = resolvedParams.id;

  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالة المودال
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    setLoading(true);

    // محاكاة جلب البيانات
    setTimeout(() => {
        // بيانات العقد (معربة)
        setContract({
            id: Number(contractId),
            project_name: "صيانة إنارة الشوارع - حي العليا",
            client_name: "أمانة منطقة الرياض",
            value: 500000,
            status: "Approved",
            start_date: "2024-01-15",
            end_date: "2024-12-31",
            total_expenses: 125000,
            completion_rate: 35,
            pdf_url: "", 
            manager_id: 101,
            manager_name: "م. أحمد الغامدي"
        });

        // بيانات الفريق (معربة)
        setTeam([
            { 
              id: 1, full_name: "سعيد القحطاني", job_title: "فني كهرباء", 
              phone: "050xxxxxxx", email: "saeed@gms.com", 
              project_performance: 92, overall_performance: 88 
            },
            { 
              id: 2, full_name: "محمد علي", job_title: "مساعد فني", 
              phone: "055xxxxxxx", email: "m.ali@gms.com",
              project_performance: 85, overall_performance: 82 
            },
            { 
              id: 3, full_name: "خالد العتيبي", job_title: "مشرف سلامة", 
              phone: "056xxxxxxx", email: "khaled@gms.com",
              project_performance: 98, overall_performance: 95 
            },
            { 
              id: 4, full_name: "عمر فاروق", job_title: "مهندس موقع", 
              phone: "054xxxxxxx", email: "omar@gms.com",
              project_performance: 78, overall_performance: 80 
            },
            { 
              id: 5, full_name: "ياسر الحربي", job_title: "مشغل معدات", 
              phone: "059xxxxxxx", email: "yasser@gms.com",
              project_performance: 88, overall_performance: 90 
            },
        ]);

        setLoading(false);
    }, 1000);
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

  // تنسيق العملة (ريال سعودي)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  // دالة لتحديد لون الأداء
  const getPerfColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    return 'text-amber-600 bg-amber-50';
  };

  if (loading) return <div className="text-center mt-20 text-slate-400">جاري تحميل تفاصيل العقد...</div>;
  if (!contract) return <div className="text-center mt-20 text-red-500">العقد غير موجود أو تم حذفه.</div>;

  const netProfit = contract.value - contract.total_expenses;
  const daysLeft = calculateDaysLeft(contract.end_date);

  return (
    <div className="space-y-8 font-sans pb-10" dir="rtl">
      
      {/* الترويسة وزر العودة */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 text-slate-500 transition">
            {/* في RTL نستخدم السهم لليمين للرجوع للخلف */}
            <ArrowRight size={20} />
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

      {/* بطاقات المؤشرات (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* الميزانية والربح */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 md:col-span-2">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                    <div>
                        <p className="text-xs text-slate-400 mb-1">إجمالي قيمة العقد</p>
                        <p className="text-2xl font-bold text-slate-800" dir="ltr">{formatCurrency(contract.value)}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 mx-2"></div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">إجمالي المصروفات</p>
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

        {/* ملخص القوى العاملة */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-purple-600" />
                <h3 className="font-bold text-sm">القوى العاملة</h3>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">مدير المشروع:</span>
                    <span className="font-bold text-slate-800">{contract.manager_name || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">الفنيين:</span>
                    <span className="font-bold text-slate-800">{team.length} أعضاء</span>
                </div>
            </div>
            {/* زر فتح المودال */}
            <button 
                onClick={() => setIsTeamModalOpen(true)}
                className="w-full mt-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition"
            >
                عرض تفاصيل الفريق
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* القسم الأيمن: التفاصيل والملفات */}
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

        {/* القسم الأيسر: معاينة الفريق */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="text-slate-400" /> الفريق النشط
            </h3>
            <div className="space-y-4">
                {team.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">لا يوجد فريق معين حالياً.</p>
                ) : team.slice(0, 3).map((member, i) => (
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
                {team.length > 3 && (
                     <div className="text-center text-xs text-slate-400 pt-2">
                        + {team.length - 3} أعضاء آخرين (اضغط عرض التفاصيل)
                     </div>
                )}
            </div>
        </div>

      </div>

      {/* --- نافذة الفريق المنبثقة (Modal) --- */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* رأس النافذة */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">قائمة القوى العاملة الكاملة</h3>
                        <p className="text-xs text-slate-500">الموظفين والفنيين المعينين لهذا المشروع.</p>
                    </div>
                    <button onClick={() => setIsTeamModalOpen(false)} className="p-2 bg-white hover:bg-slate-200 text-slate-500 rounded-full transition border border-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* جسم النافذة */}
                <div className="overflow-y-auto p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 gap-4">
                        {/* كارت المدير */}
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center font-bold text-lg">
                                {contract.manager_name?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800">{contract.manager_name}</div>
                                <div className="text-xs text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full w-fit mt-1">مدير المشروع</div>
                            </div>
                        </div>

                        {/* قائمة الفريق مع الأداء */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.map((member) => (
                                <div key={member.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition group flex flex-col justify-between">
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-bold text-slate-800 text-base">{member.full_name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 font-medium">{member.job_title}</div>
                                        </div>
                                        <div className="text-[10px] text-slate-300 font-mono">الرقم: {member.id}</div>
                                    </div>

                                    {/* قسم إحصائيات الأداء */}
                                    <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex flex-col items-center justify-center p-1">
                                            <span className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                                                <TrendingUp size={10} /> أداء المشروع
                                            </span>
                                            <span className={`text-sm font-black px-2 py-0.5 rounded ${getPerfColor(member.project_performance)}`}>
                                                {member.project_performance}%
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-1 border-r border-slate-200">
                                            <span className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                                                <Activity size={10} /> الأداء العام
                                            </span>
                                            <span className={`text-sm font-black px-2 py-0.5 rounded ${getPerfColor(member.overall_performance)}`}>
                                                {member.overall_performance}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-50 flex gap-2 mt-auto">
                                        <button className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                                            <Phone size={14}/> اتصال
                                        </button>
                                        <button className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                                            <Mail size={14}/> بريد
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* تذييل النافذة */}
                <div className="p-4 bg-white border-t border-slate-100 text-center">
                    <button onClick={() => setIsTeamModalOpen(false)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">
                        إغلاق القائمة
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}