'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Folder, FileText, Image, MoreVertical, Download, UploadCloud, 
  Search, Filter, ChevronRight, ChevronLeft, ArrowUp, Share2, 
  Trash2, Eye, File, CheckCircle2, Clock, AlertTriangle, 
  Shield, X, Save, RefreshCw, FileImage, FileSpreadsheet, Globe, Loader2
} from 'lucide-react';
import { useDashboard } from '../../layout';

// --- Types ---
type FileType = 'PDF' | 'DWG' | 'XLSX' | 'DOCX' | 'JPG' | 'PNG' | string;
type FileStatus = 'Approved' | 'Draft' | 'Under Review' | 'Expired';
type Confidentiality = 'Internal' | 'Confidential' | 'Public';

interface DMSFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  file_url: string; // الرابط الفعلي للملف
  uploadedBy: string;
  uploadDate: string;
  folderId: string;
  status: FileStatus;
  confidentiality: Confidentiality;
  linkedEntity?: string;
  downloads: number;
}

interface DMSFolder {
  id: string;
  name: string;
  count: number;
  size: string;
  updated: string;
  category: 'Contracts' | 'Engineering' | 'QC' | 'Site' | 'Finance';
}

export default function FilesPage() {
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';

  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [files, setFiles] = useState<DMSFile[]>([]);
  const [folders, setFolders] = useState<DMSFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Selection & Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer & Modal States
  const [activeFile, setActiveFile] = useState<DMSFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState<globalThis.File | null>(null);
  const [uploadMeta, setUploadMeta] = useState({ folder: 'root', confidentiality: 'Internal', linkedEntity: '' });

  // --- 1. Fetch Real Data ---
  const fetchFilesData = async () => {
    setLoading(true);
    try {
        // جلب المجلدات الثابتة (يمكن جعلها ديناميكية لاحقاً)
        setFolders([
            { id: 'Contracts', name: isRTL ? 'العقود والاتفاقيات' : 'Contracts', count: 0, size: '0 MB', updated: new Date().toLocaleDateString(), category: 'Contracts' },
            { id: 'Engineering', name: isRTL ? 'المخططات الهندسية' : 'Engineering', count: 0, size: '0 MB', updated: new Date().toLocaleDateString(), category: 'Engineering' },
            { id: 'QC', name: isRTL ? 'تقارير الجودة' : 'QC Reports', count: 0, size: '0 MB', updated: new Date().toLocaleDateString(), category: 'QC' },
            { id: 'Site', name: isRTL ? 'صور الموقع' : 'Site Photos', count: 0, size: '0 MB', updated: new Date().toLocaleDateString(), category: 'Site' },
        ]);

        // جلب الملفات من قاعدة البيانات مع اسم الرافع
        const { data: filesData, error: filesErr } = await supabase
            .from('dms_files')
            .select(`*, profiles:uploaded_by(full_name)`)
            .order('created_at', { ascending: false });

        if (filesErr) throw filesErr;

        if (filesData) {
            const formattedFiles: DMSFile[] = filesData.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                size: f.size,
                file_url: f.file_url,
                uploadedBy: f.profiles?.full_name || 'Unknown',
                uploadDate: new Date(f.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
                folderId: f.folder_id,
                status: f.status as FileStatus,
                confidentiality: f.confidentiality as Confidentiality,
                linkedEntity: f.linked_entity,
                downloads: f.downloads || 0
            }));
            setFiles(formattedFiles);
        }
    } catch (error: any) {
        console.error("Error fetching files:", error.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilesData();
  }, [user, isRTL]);

  // --- 2. Real Upload Logic (To Supabase Storage & DB) ---
  const handleUploadFile = async () => {
    if (!uploadFile || !user) return;
    setUploadProgress(10); // بدء وهمي للبروجرس

    try {
        const fileExt = uploadFile.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        const fileSizeMB = (uploadFile.size / 1024 / 1024).toFixed(2) + ' MB';
        const fileNameSafe = `${Date.now()}_${uploadFile.name.replace(/\s+/g, '_')}`; // إزالة المسافات من الاسم

        // 1. Upload to Supabase Storage (Bucket: company_documents)
        const { data: storageData, error: storageError } = await supabase.storage
            .from('company_documents')
            .upload(`uploads/${fileNameSafe}`, uploadFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (storageError) throw storageError;
        setUploadProgress(60);

        // الحصول على الرابط العام للملف
        const { data: publicUrlData } = supabase.storage.from('company_documents').getPublicUrl(storageData.path);
        const fileUrl = publicUrlData.publicUrl;

        // 2. Insert metadata into Database
        const { error: dbError } = await supabase.from('dms_files').insert({
            name: uploadFile.name,
            type: fileExt,
            size: fileSizeMB,
            file_url: fileUrl,
            uploaded_by: user.id,
            folder_id: uploadMeta.folder,
            confidentiality: uploadMeta.confidentiality,
            linked_entity: uploadMeta.linkedEntity || '-',
            status: 'Under Review'
        });

        if (dbError) throw dbError;

        setUploadProgress(100);
        setTimeout(() => {
            setIsUploadOpen(false);
            setUploadProgress(0);
            setUploadFile(null);
            fetchFilesData(); // تحديث القائمة
            alert(isRTL ? 'تم رفع الملف وحفظه بنجاح' : 'File uploaded and saved successfully');
        }, 500);

    } catch (error: any) {
        console.error("Upload error:", error);
        alert(isRTL ? `خطأ في الرفع: تأكد من إنشاء Bucket باسم company_documents\n\n${error.message}` : `Upload Error: ${error.message}`);
        setUploadProgress(0);
    }
  };

  const handleDownload = async (file: DMSFile) => {
      // زيادة عدد التحميلات في قاعدة البيانات
      await supabase.from('dms_files').update({ downloads: file.downloads + 1 }).eq('id', file.id);
      
      // فتح الملف في نافذة جديدة (يقوم المتصفح بتحميله إذا كان غير مدعوم للعرض)
      window.open(file.file_url, '_blank');
      fetchFilesData(); // لتحديث العداد
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا الملف نهائياً؟' : 'Permanently delete this file?')) {
        try {
            // 1. حذف من قاعدة البيانات
            await supabase.from('dms_files').delete().eq('id', id);
            
            // 2. محاولة الحذف من الـ Storage (اختياري)
            const pathParts = fileUrl.split('company_documents/');
            if (pathParts.length > 1) {
                const filePath = pathParts[1];
                await supabase.storage.from('company_documents').remove([filePath]);
            }

            setFiles(prev => prev.filter(f => f.id !== id));
            setIsDetailsOpen(false);
        } catch (error) {
            console.error("Delete error", error);
        }
    }
  };

  const handleShare = (fileUrl: string) => {
    navigator.clipboard.writeText(fileUrl);
    alert(isRTL ? 'تم نسخ الرابط بنجاح' : 'Link copied to clipboard');
  };

  const filteredFiles = files.filter(f => 
    (f.folderId === currentFolderId) &&
    (f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.linkedEntity?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentFolderName = currentFolderId === 'root' 
    ? (isRTL ? 'الملفات الرئيسية' : 'Root') 
    : folders.find(f => f.id === currentFolderId)?.name;

  // --- UI Helpers ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  const getFileIcon = (type: string) => {
      const ext = type.toUpperCase();
      if (['JPG', 'PNG', 'JPEG'].includes(ext)) return <FileImage className="text-purple-500" size={24}/>;
      if (['XLSX', 'CSV', 'XLS'].includes(ext)) return <FileSpreadsheet className="text-emerald-500" size={24}/>;
      if (['DWG', 'CAD'].includes(ext)) return <DraftingCompassIcon className="text-amber-500" size={24}/>;
      if (['PDF'].includes(ext)) return <FileText className="text-red-500" size={24}/>;
      return <File className="text-blue-500" size={24}/>;
  };

  const getStatusBadge = (status: FileStatus) => {
      const styles = {
          'Approved': isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
          'Draft': isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
          'Under Review': isDark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200',
          'Expired': isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>{isRTL ? {'Approved':'معتمد','Draft':'مسودة','Under Review':'قيد المراجعة','Expired':'منتهي'}[status] : status}</span>;
  };

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Command Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Folder className="text-yellow-500" fill="currentColor" />
              {isRTL ? 'خزنة المستندات والملفات' : 'Document Vault (DMS)'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'الأرشيف المركزي المؤمن للمشاريع والعمليات الميدانية' : 'Central secured archive for projects and field operations'}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsUploadOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95">
                <UploadCloud size={18} /> {isRTL ? 'رفع ملف' : 'Upload File'}
             </button>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard isDark={isDark} label={isRTL ? 'إجمالي الملفات' : 'Total Files'} value={files.length} color="blue" icon={File} />
            <StatCard isDark={isDark} label={isRTL ? 'مجلدات رئيسية' : 'Main Folders'} value={folders.length} color="amber" icon={Folder} />
            <StatCard isDark={isDark} label={isRTL ? 'بانتظار المراجعة' : 'Under Review'} value={files.filter(f=>f.status==='Under Review').length} color="red" icon={Clock} />
            <StatCard isDark={isDark} label={isRTL ? 'التحميلات' : 'Total Downloads'} value={files.reduce((a,c)=>a+c.downloads,0)} color="emerald" icon={Download} />
        </div>

        {/* Search & Navigation */}
        <div className={`flex gap-2 items-center p-1.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            {currentFolderId !== 'root' && (
                <button onClick={() => setCurrentFolderId('root')} className={`px-3 py-2 rounded-lg transition flex items-center gap-1 font-bold text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-white'}`}>
                    <ArrowUp size={16}/> {isRTL ? 'للأعلى' : 'Up'}
                </button>
            )}
            <div className={`h-6 w-px mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <div className="relative flex-1">
                <Search className={`absolute top-2.5 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" placeholder={isRTL ? 'بحث في المستندات...' : 'Search documents...'} 
                    className={`w-full bg-transparent py-2 text-sm outline-none font-medium ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'} ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* --- Section 2: Folders & Files --- */}
      <div className="p-6 space-y-8">
        
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 text-sm font-bold ${textSub}`}>
            <Folder size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'}/>
            <span>/</span>
            <span className={textMain}>{currentFolderName}</span>
        </div>

        {/* Folders Grid */}
        {currentFolderId === 'root' && !searchTerm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.map(folder => {
                    const fCount = files.filter(f => f.folderId === folder.id).length;
                    return(
                    <div 
                        key={folder.id} 
                        onClick={() => setCurrentFolderId(folder.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition group text-center relative overflow-hidden ${cardBg} ${isDark ? 'hover:border-blue-500/50 hover:bg-slate-800' : 'hover:shadow-md hover:border-blue-300'}`}
                    >
                        <Folder size={48} className="text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform drop-shadow-sm" fill="currentColor" fillOpacity={0.2} />
                        <div className={`font-bold text-sm ${textMain}`}>{folder.name}</div>
                        <div className={`text-xs mt-1 ${textSub}`}>{fCount} {isRTL ? 'ملفات' : 'files'}</div>
                    </div>
                )})}
            </div>
        )}

        {/* Files List */}
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${cardBg}`}>
            <div className="overflow-x-auto">
                <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                    <thead className={`text-xs font-bold border-b ${isDark ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        <tr>
                            <th className="p-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-slate-300"/></th>
                            <th className="p-4">{isRTL ? 'اسم الملف' : 'File Name'}</th>
                            <th className="p-4">{isRTL ? 'النوع & الحجم' : 'Type & Size'}</th>
                            <th className="p-4">{isRTL ? 'بواسطة' : 'Uploaded By'}</th>
                            <th className="p-4">{isRTL ? 'الارتباط' : 'Linked Entity'}</th>
                            <th className="p-4">{isRTL ? 'الحالة' : 'Status'}</th>
                            <th className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                        {loading ? (
                            <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" size={30}/></td></tr>
                        ) : filteredFiles.length === 0 ? (
                            <tr><td colSpan={7} className={`p-10 text-center font-medium ${textSub}`}>{isRTL ? 'لا توجد ملفات في هذا المجلد.' : 'No files found in this folder.'}</td></tr>
                        ) : filteredFiles.map(file => (
                            <tr key={file.id} className={`transition group ${activeFile?.id === file.id ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : (isDark ? 'hover:bg-slate-800/30' : 'hover:bg-blue-50/30')}`}>
                                <td className="p-4"><input type="checkbox" className="w-4 h-4 rounded border-slate-300"/></td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveFile(file); setIsDetailsOpen(true); }}>
                                        <div className={`p-2 rounded-lg border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>{getFileIcon(file.type)}</div>
                                        <div>
                                            <div className={`font-bold text-sm transition ${textMain} ${isDark ? 'group-hover:text-blue-400' : 'group-hover:text-blue-600'}`}>{file.name}</div>
                                            {file.confidentiality === 'Confidential' && <span className={`text-[10px] font-bold px-1.5 rounded flex items-center gap-1 w-fit mt-1 border ${isDark ? 'text-red-400 bg-red-900/20 border-red-800' : 'text-red-600 bg-red-50 border-red-100'}`}><Shield size={10}/> {isRTL ? 'سري' : 'Confidential'}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className={`text-xs font-bold ${textMain}`}>{file.type}</div>
                                    <div className={`text-[10px] font-mono ${textSub}`}>{file.size}</div>
                                </td>
                                <td className="p-4 text-xs">
                                    <div className={`font-bold ${textMain}`}>{file.uploadedBy}</div>
                                    <div className={textSub}>{file.uploadDate}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded font-mono border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{file.linkedEntity}</span>
                                </td>
                                <td className="p-4">{getStatusBadge(file.status)}</td>
                                <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDownload(file)} className={`p-2 rounded-lg transition shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500' : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'}`} title="Download">
                                            <Download size={16}/>
                                        </button>
                                        <button onClick={() => { setActiveFile(file); setIsDetailsOpen(true); }} className={`p-2 rounded-lg transition shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400'}`} title="Details">
                                            <Eye size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- 4. File Details Drawer --- */}
      {isDetailsOpen && activeFile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                
                {/* Header */}
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className={`font-bold text-lg ${textMain}`}>{isRTL ? 'تفاصيل الملف' : 'File Details'}</h3>
                    <button onClick={() => setIsDetailsOpen(false)} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Preview Placeholder */}
                    <div className={`rounded-2xl h-48 flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
                        {getFileIcon(activeFile.type)}
                        <span className={`text-xs font-bold mt-3 ${textSub}`}>{isRTL ? 'معاينة غير متوفرة' : 'No Preview Available'}</span>
                        <a href={activeFile.file_url} target="_blank" rel="noreferrer" className="mt-2 text-blue-500 text-xs font-bold hover:underline">{isRTL ? 'فتح في علامة تبويب جديدة' : 'Open in new tab'}</a>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4">
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <h4 className={`font-bold text-sm mb-4 break-all ${textMain}`}>{activeFile.name}</h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                                <div className={textSub}>{isRTL ? 'النوع:' : 'Type:'} <span className={`font-bold ml-1 ${textMain}`}>{activeFile.type}</span></div>
                                <div className={textSub}>{isRTL ? 'الحجم:' : 'Size:'} <span className={`font-bold ml-1 ${textMain}`}>{activeFile.size}</span></div>
                                <div className={textSub}>{isRTL ? 'السرية:' : 'Sec:'} <span className={`font-bold ml-1 ${textMain}`}>{activeFile.confidentiality}</span></div>
                                <div className={textSub}>{isRTL ? 'التحميلات:' : 'Downloads:'} <span className={`font-bold ml-1 ${textMain}`}>{activeFile.downloads}</span></div>
                            </div>
                        </div>

                        <div>
                            <h5 className={`text-xs font-bold uppercase mb-2 ${textSub}`}>{isRTL ? 'الارتباطات' : 'Links'}</h5>
                            <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{activeFile.linkedEntity}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{activeFile.folderId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`p-5 border-t flex flex-col gap-3 ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                    <button onClick={() => handleDownload(activeFile)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition active:scale-95">
                        <Download size={18}/> {isRTL ? 'تحميل الملف' : 'Download File'}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => handleShare(activeFile.file_url)} className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                            <Share2 size={16}/> {isRTL ? 'مشاركة' : 'Share'}
                        </button>
                        <button onClick={() => handleDelete(activeFile.id, activeFile.file_url)} className={`p-3 rounded-xl border transition ${isDark ? 'bg-red-900/10 border-red-900/50 text-red-500 hover:bg-red-900/30' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}>
                            <Trash2 size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- 5. Upload Modal --- */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className={`w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className={`font-bold text-lg ${textMain}`}>{isRTL ? 'رفع مستند جديد' : 'Upload New File'}</h3>
                    <button onClick={() => setIsUploadOpen(false)} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-5">
                    {/* Drag & Drop Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer relative ${isDark ? 'border-slate-700 hover:bg-slate-800/50 hover:border-blue-500' : 'border-slate-300 hover:bg-slate-50 hover:border-blue-400'}`}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} />
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-1 ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><UploadCloud size={28}/></div>
                            {uploadFile ? (
                                <div className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                                    <CheckCircle2 size={18}/> {uploadFile.name}
                                </div>
                            ) : (
                                <>
                                    <span className={`font-bold ${textMain}`}>{isRTL ? 'اضغط لاختيار الملف' : 'Click to select file'}</span>
                                    <span className={`text-xs ${textSub}`}>PDF, DWG, Images, Excel (Max 50MB)</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'التصنيف / المجلد' : 'Folder'}</label>
                            <select 
                                className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'}`}
                                value={uploadMeta.folder} onChange={(e) => setUploadMeta({...uploadMeta, folder: e.target.value})}
                            >
                                <option value="root">Root (العام)</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'السرية' : 'Confidentiality'}</label>
                            <select 
                                className={`w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'}`}
                                value={uploadMeta.confidentiality} onChange={(e) => setUploadMeta({...uploadMeta, confidentiality: e.target.value})}
                            >
                                <option value="Internal">Internal (داخلي)</option>
                                <option value="Confidential">Confidential (سري)</option>
                            </select>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadProgress > 0 && (
                        <div className="space-y-1.5">
                            <div className={`flex justify-between text-xs font-bold ${textSub}`}>
                                <span>{isRTL ? 'جاري الرفع للـ Cloud...' : 'Uploading...'}</span>
                                <span className="text-blue-500">{uploadProgress}%</span>
                            </div>
                            <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-5 border-t flex gap-3 ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                    <button onClick={() => setIsUploadOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                        onClick={handleUploadFile} 
                        disabled={!uploadFile || uploadProgress > 0}
                        className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
                    >
                        {uploadProgress > 0 ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                        {isRTL ? 'رفع وحفظ المستند' : 'Upload & Save'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Icons & Helpers ---
function StatCard({ label, value, color, icon: Icon, isDark }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: isDark ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: isDark ? 'bg-amber-900/20 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-600 border-amber-100',
        red: isDark ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-100',
    };
    return (
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
            <div className="flex justify-between items-start mb-3">
                <div className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
                <div className={`p-2 rounded-xl border ${colors[color]}`}><Icon size={18} /></div>
            </div>
            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        </div>
    );
}

function DraftingCompassIcon({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="5" r="2"/><line x1="12" x2="19" y1="5" y2="21"/><line x1="12" x2="5" y1="5" y2="21"/><circle cx="12" cy="12" r="2"/></svg>;
}