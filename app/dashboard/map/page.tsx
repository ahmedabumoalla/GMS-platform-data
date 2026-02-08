'use client';

import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase'; // <-- تم تعطيل هذا لأنه يسبب المشكلة حالياً
import dynamic from 'next/dynamic';
import { Navigation, RefreshCw } from 'lucide-react';

// استدعاء المكون مع تعطيل SSR
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 animate-pulse">جاري تحميل الخريطة...</div>
});

type UserLocation = {
  id: number;
  full_name: string;
  role: string;
  lat: number;
  lng: number;
  last_location_update: string;
  path?: [number, number][];
};

export default function AdminMapPage() {
  const [users, setUsers] = useState<UserLocation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة جلب البيانات (بيانات وهمية للمعاينة)
  const fetchLocations = async () => {
    setLoading(true);
    
    // محاكاة تأخير الشبكة
    setTimeout(() => {
        const mockUsers: UserLocation[] = [
            {
                id: 1,
                full_name: "سعيد القحطاني",
                role: "فني كهرباء",
                lat: 24.7136,
                lng: 46.6753,
                last_location_update: new Date().toISOString(),
                path: [[24.7130, 46.6750], [24.7136, 46.6753]] // مسار وهمي
            },
            {
                id: 2,
                full_name: "ياسر الحربي",
                role: "سائق معدات",
                lat: 24.7236,
                lng: 46.6853,
                last_location_update: new Date().toISOString(),
                path: [[24.7200, 46.6800], [24.7236, 46.6853]]
            },
            {
                id: 3,
                full_name: "محمد علي",
                role: "مشرف ميداني",
                lat: 24.6936,
                lng: 46.7053,
                last_location_update: new Date().toISOString(),
                path: []
            }
        ];

        // تصفية المسارات إذا تم اختيار مستخدم محدد
        const displayedUsers = mockUsers.map(u => {
            if (selectedUserId && u.id !== selectedUserId) {
                return { ...u, path: [] }; // إخفاء المسار للبقية
            }
            return u;
        });

        setUsers(displayedUsers);
        setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchLocations();
    // تحديث وهمي كل 30 ثانية
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  return (
    <div className="h-full flex flex-col space-y-4 font-sans" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Navigation className="text-blue-600" /> غرفة التتبع المباشر
            </h2>
            <p className="text-sm text-slate-500">تحديثات لحظية للمواقع ومسارات التحرك للفرق الميدانية</p>
        </div>
        
        <div className="flex gap-3">
            <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none text-sm text-slate-700"
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
            >
                <option value="">عرض الكل (المواقع فقط)</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>تتبع: {u.full_name}</option>
                ))}
            </select>
            <button onClick={fetchLocations} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* الخريطة  */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px]">
        <TrackingMap users={users} />
      </div>
    </div>
  );
}