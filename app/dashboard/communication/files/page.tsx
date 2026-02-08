'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Folder, FileText, Image, MoreVertical, Download, UploadCloud, 
  Search, Filter, ChevronRight, ChevronLeft, ArrowUp, Share2, 
  Trash2, Eye, File, CheckCircle2, Clock, AlertTriangle, 
  Shield, X, Save, RefreshCw, FileImage, FileSpreadsheet, Globe
} from 'lucide-react';

// --- Types ---
type FileType = 'PDF' | 'DWG' | 'XLSX' | 'DOCX' | 'JPG' | 'PNG';
type FileStatus = 'Approved' | 'Draft' | 'Under Review' | 'Expired';
type Confidentiality = 'Internal' | 'Confidential' | 'Public';

interface DMSFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  folderId: string; // 'root' or specific folder ID
  status: FileStatus;
  confidentiality: Confidentiality;
  version: string;
  linkedEntity?: string; // Project/Task ID
  description?: string;
  tags?: string[];
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
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [files, setFiles] = useState<DMSFile[]>([]);
  const [folders, setFolders] = useState<DMSFolder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection & Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer & Modal States
  const [activeFile, setActiveFile] = useState<DMSFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMeta, setUploadMeta] = useState({ folder: 'root', confidentiality: 'Internal', linkedEntity: '' });

  // --- Mock Data ---
  useEffect(() => {
    setTimeout(() => {
      setFolders([
        { id: 'FLD-1', name: lang === 'ar' ? 'العقود والاتفاقيات' : 'Contracts & Agreements', count: 12, size: '45 MB', updated: '2024-02-01', category: 'Contracts' },
        { id: 'FLD-2', name: lang === 'ar' ? 'المخططات الهندسية' : 'Engineering Drawings', count: 45, size: '1.2 GB', updated: '2024-02-05', category: 'Engineering' },
        { id: 'FLD-3', name: lang === 'ar' ? 'تقارير الجودة QC' : 'QC Reports', count: 28, size: '120 MB', updated: 'Yesterday', category: 'QC' },
        { id: 'FLD-4', name: lang === 'ar' ? 'صور الموقع' : 'Site Photos', count: 156, size: '850 MB', updated: 'Today', category: 'Site' },
      ]);

      setFiles([
        { id: 'F-101', name: 'تقرير_نهاية_الشهر_يناير.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 'Ahmed', uploadDate: '2024-02-01', folderId: 'root', status: 'Approved', confidentiality: 'Internal', version: 'v1.0', linkedEntity: 'PRJ-001', downloads: 5 },
        { id: 'F-102', name: 'مخطط_الدور_الارضي_معدل.dwg', type: 'DWG', size: '15 MB', uploadedBy: 'Eng. Sarah', uploadDate: '2024-02-04', folderId: 'root', status: 'Under Review', confidentiality: 'Confidential', version: 'v2.3', linkedEntity: 'PRJ-001', downloads: 12 },
        { id: 'F-103', name: 'صورة_تركيب_اللوحات.jpg', type: 'JPG', size: '4.1 MB', uploadedBy: 'Saeed', uploadDate: 'Yesterday', folderId: 'FLD-4', status: 'Approved', confidentiality: 'Internal', version: 'v1.0', linkedEntity: 'INS-102', downloads: 2 },
        { id: 'F-104', name: 'كشف_رواتب_فبراير.xlsx', type: 'XLSX', size: '0.8 MB', uploadedBy: 'Finance', uploadDate: 'Today', folderId: 'root', status: 'Draft', confidentiality: 'Confidential', version: 'v0.1', linkedEntity: '-', downloads: 0 },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Actions ---
  const handleUploadFile = () => {
    if (!uploadFile) return;
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            
            const newFile: DMSFile = {
                id: `F-${Date.now()}`,
                name: uploadFile.name,
                type: (uploadFile.name.split('.').pop()?.toUpperCase() as FileType) || 'PDF',
                size: (uploadFile.size / 1024 / 1024).toFixed(2) + ' MB',
                uploadedBy: 'Current User',
                uploadDate: new Date().toLocaleDateString(),
                folderId: uploadMeta.folder,
                status: 'Draft',
                confidentiality: uploadMeta.confidentiality as Confidentiality,
                version: 'v1.0',
                linkedEntity: uploadMeta.linkedEntity || '-',
                downloads: 0
            };
            
            setFiles([newFile, ...files]);
            setTimeout(() => {
                setIsUploadOpen(false);
                setUploadProgress(0);
                setUploadFile(null);
                alert(lang === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
            }, 500);
        }
    }, 200);
  };

  const handleDownload = (file: DMSFile) => {
    alert(lang === 'ar' ? `جاري تحميل ${file.name}...` : `Downloading ${file.name}...`);
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f));
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Are you sure you want to delete this file?')) {
        setFiles(prev => prev.filter(f => f.id !== id));
        setIsDetailsOpen(false);
    }
  };

  const handleShare = () => {
    alert(lang === 'ar' ? 'تم نسخ رابط المشاركة الآمن' : 'Secure share link copied');
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const filteredFiles = files.filter(f => 
    (f.folderId === currentFolderId) &&
    (f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.linkedEntity?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentFolderName = currentFolderId === 'root' 
    ? (lang === 'ar' ? 'الملفات الرئيسية' : 'Root') 
    : folders.find(f => f.id === currentFolderId)?.name;

  // --- Helper: File Icon ---
  const getFileIcon = (type: string) => {
      if (['JPG', 'PNG'].includes(type)) return <FileImage className="text-purple-600" size={20}/>;
      if (['XLSX', 'CSV'].includes(type)) return <FileSpreadsheet className="text-green-600" size={20}/>;
      if (['DWG', 'CAD'].includes(type)) return <DraftingCompassIcon className="text-orange-600" size={20}/>;
      if (['PDF'].includes(type)) return <FileText className="text-red-600" size={20}/>;
      return <File className="text-slate-500" size={20}/>;
  };

  const getStatusBadge = (status: FileStatus) => {
      const styles = {
          'Approved': 'bg-green-100 text-green-700',
          'Draft': 'bg-slate-100 text-slate-600',
          'Under Review': 'bg-amber-100 text-amber-700',
          'Expired': 'bg-red-100 text-red-700'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Command Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Folder className="text-yellow-500" fill="currentColor" />
              {lang === 'ar' ? 'إدارة المستندات والملفات' : 'Document Management System'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'الأرشيف المركزي للمشاريع والعمليات الميدانية' : 'Central archive for projects and field operations'}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <button onClick={() => setIsUploadOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition active:scale-95">
                <UploadCloud size={18} /> {lang === 'ar' ? 'رفع ملف' : 'Upload File'}
             </button>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'إجمالي الملفات' : 'Total Files'} value={files.length + 1500} color="blue" icon={File} />
            <StatCard label={lang === 'ar' ? 'المساحة المستخدمة' : 'Storage Used'} value="45.2 GB" color="amber" icon={DatabaseIcon} />
            <StatCard label={lang === 'ar' ? 'بانتظار الاعتماد' : 'Pending Approval'} value="12" color="red" icon={Clock} />
            <StatCard label={lang === 'ar' ? 'أحدث الإضافات' : 'Recent Uploads'} value="8" color="green" icon={ArrowUp} />
        </div>

        {/* Search & Navigation */}
        <div className="flex gap-2 items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            {currentFolderId !== 'root' && (
                <button onClick={() => setCurrentFolderId('root')} className="px-3 py-2 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition flex items-center gap-1 font-bold text-sm">
                    <ArrowUp size={16}/> {lang === 'ar' ? 'للأعلى' : 'Up'}
                </button>
            )}
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
                <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'بحث في المستندات...' : 'Search documents...'} 
                    className="w-full bg-transparent px-10 py-2 text-sm outline-none font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition"><Filter size={18}/></button>
        </div>
      </div>

      {/* --- Section 2: Folders & Files --- */}
      <div className="p-6 space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Folder size={16} className="text-slate-400"/>
            <span>/</span>
            <span className="text-slate-800">{currentFolderName}</span>
        </div>

        {/* Folders Grid (Only visible in Root) */}
        {currentFolderId === 'root' && !searchTerm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {folders.map(folder => (
                    <div 
                        key={folder.id} 
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition group text-center relative overflow-hidden"
                    >
                        <div className="absolute top-3 right-3 text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded text-slate-400 border border-slate-100">{folder.category}</div>
                        <Folder size={48} className="text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform drop-shadow-sm" fill="currentColor" fillOpacity={0.2} />
                        <div className="font-bold text-slate-800 text-sm">{folder.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{folder.count} {lang === 'ar' ? 'ملف' : 'files'} • {folder.size}</div>
                    </div>
                ))}
            </div>
        )}

        {/* Files List (Enterprise Table) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                    <tr>
                        <th className="p-4 w-10"><input type="checkbox" className="w-4 h-4 rounded border-slate-300"/></th>
                        <th className="p-4">{lang === 'ar' ? 'اسم الملف' : 'File Name'}</th>
                        <th className="p-4">{lang === 'ar' ? 'النوع & الحجم' : 'Type & Size'}</th>
                        <th className="p-4">{lang === 'ar' ? 'بواسطة' : 'Uploaded By'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الارتباط' : 'Linked Entity'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="p-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredFiles.length === 0 ? (
                        <tr><td colSpan={7} className="p-10 text-center text-slate-400 font-medium">No files found in this folder.</td></tr>
                    ) : filteredFiles.map(file => (
                        <tr key={file.id} className={`hover:bg-blue-50/50 transition group ${activeFile?.id === file.id ? 'bg-blue-50' : ''}`}>
                            <td className="p-4"><input type="checkbox" className="w-4 h-4 rounded border-slate-300"/></td>
                            <td className="p-4">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveFile(file); setIsDetailsOpen(true); }}>
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">{getFileIcon(file.type)}</div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm hover:text-blue-600 transition">{file.name}</div>
                                        {file.confidentiality === 'Confidential' && <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 rounded flex items-center gap-1 w-fit mt-0.5"><Shield size={10}/> Confidential</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="text-xs font-bold text-slate-600">{file.type}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{file.size}</div>
                            </td>
                            <td className="p-4 text-xs">
                                <div className="font-bold text-slate-700">{file.uploadedBy}</div>
                                <div className="text-slate-400">{file.uploadDate}</div>
                            </td>
                            <td className="p-4">
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{file.linkedEntity}</span>
                            </td>
                            <td className="p-4">{getStatusBadge(file.status)}</td>
                            <td className="p-4 text-end">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDownload(file)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition shadow-sm" title="Download">
                                        <Download size={16}/>
                                    </button>
                                    <button onClick={() => { setActiveFile(file); setIsDetailsOpen(true); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:border-slate-400 transition shadow-sm" title="Details">
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

      {/* --- 4. File Details Drawer --- */}
      {isDetailsOpen && activeFile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'تفاصيل الملف' : 'File Details'}</h3>
                    <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Preview Placeholder */}
                    <div className="bg-slate-100 rounded-xl h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                        {getFileIcon(activeFile.type)}
                        <span className="text-xs font-bold text-slate-400 mt-2">{lang === 'ar' ? 'معاينة غير متوفرة' : 'No Preview Available'}</span>
                        <button className="mt-2 text-blue-600 text-xs font-bold hover:underline">{lang === 'ar' ? 'فتح في عارض خارجي' : 'Open in Viewer'}</button>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-sm text-slate-800 mb-3">{activeFile.name}</h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                <div className="text-slate-400">{lang === 'ar' ? 'النوع:' : 'Type:'} <span className="text-slate-700 font-bold">{activeFile.type}</span></div>
                                <div className="text-slate-400">{lang === 'ar' ? 'الحجم:' : 'Size:'} <span className="text-slate-700 font-bold">{activeFile.size}</span></div>
                                <div className="text-slate-400">{lang === 'ar' ? 'الإصدار:' : 'Version:'} <span className="text-slate-700 font-bold">{activeFile.version}</span></div>
                                <div className="text-slate-400">{lang === 'ar' ? 'مرات التحميل:' : 'Downloads:'} <span className="text-slate-700 font-bold">{activeFile.downloads}</span></div>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">{lang === 'ar' ? 'الارتباطات' : 'Links'}</h5>
                            <div className="flex gap-2">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{activeFile.linkedEntity}</span>
                                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-100">{activeFile.folderId}</span>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">{lang === 'ar' ? 'سجل النشاط' : 'Audit Log'}</h5>
                            <div className="space-y-2 pl-2 border-l-2 border-slate-100">
                                <div className="text-xs text-slate-600 pl-2">
                                    <span className="font-bold">System</span> checked for viruses <span className="text-slate-400">- 10:00 AM</span>
                                </div>
                                <div className="text-xs text-slate-600 pl-2">
                                    <span className="font-bold">{activeFile.uploadedBy}</span> uploaded v1.0 <span className="text-slate-400">- {activeFile.uploadDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <button onClick={() => handleDownload(activeFile)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                        <Download size={18}/> {lang === 'ar' ? 'تحميل الملف' : 'Download File'}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handleShare} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2">
                            <Share2 size={16}/> {lang === 'ar' ? 'مشاركة' : 'Share'}
                        </button>
                        <button onClick={() => handleDelete(activeFile.id)} className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100">
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'رفع ملف جديد' : 'Upload New File'}</h3>
                    <button onClick={() => setIsUploadOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    {/* Drag & Drop Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer relative"
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2"><UploadCloud size={24}/></div>
                            {uploadFile ? (
                                <div className="text-sm font-bold text-green-600 flex items-center gap-2">
                                    <CheckCircle2 size={16}/> {uploadFile.name} ({(uploadFile.size/1024/1024).toFixed(2)} MB)
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-slate-700">{lang === 'ar' ? 'اضغط أو اسحب الملف هنا' : 'Click or Drag file here'}</span>
                                    <span className="text-xs text-slate-400">PDF, DWG, Images (Max 50MB)</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'المجلد' : 'Folder'}</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={uploadMeta.folder}
                                onChange={(e) => setUploadMeta({...uploadMeta, folder: e.target.value})}
                            >
                                <option value="root">Root</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'السرية' : 'Confidentiality'}</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={uploadMeta.confidentiality}
                                onChange={(e) => setUploadMeta({...uploadMeta, confidentiality: e.target.value})}
                            >
                                <option>Internal</option>
                                <option>Confidential</option>
                                <option>Public</option>
                            </select>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadProgress > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button onClick={() => setIsUploadOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                        onClick={handleUploadFile} 
                        disabled={!uploadFile || uploadProgress > 0}
                        className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadProgress > 0 ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16}/>}
                        {lang === 'ar' ? 'بدء الرفع' : 'Start Upload'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Icons & Helpers ---
function StatCard({ label, value, color, icon: Icon }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs font-bold text-slate-400">{label}</div>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

// Custom Icons
function DraftingCompassIcon({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="5" r="2"/><line x1="12" x2="19" y1="5" y2="21"/><line x1="12" x2="5" y1="5" y2="21"/><circle cx="12" cy="12" r="2"/></svg>;
}

function DatabaseIcon({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
}