'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Navigation, RefreshCw } from 'lucide-react';
import { useDashboard } from '../layout';

// استدعاء مكون الخريطة بدون SSR
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 text-blue-500 font-bold animate-pulse gap-3"><Navigation size={32} className="animate-bounce"/> جاري الاتصال بالأقمار الصناعية...</div>
});

// 🚀 تعريف نوع البيانات المطابق لـ TrackingMap
export type UserLocation = {
  id: string;
  full_name: string;
  role: string;
  job_id: string;
  iqama_number: string;
  lat: number;
  lng: number;
  last_location_update: string;
  path: [number, number][];
  current_project: string;
  current_task: string;
};

export default function AdminMapPage() {
  const { lang, user } = useDashboard(); 
  const isRTL = lang === 'ar';

  const [users, setUsers] = useState<UserLocation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🚀 دالة جلب المواقع الحقيقية من قاعدة البيانات
  const fetchActiveLocations = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('technician_locations')
            .select(`
                user_id, lat, lng, path, last_update, current_task,
                profiles:user_id (id, full_name, role, job_title),
                projects:current_project_id (title)
            `)
            .eq('is_active', true); // جلب النشطين فقط

        if (error) throw error;

        if (data) {
            const formattedUsers: UserLocation[] = data.map((loc: any) => {
                // توليد معرفات مؤقتة في حال لم يتم إضافتها في جدول Profiles بعد
                const generatedJobId = 'JD-' + (loc.user_id.substring(0, 4).toUpperCase());
                const generatedIqama = '2' + Math.floor(Math.random() * 900000000 + 100000000);

                return {
                    id: loc.user_id,
                    full_name: loc.profiles?.full_name || 'مستخدم غير معروف',
                    role: loc.profiles?.job_title || loc.profiles?.role || 'فني ميداني',
                    job_id: generatedJobId, // سيقرأ الحقيقي لاحقاً
                    iqama_number: generatedIqama, // سيقرأ الحقيقي لاحقاً
                    lat: loc.lat,
                    lng: loc.lng,
                    last_location_update: loc.last_update || new Date().toISOString(),
                    path: loc.path || [],
                    current_project: loc.projects?.title || 'مهمة صيانة عامة',
                    current_task: loc.current_task || 'في الموقع'
                };
            });
            setUsers(formattedUsers);
        }
    } catch (error) {
        console.error("Error fetching locations:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLocations();

    // 🚀 التتبع اللحظي (WebSockets): الخريطة تتحدث تلقائياً بدون تحديث الصفحة!
    const channel = supabase.channel('realtime_locations')
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'technician_locations'
      }, () => {
          fetchActiveLocations(); // تحديث فوري عند أي حركة
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayedUsers = selectedUserId ? users.filter(u => u.id === selectedUserId) : users;

  return (
    <div className="h-full flex flex-col space-y-4 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Navigation className="text-blue-600 animate-pulse" /> {isRTL ? 'غرفة التتبع المباشر' : 'Live Tracking'}
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live
                </span>
            </h2>
            <p className="text-sm text-slate-500">{isRTL ? 'تحديثات لحظية (Real-Time) لمواقع الفرق الميدانية النشطة' : 'Real-Time location updates for active teams'}</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <select 
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none text-sm font-bold text-slate-700 dark:text-slate-200 flex-1 md:flex-none cursor-pointer"
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                value={selectedUserId || ''}
            >
                <option value="">{isRTL ? 'عرض كل الفرق' : 'View All'} ({users.length})</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{isRTL ? 'تتبع:' : 'Track:'} {u.full_name}</option>
                ))}
            </select>
            <button onClick={fetchActiveLocations} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition shadow-sm" title="تحديث يدوي">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[500px]">
        {users.length === 0 && !loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/50 backdrop-blur-sm">
                 <Navigation size={48} className="text-slate-300 mb-4" />
                 <p className="text-slate-500 font-bold text-lg">لا توجد فرق ميدانية نشطة حالياً</p>
                 <p className="text-slate-400 text-sm">سيظهر الفنيون هنا بمجرد تسجيل دخولهم في الميدان</p>
             </div>
        ) : (
             <TrackingMap users={displayedUsers} />
        )}
      </div>
    </div>
  );
}