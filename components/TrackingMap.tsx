'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// إصلاح أيقونات Leaflet الافتراضية
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';
const customIcon = new L.Icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
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

export default function TrackingMap({ users }: { users: UserLocation[] }) {
  return (
    <MapContainer 
        center={[24.7136, 46.6753]} 
        zoom={6} 
        style={{ height: "100%", width: "100%" }}
    >
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
        />

        {users.map((user) => (
            <div key={user.id}>
                {/* الدبوس للموقع الحالي */}
                <Marker position={[user.lat, user.lng]} icon={customIcon}>
                    <Popup>
                        {/* تم تغيير المحاذاة إلى اليسار (text-left) */}
                        <div className="text-left font-sans">
                            <strong>{user.full_name}</strong>
                            <br/>
                            <span className="text-xs text-slate-500">{user.role}</span>
                            <hr className="my-1"/>
                            <div className="text-[10px] text-slate-400">
                                {/* تنسيق التاريخ بالإنجليزية */}
                                Last update: {new Date(user.last_location_update).toLocaleTimeString('en-US')}
                            </div>
                        </div>
                    </Popup>
                </Marker>

                {/* رسم المسار */}
                {user.path && user.path.length > 1 && (
                    <Polyline 
                        positions={user.path} 
                        pathOptions={{ color: 'blue', weight: 4, opacity: 0.6, dashArray: '10, 10' }} 
                    />
                )}
            </div>
        ))}
    </MapContainer>
  );
}