'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    ArrowLeft, ArrowRight, MapPin, Calendar, Wrench, 
    FileText, Users, Plus, Save, Loader2, 
    Trash2, Search, CheckCircle2, X, Briefcase, Phone, Building, Clock
} from 'lucide-react';
import { useDashboard } from '../../../layout';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectAssignmentPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // بيانات المشروع والفنيين
    const [project, setProject] = useState<any>(null);
    const [availableTechs, setAvailableTechs] = useState<any[]>([]);
    
    // الفرق (تم إضافة team_zone)
    const [teams, setTeams] = useState<{ id: string, name: string, zone: string, members: any[] }[]>([]);
    
    // التحكم بالنافذة
    const [isSelectTechModalOpen, setSelectTechModalOpen] = useState(false);
    const [activeTeamIdForSelection, setActiveTeamIdForSelection] = useState<string | null>(null);
    const [techSearch, setTechSearch] = useState('');

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            try {
                const { data: projData, error: projErr } = await supabase.from('projects').select('*').eq('id', projectId).single();
                if (projErr) throw projErr;
                setProject(projData);

                const { data: techsData } = await supabase.from('profiles')
                    .select('id, full_name, employee_id, job_title, role, phone, email, region, branch, start_date')
                    .in('role', ['technician', 'engineer'])
                    .eq('status', 'active');
                setAvailableTechs(techsData || []);

                const { data: assignments } = await supabase.from('task_assignments').select('*').eq('project_id', projectId);

                if (assignments && assignments.length > 0) {
                    const grouped = assignments.reduce((acc: any, curr: any) => {
                        const tName = curr.team_name || 'الفرقة الأساسية';
                        if (!acc[tName]) acc[tName] = { zone: curr.team_zone || '', members: [] };
                        
                        const techProfile = techsData?.find(t => t.id === curr.tech_id);
                        if (techProfile) acc[tName].members.push(techProfile);
                        return acc;
                    }, {});

                    const loadedTeams = Object.keys(grouped).map((teamName, index) => ({
                        id: `team-${Date.now()}-${index}`,
                        name: teamName,
                        zone: grouped[teamName].zone,
                        members: grouped[teamName].members
                    }));
                    setTeams(loadedTeams);
                } else {
                    setTeams([{ id: `team-${Date.now()}`, name: 'الفرقة الأولى', zone: '', members: [] }]);
                }

            } catch (error) { console.error("Error", error); } finally { setLoading(false); }
        };
        fetchProjectDetails();
    }, [projectId]);

    // --- حسابات ذكية ---
    const getDaysLeft = (endDate: string) => {
        if (!endDate) return { text: 'غير محدد', color: 'text-slate-500' };
        const diff = new Date(endDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, color: 'text-red-500 font-bold' };
        if (days === 0) return { text: 'ينتهي اليوم!', color: 'text-amber-500 font-bold' };
        return { text: `متبقي ${days} يوم`, color: 'text-emerald-500 font-bold' };
    };

    const getCompanyTenure = (startDate: string) => {
        if (!startDate) return 'غير محدد';
        const diffDays = Math.floor(Math.abs(new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        if (years > 0) return `${years} سنة ${months > 0 ? `و ${months} شهر` : ''}`;
        if (months > 0) return `${months} شهر`;
        return `${diffDays} يوم`;
    };

    // --- إدارة الفرق ---
    const addNewTeam = () => setTeams([...teams, { id: `team-${Date.now()}`, name: `فرقة جديدة ${teams.length + 1}`, zone: '', members: [] }]);
    const updateTeamName = (id: string, newName: string) => setTeams(teams.map(t => t.id === id ? { ...t, name: newName } : t));
    const updateTeamZone = (id: string, newZone: string) => setTeams(teams.map(t => t.id === id ? { ...t, zone: newZone } : t));
    const removeTeam = (id: string) => { if (confirm('تأكيد حذف الفرقة؟')) setTeams(teams.filter(t => t.id !== id)); };
    const removeMemberFromTeam = (teamId: string, memberId: string) => setTeams(teams.map(t => t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t));

    // --- اختيار الفنيين ---
    const openSelectModal = (teamId: string) => { setActiveTeamIdForSelection(teamId); setTechSearch(''); setSelectTechModalOpen(true); };
    const toggleTechInActiveTeam = (tech: any) => {
        if (!activeTeamIdForSelection) return;
        setTeams(teams.map(t => {
            if (t.id === activeTeamIdForSelection) {
                const isMember = t.members.some(m => m.id === tech.id);
                return { ...t, members: isMember ? t.members.filter(m => m.id !== tech.id) : [...t.members, tech] };
            }
            return t;
        }));
    };

    // --- الحفظ ---
    const saveAssignments = async () => {
        setSaving(true);
        try {
            await supabase.from('task_assignments').delete().eq('project_id', projectId);

            const newAssignments: any[] = [];
            teams.forEach(team => {
                // 🚀 الذكاء هنا: إذا كان المشروع فيه نطاق واحد، يتم إسناده تلقائياً للفرقة حتى لو لم يتم تحديده
                const assignedZone = project.work_zones?.length === 1 ? project.work_zones[0].region : team.zone;

                team.members.forEach(member => {
                    newAssignments.push({
                        project_id: projectId,
                        tech_id: member.id,
                        assigned_by: user?.id,
                        status: 'Pending', 
                        team_name: team.name,
                        team_zone: assignedZone 
                    });
                });
            });

            if (newAssignments.length > 0) {
                const { error } = await supabase.from('task_assignments').insert(newAssignments);
                if (error) throw error;
            }

            alert(isRTL ? 'تم حفظ التكليفات بنجاح!' : 'Saved successfully!');
            router.push('/dashboard/projects/assign');

        } catch (error: any) { alert("Error: " + error.message); } finally { setSaving(false); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50}/></div>;
    if (!project) return <div className="h-screen flex items-center justify-center text-slate-500">المشروع غير موجود</div>;

    // --- Colors & UI Elements ---
    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const textSub = isDark ? "text-slate-400" : "text-slate-500";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const teamHeaderBg = isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200";
    const memberItemBg = isDark ? "bg-slate-900 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300";

    const hasMultipleZones = project.work_zones && project.work_zones.length > 1;

    return (
        <div className={`min-h-screen font-sans pb-24 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* --- شريط الأدوات العلوي --- */}
            <header className={`sticky top-0 z-40 px-8 py-5 border-b backdrop-blur-xl flex items-center justify-between shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
                    </button>
                    <div>
                        <h1 className={`text-2xl font-black ${textMain}`}>{isRTL ? 'غرفة عمليات وإسناد المشروع' : 'Operations Room'}</h1>
                        <p className="text-xs font-mono text-blue-500 font-bold mt-1">PRJ-{project.id.substring(0,8).toUpperCase()}</p>
                    </div>
                </div>
                <button onClick={saveAssignments} disabled={saving} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50">
                    {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {isRTL ? 'اعتماد التكليفات' : 'Save'}
                </button>
            </header>

            <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                
                {/* === العمود الأيمن: تفاصيل المشروع الأساسية === */}
                <div className="lg:col-span-4 space-y-6">
                    <div className={`p-8 rounded-[2.5rem] shadow-sm border ${cardBg}`}>
                        <h2 className={`text-2xl font-black leading-tight mb-6 ${textMain}`}>{project.title}</h2>
                        
                        <div className="space-y-6">
                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-blue-950/30 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="text-blue-500 shrink-0" size={20}/>
                                    <div className="text-xs font-bold text-slate-500 uppercase">الجدول الزمني للعمل</div>
                                </div>
                                <div className={`text-base font-black ${textMain}`}>{project.start_date} ➝ {project.end_date}</div>
                                <div className={`text-xs mt-1 ${getDaysLeft(project.end_date).color}`}>{getDaysLeft(project.end_date).text}</div>
                            </div>

                            {/* 🚀 عرض نطاقات العمل (Zones) بدلاً من الموقع الواحد */}
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><MapPin size={14}/> مواقع ونطاقات العمل المعتمدة</div>
                                {project.work_zones && project.work_zones.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.work_zones.map((zone:any, idx:number) => (
                                            <div key={idx} className={`p-3 rounded-xl text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                                <span className="text-blue-500 mr-2 rtl:ml-2">#</span>{zone.region} 
                                                <span className="text-[10px] font-normal text-slate-500 block mt-1">{zone.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm font-bold text-slate-500">{project.location_name || 'غير محدد'}</div>
                                )}
                            </div>

                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Wrench size={14}/> المعدات المصروفة</div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {project.required_tools ? project.required_tools.split('،').map((tool:string, i:number) => (
                                        <span key={i} className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{tool.trim()}</span>
                                    )) : <span className="text-xs text-slate-500">لا يوجد معدات مسجلة</span>}
                                </div>
                            </div>

                            {project.project_notes && (
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1"><FileText size={12}/> ملاحظات الإدارة</div>
                                    <p className={`text-sm font-bold ${isDark ? 'text-amber-400/80' : 'text-amber-800'}`}>{project.project_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === العمود الأيسر: إدارة وهيكلة الفرق === */}
                <div className="lg:col-span-8 space-y-6">
                    
                    <div className={`flex justify-between items-center p-3 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className={`px-3 font-black text-sm ${textMain}`}>الفرق العاملة في المشروع ({teams.length})</div>
                        <button onClick={addNewTeam} className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2">
                            <Plus size={14}/> إنشاء فرقة إضافية
                        </button>
                    </div>

                    <div className="space-y-6">
                        {teams.map((team, index) => (
                            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={team.id} className={`rounded-[2rem] border overflow-hidden shadow-sm ${cardBg}`}>
                                
                                {/* 🚀 ترويسة الفرقة مع خيار اختيار الموقع */}
                                <div className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${teamHeaderBg}`}>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-inner">{index + 1}</div>
                                        <input 
                                            type="text" 
                                            value={team.name} 
                                            onChange={(e) => updateTeamName(team.id, e.target.value)}
                                            className={`bg-transparent border-none outline-none font-black text-xl w-full focus:ring-0 placeholder:text-slate-400 ${textMain}`}
                                            placeholder="اسم الفرقة..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* 🚀 تحديد نطاق عمل الفرقة (إذا كان هناك أكثر من نطاق) */}
                                        {hasMultipleZones && (
                                            <select 
                                                value={team.zone} 
                                                onChange={(e) => updateTeamZone(team.id, e.target.value)}
                                                className={`text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'}`}
                                            >
                                                <option value="">-- أين ستعمل هذه الفرقة؟ --</option>
                                                {project.work_zones.map((w:any, i:number) => (
                                                    <option key={i} value={w.region}>{w.region}</option>
                                                ))}
                                            </select>
                                        )}

                                        <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${isDark ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            <Users size={14}/> {team.members.length} أعضاء
                                        </div>
                                        <button onClick={() => removeTeam(team.id)} className="p-2.5 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 rounded-xl transition"><Trash2 size={18}/></button>
                                    </div>
                                </div>

                                {/* قائمة أعضاء الفرقة */}
                                <div className="p-6">
                                    {team.members.length === 0 ? (
                                        <div className={`text-center py-8 border-2 border-dashed rounded-3xl ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                            <Users size={32} className="mx-auto text-slate-400 mb-3"/>
                                            <p className="text-sm font-bold text-slate-500 mb-4">لا يوجد فنيين مسندين لهذه الفرقة.</p>
                                            <button onClick={() => openSelectModal(team.id)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-6 py-2.5 rounded-xl text-sm font-bold transition">
                                                + إضافة فنيين
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {team.members.map(member => (
                                                <div key={member.id} className={`flex items-center justify-between p-4 rounded-2xl transition group ${memberItemBg}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                            {member.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-black text-base ${textMain}`}>{member.full_name}</h4>
                                                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>ID: {member.employee_id || 'N/A'}</span>
                                                            </div>
                                                            <div className={`flex flex-wrap items-center gap-4 text-xs font-bold mt-1.5 ${textSub}`}>
                                                                <span className="flex items-center gap-1 text-blue-500"><Briefcase size={12}/> {member.job_title}</span>
                                                                <span className="flex items-center gap-1 text-amber-500"><Clock size={12}/> خبرة: {getCompanyTenure(member.start_date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeMemberFromTeam(team.id, member.id)} className="p-2 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 rounded-xl transition opacity-0 group-hover:opacity-100"><X size={18}/></button>
                                                </div>
                                            ))}
                                            
                                            <button onClick={() => openSelectModal(team.id)} className={`w-full mt-2 py-3 border-2 border-dashed rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 ${isDark ? 'border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500 hover:bg-blue-900/10' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                                                <Plus size={16}/> إضافة المزيد
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* === Modal: قائمة الفنيين للاختيار === */}
            <AnimatePresence>
                {isSelectTechModalOpen && activeTeamIdForSelection && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${cardBg}`}>
                            
                            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                                <div>
                                    <h3 className={`font-black text-xl ${textMain}`}>قائمة الفنيين والمهندسين</h3>
                                    <p className="text-xs font-bold text-blue-500 mt-1">تحديد الموارد البشرية لـ: {teams.find(t => t.id === activeTeamIdForSelection)?.name}</p>
                                </div>
                                <button onClick={() => setSelectTechModalOpen(false)} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 hover:text-red-400 text-slate-400' : 'bg-white shadow-sm hover:text-red-500 text-slate-500'}`}><X size={20}/></button>
                            </div>

                            <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div className="relative">
                                    <Search className="absolute ltr:left-4 rtl:right-4 top-3.5 text-slate-400 w-5 h-5" />
                                    <input type="text" value={techSearch} onChange={e=>setTechSearch(e.target.value)} placeholder="ابحث بالاسم، المسمى، أو المنطقة..." className={`w-full rounded-2xl py-3.5 px-12 text-sm font-bold outline-none border transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'}`} />
                                </div>
                            </div>

                            <div className={`flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 ${isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'}`}>
                                {availableTechs.filter(t => t.full_name.includes(techSearch) || t.job_title.includes(techSearch) || (t.region && t.region.includes(techSearch))).map(tech => {
                                    
                                    const activeTeam = teams.find(t => t.id === activeTeamIdForSelection);
                                    const isSelectedInThisTeam = activeTeam?.members.some(m => m.id === tech.id);
                                    const isAssignedToOtherTeam = teams.some(t => t.id !== activeTeamIdForSelection && t.members.some(m => m.id === tech.id));

                                    return (
                                        <div key={tech.id} onClick={() => !isAssignedToOtherTeam && toggleTechInActiveTeam(tech)} className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${isAssignedToOtherTeam ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800' : isSelectedInThisTeam ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}>
                                            
                                            {isSelectedInThisTeam && <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500 rounded-bl-[2.5rem] flex items-start justify-end p-2 text-white"><CheckCircle2 size={16}/></div>}
                                            {isAssignedToOtherTeam && <div className="absolute top-2 left-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold px-2 py-1 rounded">في فرقة أخرى</div>}

                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${isSelectedInThisTeam ? 'bg-blue-600 text-white border-blue-700' : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {tech.full_name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-black text-sm leading-tight mb-1 ${textMain}`}>{tech.full_name}</h4>
                                                    <div className="text-[11px] font-bold text-blue-500 mb-2">{tech.job_title}</div>
                                                    
                                                    <div className={`grid grid-cols-2 gap-2 text-[10px] font-bold ${textSub}`}>
                                                        <div className="flex items-center gap-1"><Phone size={10}/> <span dir="ltr">{tech.phone || 'N/A'}</span></div>
                                                        <div className="flex items-center gap-1"><Building size={10}/> <span className="truncate">{tech.branch || tech.region || 'N/A'}</span></div>
                                                        <div className={`col-span-2 flex items-center gap-1 mt-1 p-1.5 rounded-lg border ${isDark ? 'text-amber-500 bg-amber-900/10 border-amber-900/30' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                                                            <Clock size={12}/> خبرة: {getCompanyTenure(tech.start_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className={`p-6 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
                                <button onClick={() => setSelectTechModalOpen(false)} className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg active:scale-95 transition">
                                    تأكيد وإغلاق
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}