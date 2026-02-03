'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// إصلاح مشكلة أيقونات Leaflet الافتراضية في Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

type User = {
    id: number;
    full_name: string;
    role: string;
    job_title: string;
    lat: number;
    lng: number;
    is_active: boolean;
};

export default function Map({ users }: { users: User[] }) {
    // تصفية المستخدمين الذين لديهم إحداثيات فقط
    const activeUsers = users.filter(u => u.lat && u.lng);

    return (
        <MapContainer 
            center={[24.7136, 46.6753]} // مركز الخريطة (الرياض)
            zoom={6} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%", borderRadius: "1rem", zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {activeUsers.map((user) => (
                <Marker 
                    key={user.id} 
                    position={[user.lat, user.lng]}
                    icon={customIcon}
                >
                    <Popup>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-900">{user.full_name}</h3>
                            <p className="text-xs text-slate-500">{user.job_title}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] mt-1 text-white ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                {user.is_active ? 'Active' : 'Offline'}
                            </span>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}