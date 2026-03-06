'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    FileSignature, AlertTriangle, ShieldCheck, UserMinus, Building, 
    DollarSign, ArrowLeft, ArrowRight, Loader2, 
    Printer, Save, Stamp, Info, Send
} from 'lucide-react';
import { useDashboard } from '../../../layout';
import Image from 'next/image';

export default function AdministrativeActionsPage() {
    const params = useParams();
    const router = useRouter();
    const employeeId = params.id as string;
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [employee, setEmployee] = useState<any>(null);

    // Form States
    const [selectedCategory, setSelectedCategory] = useState<string>('disciplinary');
    const [selectedActionIndex, setSelectedActionIndex] = useState<number>(0);
    const [customActionTitle, setCustomActionTitle] = useState('');
    const [reason, setReason] = useState('');
    const [actionDetails, setActionDetails] = useState(''); 
    
    // Auto-generated Metadata
    const [referenceNumber, setReferenceNumber] = useState('');
    const [actionDate, setActionDate] = useState('');

    // --- 🚀 القاموس الذكي المزدوج (Bilingual Dictionary) 🚀 ---
    const t = {
        ar: {
            title: 'إصدار قرار إداري',
            employee: 'الموظف',
            authDirect: 'صلاحية اعتماد فوري',
            authPending: 'صلاحية رفع للمراجعة',
            catTitle: '1. تصنيف القرار',
            detailsTitle: '2. نوع القرار والتفاصيل',
            selectAction: 'حدد الإجراء بدقة:',
            customTitleLabel: 'عنوان القرار المخصص:',
            customTitlePlaceholder: 'اكتب عنوان القرار هنا...',
            reasonLabel: 'المبررات والأسباب (ستطبع في النموذج):',
            reasonPlaceholder: 'بناءً على المخالفة المرتكبة يوم كذا... / أو بناءً على التميز في الأداء...',
            detailsLabel: 'تفاصيل إضافية (مبلغ الخصم، الفرع المنقول إليه... اختياري):',
            detailsPlaceholder: 'مثال: خصم مبلغ 500 ريال / نقل لفرع جدة...',
            saveBtn: 'حفظ واعتماد القرار فوراً',
            sendBtn: 'إرسال القرار للأدمن للاعتماد',
            previewTitle: 'المعاينة الحية للنموذج',
            // A4 Texts
            a4Header: 'إدارة الموارد البشرية',
            a4SubHeader: 'HUMAN RESOURCES DEPT.',
            a4Ref: 'الرقم المرجعي:',
            a4Date: 'التاريخ:',
            a4Greeting: 'المكرم /',
            a4Respect: 'المحترم،',
            a4EmpId: 'الرقم الوظيفي:',
            a4JobTitle: 'المسمى الوظيفي:',
            a4Branch: 'القسم/الفرع:',
            a4NationalId: 'رقم الهوية:',
            a4BodyIntro: 'إشارةً إلى الموضوع أعلاه، وبناءً على الصلاحيات الممنوحة لإدارة الموارد البشرية، فقد تقرر الآتي:',
            a4EmptyReason: 'يتم كتابة المبررات والأسباب هنا...',
            a4DetailsPrefix: 'تفاصيل القرار:',
            a4SigEmp: 'توقيع الموظف المذكور',
            a4SigManager: 'المدير المباشر',
            a4SigHR: 'اعتماد الموارد البشرية',
            alertReasonReq: 'الرجاء كتابة المبررات وأسباب القرار.',
            alertCustomReq: 'الرجاء كتابة عنوان الإجراء المخصص.',
            alertSuccess: 'تم حفظ القرار بنجاح!'
        },
        en: {
            title: 'Issue HR Action',
            employee: 'Employee',
            authDirect: 'Direct Approval Authority',
            authPending: 'Pending Review Authority',
            catTitle: '1. Action Category',
            detailsTitle: '2. Action Type & Details',
            selectAction: 'Select exact action:',
            customTitleLabel: 'Custom Action Title:',
            customTitlePlaceholder: 'Type custom title here...',
            reasonLabel: 'Reasons & Justifications (Printed on form):',
            reasonPlaceholder: 'Based on the violation committed on... / Or based on excellent performance...',
            detailsLabel: 'Additional Details (Deduction amount, new branch... optional):',
            detailsPlaceholder: 'e.g., Deduction of 500 SAR / Transfer to Jeddah branch...',
            saveBtn: 'Save & Approve Immediately',
            sendBtn: 'Send to Admin for Approval',
            previewTitle: 'Live Form Preview',
            // A4 Texts
            a4Header: 'Human Resources Dept.',
            a4SubHeader: 'إدارة الموارد البشرية',
            a4Ref: 'Ref No:',
            a4Date: 'Date:',
            a4Greeting: 'Dear /',
            a4Respect: ',',
            a4EmpId: 'Employee ID:',
            a4JobTitle: 'Job Title:',
            a4Branch: 'Dept/Branch:',
            a4NationalId: 'National ID:',
            a4BodyIntro: 'With reference to the above subject, and based on the authorities granted to the HR Dept, it has been decided:',
            a4EmptyReason: 'Reasons and justifications will appear here...',
            a4DetailsPrefix: 'Action Details:',
            a4SigEmp: 'Employee Signature',
            a4SigManager: 'Direct Manager',
            a4SigHR: 'HR Approval',
            alertReasonReq: 'Please provide reasons and justifications.',
            alertCustomReq: 'Please provide a title for the custom action.',
            alertSuccess: 'Action saved successfully!'
        }
    };

    const text = isRTL ? t.ar : t.en;

    const ACTION_CATEGORIES = {
        disciplinary: {
            title: isRTL ? 'إجراءات تأديبية' : 'Disciplinary Actions',
            icon: AlertTriangle,
            color: 'rose',
            actions: isRTL 
                ? ['لفت نظر شفهي', 'لفت نظر كتابي', 'إنذار أول', 'إنذار ثاني', 'إنذار نهائي', 'إيقاف عن العمل', 'توبيخ لسوء السلوك', 'إنذار بغياب/تأخير']
                : ['Verbal Warning', 'Written Warning', 'First Warning', 'Second Warning', 'Final Warning', 'Suspension', 'Misconduct Reprimand', 'Absence/Lateness Warning']
        },
        financial: {
            title: isRTL ? 'إجراءات مالية' : 'Financial Actions',
            icon: DollarSign,
            color: 'emerald',
            actions: isRTL
                ? ['خصم من الراتب', 'منح مكافأة', 'صرف سلفة', 'تعديل راتب', 'وقف صرف راتب']
                : ['Salary Deduction', 'Bonus Grant', 'Advance Payment', 'Salary Adjustment', 'Salary Suspension']
        },
        organizational: {
            title: isRTL ? 'إجراءات تنظيمية' : 'Organizational',
            icon: Building,
            color: 'blue',
            actions: isRTL
                ? ['نقل فرع/مشروع', 'تغيير مسمى وظيفي', 'ترقية', 'تعديل ساعات العمل']
                : ['Branch/Project Transfer', 'Job Title Change', 'Promotion', 'Working Hours Change']
        },
        eos: {
            title: isRTL ? 'نهاية الخدمة' : 'End of Service',
            icon: UserMinus,
            color: 'slate',
            actions: isRTL
                ? ['إنهاء عقد', 'قبول استقالة', 'عدم تجديد عقد', 'إلغاء فترة التجربة']
                : ['Contract Termination', 'Resignation Acceptance', 'Non-renewal of Contract', 'Probation Cancellation']
        },
        custom: {
            title: isRTL ? 'إجراء مخصص' : 'Custom Action',
            icon: FileSignature,
            color: 'purple',
            actions: isRTL ? ['إجراء إداري مخصص'] : ['Custom HR Action']
        }
    };

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from('profiles').select('*').eq('id', employeeId).single();
                if (data) setEmployee(data);
                
                const date = new Date();
                setActionDate(date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
                setReferenceNumber(`DEC-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`);
                
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        initData();
    }, [employeeId, isRTL]);

    const handleCategoryChange = (catKey: string) => {
        setSelectedCategory(catKey);
        setSelectedActionIndex(0); // Reset to first action in the new category
    };

    const submitAction = async () => {
        if (!reason.trim()) return alert(text.alertReasonReq);
        const finalTitle = selectedCategory === 'custom' ? customActionTitle : ACTION_CATEGORIES[selectedCategory as keyof typeof ACTION_CATEGORIES].actions[selectedActionIndex];
        if (selectedCategory === 'custom' && !finalTitle.trim()) return alert(text.alertCustomReq);

        setSubmitting(true);
        try {
            const decisionStatus = isAdmin ? 'Approved' : 'Pending Approval';

            const { error } = await supabase.from('hr_actions').insert({
                employee_id: employee.id,
                created_by: user?.id,
                reference_number: referenceNumber,
                action_category: selectedCategory,
                action_type: ACTION_CATEGORIES[selectedCategory as keyof typeof ACTION_CATEGORIES].actions[selectedActionIndex], // تخزين الاسم الإنجليزي أو العربي كنوع
                action_title: finalTitle,
                reason: reason,
                details: { additional_notes: actionDetails },
                status: decisionStatus
            });

            if (error) throw error;

            if (!isAdmin) {
                await supabase.from('notifications').insert({
                    user_id: null,
                    title_ar: 'قرار إداري يتطلب الاعتماد',
                    title_en: 'HR Action Requires Approval',
                    message_ar: `قام ${user?.full_name} برفع قرار (${finalTitle}) للموظف ${employee.full_name}`,
                    message_en: `${user?.full_name} submitted an action (${finalTitle}) for ${employee.full_name}`,
                    category: 'HR',
                    severity: 'warning'
                });
            }

            alert(`${text.alertSuccess} Status: ${decisionStatus}`);
            router.back();
            
        } catch (error: any) { alert('Error: ' + error.message); } finally { setSubmitting(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50}/></div>;
    if (!employee) return <div className="h-screen flex items-center justify-center font-bold">Employee not found</div>;

    const currentCatDef = ACTION_CATEGORIES[selectedCategory as keyof typeof ACTION_CATEGORIES];
    const finalActionTitle = selectedCategory === 'custom' ? (customActionTitle || (isRTL ? 'إجراء إداري' : 'HR Action')) : currentCatDef.actions[selectedActionIndex];

    return (
        <div className={`min-h-screen font-sans pb-24 ${isDark ? 'bg-slate-950' : 'bg-slate-50'} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <header className={`sticky top-0 z-40 px-8 py-5 border-b backdrop-blur-xl flex items-center justify-between shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
                    </button>
                    <div>
                        <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{text.title}</h1>
                        <p className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-2">{text.employee}: {employee.full_name} <span className="text-slate-400 font-mono">(ID: {employee.employee_id})</span></p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    <ShieldCheck size={16}/> {isAdmin ? text.authDirect : text.authPending}
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 🛑 النصف الأول: لوحة التحكم */}
                <div className="space-y-6">
                    <div className={`p-6 rounded-[2rem] shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{text.catTitle}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(ACTION_CATEGORIES).map(([key, data]) => {
                                const isSelected = selectedCategory === key;
                                const Icon = data.icon;
                                return (
                                    <button 
                                        key={key} onClick={() => handleCategoryChange(key)}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${isSelected ? `border-${data.color}-500 bg-${data.color}-50 dark:bg-${data.color}-900/20 shadow-md transform -translate-y-1` : `border-slate-100 dark:border-slate-800 hover:border-${data.color}-300 bg-transparent`}`}
                                    >
                                        <Icon size={24} className={`mb-2 ${isSelected ? `text-${data.color}-600 dark:text-${data.color}-400` : 'text-slate-400'}`}/>
                                        <span className={`text-[11px] font-bold leading-tight ${isSelected ? `text-${data.color}-700 dark:text-${data.color}-300` : 'text-slate-500'}`}>{data.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{text.detailsTitle}</h3>
                        
                        <div className="space-y-5">
                            {selectedCategory !== 'custom' ? (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">{text.selectAction}</label>
                                    <select value={selectedActionIndex} onChange={e=>setSelectedActionIndex(Number(e.target.value))} className={`w-full p-4 rounded-2xl outline-none font-black text-sm border cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                        {currentCatDef.actions.map((act, idx) => <option key={idx} value={idx}>{act}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">{text.customTitleLabel}</label>
                                    <input type="text" value={customActionTitle} onChange={e=>setCustomActionTitle(e.target.value)} placeholder={text.customTitlePlaceholder} className={`w-full p-4 rounded-2xl outline-none font-black text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2"><Info size={14}/> {text.reasonLabel}</label>
                                <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} placeholder={text.reasonPlaceholder} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">{text.detailsLabel}</label>
                                <input type="text" value={actionDetails} onChange={e=>setActionDetails(e.target.value)} placeholder={text.detailsPlaceholder} className={`w-full p-3 rounded-xl outline-none font-bold text-sm border ${isDark ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-slate-50/50 border-slate-200 text-slate-900'}`} />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={submitAction} disabled={submitting} className={`w-full py-5 rounded-[1.5rem] font-black text-lg shadow-xl flex items-center justify-center gap-3 transition active:scale-95 disabled:opacity-50 ${isAdmin ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 shadow-blue-600/20'}`}>
                                {submitting ? <Loader2 className="animate-spin" size={24}/> : (isAdmin ? <Save size={24}/> : <Send size={24}/>)}
                                {isAdmin ? text.saveBtn : text.sendBtn}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 📝 النصف الثاني: النموذج الذكي الحقيقي (Live A4 Preview) */}
                <div className="flex flex-col items-center justify-start">
                    <div className="w-full flex justify-between items-end mb-4 px-2">
                        <h3 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Printer size={16}/> {text.previewTitle}</h3>
                    </div>
                    
                    {/* الورقة A4 (هنا يتم استخدام اتجاه اللغة بذكاء داخل الورقة لتتوافق مع طباعة حقيقية) */}
                    <div className={`w-full max-w-[210mm] aspect-[1/1.414] bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col print:shadow-none print:w-full print:h-screen text-slate-900 border border-slate-200 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                        
                        {/* Watermark Logo */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
                            <img src="/logo1.png" alt="GMS Watermark" className="w-3/4 max-w-[500px] object-contain" />
                        </div>

                        {/* A4 Header */}
                        <div className="p-8 md:p-12 border-b-2 border-slate-100 flex justify-between items-start bg-slate-50/30 relative z-10">
                            <div className="text-left rtl:text-right space-y-1 text-xs font-bold text-slate-600 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div><span className="text-slate-400">{text.a4Ref}</span> <span className="font-mono text-blue-700">{referenceNumber}</span></div>
                                <div><span className="text-slate-400">{text.a4Date}</span> {actionDate}</div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="w-32 h-24 flex items-center justify-center overflow-hidden">
                                    <img src="/logo1.png" alt="GMS Logo" className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <div className="text-center mt-2">
                                    <h1 className="font-black text-lg tracking-tight text-slate-900">{text.a4Header}</h1>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{text.a4SubHeader}</p>
                                </div>
                            </div>
                        </div>

                        {/* A4 Body */}
                        <div className="flex-1 p-8 md:p-12 z-10">
                            <h2 className="text-center text-2xl font-black underline underline-offset-8 decoration-2 decoration-slate-300 mb-10 text-slate-900">{finalActionTitle}</h2>
                            
                            <div className="space-y-6">
                                <p className="text-base font-bold leading-loose text-slate-800">
                                    {text.a4Greeting} <span className="text-blue-700 bg-blue-50 px-2 rounded">{employee.full_name}</span> {text.a4Respect}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700">
                                    <div>{text.a4EmpId} <span className="font-mono">{employee.employee_id}</span></div>
                                    <div>{text.a4JobTitle} {employee.job_title}</div>
                                    <div>{text.a4Branch} {employee.branch || employee.region}</div>
                                    <div>{text.a4NationalId} <span className="font-mono">{employee.national_id}</span></div>
                                </div>

                                <div className="pt-4">
                                    <p className="text-sm font-bold text-slate-800 leading-loose">
                                        {text.a4BodyIntro}
                                    </p>
                                    
                                    <div className={`mt-4 p-5 border-l-4 rounded-l-xl text-sm font-bold leading-loose whitespace-pre-wrap shadow-inner ${isRTL ? 'border-r-4 border-l-0 rounded-l-none rounded-r-xl' : ''} bg-slate-50 border-slate-800 text-slate-900`}>
                                        {reason || <span className="text-slate-300 italic">{text.a4EmptyReason}</span>}
                                    </div>

                                    {actionDetails && (
                                        <div className="mt-6 text-sm font-bold text-slate-800 flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                            <span className="w-2 h-2 rounded-full bg-blue-600"></span> {text.a4DetailsPrefix} <span className="text-blue-700">{actionDetails}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* A4 Footer (Signatures) */}
                        <div className="p-8 md:p-12 mt-auto pt-10 z-10">
                            <div className="grid grid-cols-3 gap-8 text-center text-sm font-bold text-slate-800 border-t-2 border-slate-100 pt-8">
                                <div className="space-y-12">
                                    <div className="text-slate-500">{text.a4SigEmp}</div>
                                    <div className="border-b border-dashed border-slate-400 mx-4"></div>
                                </div>
                                <div className="space-y-12">
                                    <div className="text-slate-500">{text.a4SigManager}</div>
                                    <div className="border-b border-dashed border-slate-400 mx-4"></div>
                                </div>
                                <div className="space-y-12">
                                    <div className="text-slate-500">{text.a4SigHR}</div>
                                    <div className="border-b border-dashed border-slate-400 mx-4"></div>
                                </div>
                            </div>
                            <div className="text-center mt-10 text-[10px] text-slate-400 font-bold font-mono border-t border-slate-100 pt-4">
                                Generated by GMS System | Ref: {referenceNumber} | {new Date().toISOString()}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}