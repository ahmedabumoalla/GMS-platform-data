'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Navigation, RefreshCw } from 'lucide-react';

// استدعاء المكون مع تعطيل SSR
// تأكدنا أن المسار يشير إلى المجلد components الموجود في الصورة
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">Loading map...</div>
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

  // دالة جلب البيانات والمسارات
  const fetchLocations = async () => {
    setLoading(true);
    
    // 1. جلب المستخدمين الذين لديهم إحداثيات
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, role, lat, lng, last_location_update')
      .not('lat', 'is', null);

    if (usersData) {
      // 2. جلب المسارات لكل مستخدم
      const usersWithPaths = await Promise.all(usersData.map(async (user) => {
        if (selectedUserId && user.id !== selectedUserId) {
            return { ...user, path: [] };
        }

        const { data: logs } = await supabase
            .from('location_logs')
            .select('lat, lng')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: true })
            .limit(100);
        
        const path = logs ? logs.map(l => [l.lat, l.lng] as [number, number]) : [];
        
        return { 
            ...user, 
            path: path 
        } as UserLocation;
      }));

      setUsers(usersWithPaths);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  return (
    // تم تغيير الاتجاه إلى LTR
    <div className="h-full flex flex-col space-y-4" dir="ltr">
      
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Navigation className="text-blue-600" /> Live Tracking Room
            </h2>
            <p className="text-sm text-slate-500">Real-time updates for locations and movement paths</p>
        </div>
        
        <div className="flex gap-3">
            <select 
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none text-sm"
                onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : null)}
            >
                <option value="">Show All (Locations Only)</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>Path: {u.full_name}</option>
                ))}
            </select>
            <button onClick={fetchLocations} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* الخريطة */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px]">
        <TrackingMap users={users} />
      </div>
    </div>
  );
}