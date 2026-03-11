'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
// تم تصحيح المسار بناءً على طلبك
import { useDashboard } from '../../layout'; 
import { 
    Search, UploadCloud, HardDrive, FileText, FileImage, 
    FileSpreadsheet, Download, Trash2, Loader2, X, Folder, 
    Calendar, File, FileArchive, Building2, Users, Landmark,
    AlignLeft, Briefcase, Eye, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultFile {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    size_kb: number;
    category: string;
    document_type: 'General' | 'Project' | 'Employee' | 'Government';
    description: string;
    project_id?: string;
    employee_id?: string;
    project?: { title: string };
    employee?: { full_name: string };
    created_at: string;
}

export default function AdvancedDataVaultPage() {
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';

    // --- States ---
    const [files, setFiles] = useState<VaultFile[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');
    
    // Modals State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFileDetails, setSelectedFileDetails] = useState<VaultFile | null>(null);
    
    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const [form, setForm] = useState({
        category: 'General',
        document_type: 'General' as 'General' | 'Project' | 'Employee' | 'Government',
        project_id: '',
        employee_id: '',
        description: ''
    });

    // --- Fetch Data ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: filesData } = await supabase
                .from('vault_files')
                .select('*, project:projects(title), employee:profiles!vault_files_employee_id_fkey(full_name)')
                .order('created_at', { ascending: false });

            const { data: projectsData } = await supabase.from('projects').select('id, title').eq('status', 'Active');
            const { data: employeesData } = await supabase.from('profiles').select('id, full_name');

            if (filesData) setFiles(filesData as VaultFile[]);
            if (projectsData) setProjects(projectsData);
            if (employeesData) setEmployees(employeesData);
        } catch (error: any) {
            console.error('Error fetching vault data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Upload Logic ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !user) return alert(isRTL ? 'الرجاء اختيار ملف.' : 'Please select a file.');
        if (form.document_type === 'Project' && !form.project_id) return alert(isRTL ? 'الرجاء اختيار المشروع' : 'Select Project');
        if (form.document_type === 'Employee' && !form.employee_id) return alert(isRTL ? 'الرجاء اختيار الموظف' : 'Select Employee');

        setIsUploading(true);
        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${form.category}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('vault').upload(filePath, selectedFile);
            if (uploadError) throw new Error(uploadError.message);

            const { data: publicUrlData } = supabase.storage.from('vault').getPublicUrl(filePath);

            const { error: dbError } = await supabase.from('vault_files').insert({
                file_name: selectedFile.name,
                file_url: publicUrlData.publicUrl,
                file_type: selectedFile.type || fileExt,
                size_kb: Math.round(selectedFile.size / 1024),
                category: form.category,
                document_type: form.document_type,
                project_id: form.document_type === 'Project' ? form.project_id : null,
                employee_id: form.document_type === 'Employee' ? form.employee_id : null,
                description: form.description,
                uploaded_by: user.id
            });

            if (dbError) throw dbError;

            alert(isRTL ? 'تم رفع المستند بنجاح!' : 'Document uploaded successfully!');
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setForm({ category: 'General', document_type: 'General', project_id: '', employee_id: '', description: '' });
            fetchData();

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    // --- Delete Logic ---
    const handleDelete = async (id: string, fileUrl: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm(isRTL ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
        try {
            await supabase.from('vault_files').delete().eq('id', id);
            setFiles(prev => prev.filter(f => f.id !== id));
            if (selectedFileDetails?.id === id) setSelectedFileDetails(null);
        } catch (error: any) { alert(error.message); }
    };

    // --- Force Download Logic (تمت الإضافة لتنزيل الملف بصيغته) ---
    const forceDownload = async (url: string, filename: string, e: React.MouseEvent) => {
        e.stopPropagation(); // يمنع فتح نافذة التفاصيل عند ضغط زر التحميل
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            // خطة بديلة إذا فشل التحميل البرمجي
            window.open(url, '_blank'); 
        }
    };

    // --- Processing ---
    const filteredFiles = files.filter(f => {
        const matchesSearch = f.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'All' || f.document_type === typeFilter;
        const matchesProject = projectFilter === 'All' || f.project_id === projectFilter;
        return matchesSearch && matchesType && matchesProject;
    });

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText size={24} className="text-red-500" />;
        if (type.includes('image')) return <FileImage size={24} className="text-blue-500" />;
        if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv') || type.includes('sheet')) return <FileSpreadsheet size={24} className="text-emerald-500" />;
        if (type.includes('zip') || type.includes('rar')) return <FileArchive size={24} className="text-amber-500" />;
        return <File size={24} className="text-slate-500" />;
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'Project': return <Briefcase size={12}/>;
            case 'Employee': return <Users size={12}/>;
            case 'Government': return <Landmark size={12}/>;
            default: return <Folder size={12}/>;
        }
    };

    const categories = ['Legal', 'Contracts', 'Invoices', 'Engineering', 'General'];

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900";

    return (
        <div className={`min-h-screen font-sans pb-20 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><HardDrive size={24}/></div>
                            {isRTL ? 'إدارة المستندات والملفات (DMS)' : 'Document Management System'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>أرشفة متقدمة، ربط بالمشاريع والموظفين، وبحث ذكي.</p>
                    </div>
                    <button onClick={() => setIsUploadModalOpen(true)} className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                        <UploadCloud size={18}/> {isRTL ? 'حفظ مستند جديد' : 'Upload Document'}
                    </button>
                </div>

                {/* Filters */}
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو المحتوى..." className={`w-full border rounded-2xl px-5 py-3 text-sm font-bold outline-none transition focus:border-blue-500 ${inputBg}`} />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className={`border rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer ${inputBg}`}>
                            <option value="All">كل الأنواع</option>
                            <option value="General">مستندات عامة</option>
                            <option value="Project">مستندات مشاريع</option>
                            <option value="Employee">ملفات موظفين</option>
                            <option value="Government">دوائر حكومية</option>
                        </select>

                        {typeFilter === 'Project' && (
                            <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className={`border rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer max-w-[200px] ${inputBg}`}>
                                <option value="All">كل المشاريع</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Files Grid */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-600" size={50} /></div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-4xl bg-white/50 dark:bg-slate-900/50">
                        <Folder size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4"/>
                        <div className={`font-black text-xl mb-2 ${textMain}`}>لا توجد ملفات مطابقة.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredFiles.map(file => (
                                <motion.div 
                                    layout initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}}
                                    key={file.id} 
                                    onClick={() => setSelectedFileDetails(file)} // يفتح نافذة التفاصيل
                                    className={`relative p-5 rounded-4xl border transition-all hover:shadow-xl group flex flex-col h-full cursor-pointer ${cardBg}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                            {getFileIcon(file.file_type)}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border ${isDark ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                                {getTypeIcon(file.document_type)} {file.document_type}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h3 className={`text-sm font-black leading-tight mb-2 line-clamp-2 ${textMain}`} title={file.file_name}>
                                        {file.file_name}
                                    </h3>

                                    {/* Related To info */}
                                    <div className="mb-3 space-y-1">
                                        {file.document_type === 'Project' && file.project && <div className="text-[10px] font-bold text-emerald-600 truncate flex items-center gap-1"><Briefcase size={10}/> {file.project.title}</div>}
                                        {file.document_type === 'Employee' && file.employee && <div className="text-[10px] font-bold text-purple-600 truncate flex items-center gap-1"><Users size={10}/> {file.employee.full_name}</div>}
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                        <div className="text-[10px] font-mono font-bold text-slate-400 flex flex-col gap-1">
                                            <span>{Number(file.size_kb).toLocaleString()} KB</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => handleDelete(file.id, file.file_url, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="حذف">
                                                <Trash2 size={16}/>
                                            </button>
                                            {/* زر التحميل الفعلي */}
                                            <button onClick={(e) => forceDownload(file.file_url, file.file_name, e)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition" title="تحميل">
                                                <Download size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* --- 🚀 Document Details & Preview Modal --- */}
            <AnimatePresence>
                {selectedFileDetails && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-2xl my-auto rounded-4xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className={`text-lg font-black flex items-center gap-2 ${textMain}`}>
                                    <Info size={20} className="text-blue-500"/> تفاصيل المستند
                                </h2>
                                <button onClick={() => setSelectedFileDetails(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition"><X size={20}/></button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        {getFileIcon(selectedFileDetails.file_type)}
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-black leading-tight mb-2 ${textMain}`}>{selectedFileDetails.file_name}</h3>
                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                            <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded">{selectedFileDetails.size_kb} KB</span>
                                            <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">{selectedFileDetails.category}</span>
                                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">{new Date(selectedFileDetails.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                                        <div><span className="text-slate-500 block mb-1 text-xs">نوع الارتباط</span> {selectedFileDetails.document_type}</div>
                                        {selectedFileDetails.document_type === 'Project' && <div><span className="text-slate-500 block mb-1 text-xs">المشروع المرتبط</span> {selectedFileDetails.project?.title || '-'}</div>}
                                        {selectedFileDetails.document_type === 'Employee' && <div><span className="text-slate-500 block mb-1 text-xs">الموظف المرتبط</span> {selectedFileDetails.employee?.full_name || '-'}</div>}
                                    </div>
                                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-500 block mb-1 text-xs">الوصف / المحتويات</span>
                                        <p className={`text-sm leading-relaxed ${textMain}`}>{selectedFileDetails.description || 'لا يوجد وصف'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <a href={selectedFileDetails.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95">
                                        <Eye size={18}/> استعراض الملف
                                    </a>
                                    <button onClick={(e) => forceDownload(selectedFileDetails.file_url, selectedFileDetails.file_name, e)} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition active:scale-95">
                                        <Download size={18}/> تحميل إلى الجهاز
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- 🚀 Advanced Upload Modal --- */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-xl my-auto rounded-4xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className={`text-lg font-black ${textMain}`}>أرشفة مستند جديد</h2>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition"><X size={20}/></button>
                            </div>
                            
                            <form onSubmit={handleUpload} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                
                                <div>
                                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${isDark ? 'border-slate-700 hover:border-blue-500 bg-slate-800/50' : 'border-slate-300 hover:border-blue-500 bg-slate-50'}`} onClick={() => fileInputRef.current?.click()}>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        <UploadCloud size={32} className={`mx-auto mb-2 ${selectedFile ? 'text-blue-500' : 'text-slate-400'}`}/>
                                        {selectedFile ? (
                                            <div className={`text-sm font-bold ${textMain} truncate px-4`}>{selectedFile.name}</div>
                                        ) : (
                                            <div className="text-sm font-bold text-slate-400">انقر هنا لاختيار المستند من جهازك</div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">ارتباط المستند (النوع) *</label>
                                        <select value={form.document_type} onChange={e=>setForm({...form, document_type: e.target.value as any})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer ${inputBg}`}>
                                            <option value="General">عام للشركة</option>
                                            <option value="Project">يخص مشروع محدد</option>
                                            <option value="Employee">يخص موظف معين (HR)</option>
                                            <option value="Government">دائرة حكومية / تراخيص</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">تصنيف الملف</label>
                                        <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer ${inputBg}`}>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {form.document_type === 'Project' && (
                                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}}>
                                        <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Briefcase size={14}/> اختر المشروع *</label>
                                        <select required value={form.project_id} onChange={e=>setForm({...form, project_id: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer ${inputBg}`}>
                                            <option value="">-- القائمة --</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </select>
                                    </motion.div>
                                )}

                                {form.document_type === 'Employee' && (
                                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}}>
                                        <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Users size={14}/> اختر الموظف *</label>
                                        <select required value={form.employee_id} onChange={e=>setForm({...form, employee_id: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer ${inputBg}`}>
                                            <option value="">-- القائمة --</option>
                                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                        </select>
                                    </motion.div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><AlignLeft size={14}/> محتويات المستند (مهم للبحث)</label>
                                    <textarea rows={3} value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="اكتب وصفاً قصيراً لمحتوى هذا الملف لتسهيل العثور عليه لاحقاً..." className={`w-full p-3.5 rounded-xl border outline-none font-medium text-sm resize-none ${inputBg}`} />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={() => setIsUploadModalOpen(false)} className={`flex-1 py-4 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>إلغاء</button>
                                    <button type="submit" disabled={isUploading || !selectedFile} className="flex-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                                        {isUploading ? <Loader2 size={18} className="animate-spin"/> : <UploadCloud size={18} className="hidden"/>} رفع وأرشفة المستند
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}