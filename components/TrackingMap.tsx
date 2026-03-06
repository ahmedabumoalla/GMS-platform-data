'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Clock } from 'lucide-react';

// 🚀 توحيد نوع البيانات مع قاعدة البيانات الحقيقية لحل خطأ TypeScript
export type UserLocation = {
  id: string; // <-- تم تحويلها إلى string لحل الخطأ
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

// إصلاح أيقونة الخريطة الافتراضية في Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function TrackingMap({ users }: { users: UserLocation[] }) {
  // المركز الافتراضي (الرياض كمثال) أو آخر نقطة لفني نشط
  const center: [number, number] = users.length > 0 ? [users[0].lat, users[0].lng] : [24.7136, 46.6753];

  return (
    <MapContainer center={center} zoom={12} className="w-full h-full z-0" style={{ minHeight: '500px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {users.map((user) => (
        <div key={user.id}>
          {/* رسم خط سير الفني (إن وُجد) */}
          {user.path && user.path.length > 1 && (
            <Polyline positions={user.path} color="#3b82f6" weight={4} opacity={0.7} dashArray="8, 8" />
          )}
          
          <Marker position={[user.lat, user.lng]} icon={customIcon}>
            {/* 🚀 صندوق المعلومات الفخم الذي طلبته (Popup) */}
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-4 min-w-[240px] font-sans" dir="rtl">
                
                {/* 1. رأس البطاقة (الاسم والدور) */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-xl shadow-inner border border-blue-100">
                        {user.full_name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-black text-sm text-slate-900 m-0 leading-tight">{user.full_name}</h4>
                        <p className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1 m-0">{user.role}</p>
                    </div>
                </div>

                {/* 2. الهوية (الرقم الوظيفي والإقامة) */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] text-slate-400 mb-0.5 font-bold">الرقم الوظيفي</span>
                        <span className="font-mono text-xs font-bold text-slate-700 m-0 block">{user.job_id}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] text-slate-400 mb-0.5 font-bold">رقم الإقامة</span>
                        <span className="font-mono text-xs font-bold text-slate-700 m-0 block">{user.iqama_number}</span>
                    </div>
                </div>

                {/* 3. بيانات العمل الحالي */}
                <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0 shadow-sm shadow-purple-500/50"></span>
                        <div>
                            <span className="block text-[10px] text-slate-400 font-bold mb-0.5">المشروع الحالي</span>
                            <span className="font-bold text-slate-700 m-0 block">{user.current_project}</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-sm shadow-emerald-500/50"></span>
                        <div>
                            <span className="block text-[10px] text-slate-400 font-bold mb-0.5">المهمة الحالية</span>
                            <span className="font-bold text-slate-700 leading-tight block m-0">{user.current_task}</span>
                        </div>
                    </div>
                </div>

                {/* 4. وقت التحديث */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-center font-bold text-slate-400 flex items-center justify-center gap-1">
                    <Clock size={12} /> آخر تحديث: {new Date(user.last_location_update).toLocaleTimeString('ar-SA')}
                </div>
                
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  );
}