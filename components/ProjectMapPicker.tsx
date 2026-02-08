'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// مكون للتعامل مع النقر على الخريطة
function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });
    return null;
}

interface MapPickerProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function ProjectMapPicker({ lat, lng, onLocationSelect }: MapPickerProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // هذا الكود يعمل فقط في المتصفح لإصلاح مشكلة الأيقونات
        // Fix Leaflet's default icon path issues in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        setIsMounted(true);
    }, []);

    // إذا لم يتم تحميل المكون في المتصفح بعد، لا تقم بإرجاع أي شيء يخص الخريطة
    // هذا يمنع خطأ "appendChild" بشكل نهائي
    if (!isMounted) {
        return (
            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 animate-pulse">
                جاري تحميل الخريطة...
            </div>
        );
    }

    // إعداد أيقونة مخصصة (اختياري، لكن نستخدم الافتراضية المعدلة أعلاه لضمان العمل)
    const customIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    return (
        <MapContainer 
            center={[lat, lng]} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon}>
                <Popup>موقع المشروع المحدد</Popup>
            </Marker>
            <LocationMarker onLocationSelect={onLocationSelect} />
        </MapContainer>
    );
}