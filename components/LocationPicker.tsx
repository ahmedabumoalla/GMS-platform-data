'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents, Polyline } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- إعداد الأيقونات (لم يتم التغيير) ---
const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// مكون للتعامل مع النقر المتسلسل (Step Logic)
function MapClickHandler({ step, setStep, onStartChange, onEndChange }: any) {
    useMapEvents({
        click(e) {
            if (step === 'center') {
                // الضغطة الأولى: تحدد الطرف الأول للقطر
                onStartChange(e.latlng.lat, e.latlng.lng);
                setStep('edge'); // الانتقال للخطوة التالية
            } else {
                // الضغطة الثانية: تحدد الطرف الثاني للقطر
                onEndChange(e.latlng.lat, e.latlng.lng);
                setStep('center'); // العودة للبداية
            }
        },
    });
    return null;
}

// حل مشكلة تحميل الخريطة (المنطقة الرمادية)
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 300);
    }, [map]);
    return null;
}

type Props = {
    startPos: { lat: number, lng: number } | null;
    endPos: { lat: number, lng: number } | null;
    onStartChange: (lat: number, lng: number) => void;
    onEndChange: (lat: number, lng: number) => void;
};

export default function LocationPicker({ startPos, endPos, onStartChange, onEndChange }: Props) {
    // حالة لتتبع الخطوة الحالية
    const [selectionStep, setSelectionStep] = useState<'center' | 'edge'>('center');

    const defaultCenter = { lat: 24.7136, lng: 46.6753 };
    // هنا قمنا بتغيير المسميات منطقياً فقط، لكن القيم تأتي من الـ Props كما هي
    const point1Pos = startPos || defaultCenter;
    const point2Pos = endPos || { lat: defaultCenter.lat + 0.01, lng: defaultCenter.lng + 0.01 };

    const startMarkerRef = useRef<L.Marker>(null);
    const endMarkerRef = useRef<L.Marker>(null);

    // --- التعديل الجوهري هنا ---
    
    // 1. حساب نقطة المنتصف (مركز الدائرة الجديد)
    const calculateMidPoint = () => {
        return {
            lat: (point1Pos.lat + point2Pos.lat) / 2,
            lng: (point1Pos.lng + point2Pos.lng) / 2
        };
    };

    // 2. حساب نصف القطر (المسافة بين النقطتين مقسومة على 2)
    const calculateRadius = () => {
        const p1 = L.latLng(point1Pos.lat, point1Pos.lng);
        const p2 = L.latLng(point2Pos.lat, point2Pos.lng);
        return p1.distanceTo(p2) / 2;
    };

    const midPoint = calculateMidPoint();
    const radius = calculateRadius();

    // معالجات السحب اليدوي
    const point1Handlers = useMemo(() => ({
        dragend() {
            const marker = startMarkerRef.current;
            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onStartChange(lat, lng);
            }
        },
    }), [onStartChange]);

    const point2Handlers = useMemo(() => ({
        dragend() {
            const marker = endMarkerRef.current;
            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onEndChange(lat, lng);
            }
        },
    }), [onEndChange]);

    return (
        <div className="relative h-full w-full">
            {/* رسالة توجيهية للمستخدم تظهر فوق الخريطة */}
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-md border border-slate-200 text-xs font-bold pointer-events-none">
                {selectionStep === 'center' ? (
                    <span className="text-green-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        الخطوة 1: حدد الطرف الأول للدائرة
                    </span>
                ) : (
                    <span className="text-red-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        الخطوة 2: حدد الطرف المقابل للدائرة
                    </span>
                )}
            </div>

            <MapContainer 
                center={[midPoint.lat, midPoint.lng]} // جعلنا الكاميرا تتوسط الدائرة
                zoom={11} 
                style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapResizer />
                
                {/* التعامل مع النقرات المتسلسلة */}
                <MapClickHandler 
                    step={selectionStep} 
                    setStep={setSelectionStep}
                    onStartChange={onStartChange} 
                    onEndChange={onEndChange} 
                />

                {/* الدائرة: مركزها هو المنتصف المحسوب */}
                <Circle 
                    center={midPoint} 
                    radius={radius}
                    pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }} 
                />

                {/* الدبوس الأول (على الحافة 1) */}
                <Marker 
                    draggable={true} 
                    eventHandlers={point1Handlers} 
                    position={point1Pos} 
                    icon={startIcon}
                    ref={startMarkerRef}
                    opacity={selectionStep === 'center' ? 1 : 0.7}
                >
                    <Popup>الطرف الأول</Popup>
                </Marker>

                {/* الدبوس الثاني (على الحافة 2) */}
                <Marker 
                    draggable={true} 
                    eventHandlers={point2Handlers} 
                    position={point2Pos} 
                    icon={endIcon}
                    ref={endMarkerRef}
                    opacity={selectionStep === 'edge' ? 1 : 0.7}
                >
                    <Popup>
                        الطرف الثاني
                        <br/>
                        قطر الدائرة: {((radius * 2) / 1000).toFixed(2)} كم
                    </Popup>
                </Marker>

                {/* خط يمثل القطر (Diameter) */}
                <Polyline 
                    positions={[
                        [point1Pos.lat, point1Pos.lng],
                        [point2Pos.lat, point2Pos.lng]
                    ]}
                    pathOptions={{ color: 'gray', weight: 1, dashArray: '5, 5', opacity: 0.5 }}
                />

            </MapContainer>
        </div>
    );
}