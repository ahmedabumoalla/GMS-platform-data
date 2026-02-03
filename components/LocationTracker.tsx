'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LocationTracker({ userId }: { userId: number }) {
  useEffect(() => {
    if (!userId) return;

    const sendLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      // 1. تحديث الموقع الحالي في جدول المستخدمين (للعرض اللحظي)
      supabase.from('users').update({ 
        lat: latitude, 
        lng: longitude,
        last_location_update: new Date().toISOString()
      }).eq('id', userId).then();

      // 2. إضافة سجل جديد في جدول التاريخ (لرسم المسار)
      supabase.from('location_logs').insert({
        user_id: userId,
        lat: latitude,
        lng: longitude
      }).then();
    };

    const handleError = (error: any) => {
      console.error("Error getting location", error);
    };

    // طلب الموقع ومراقبته
    if ('geolocation' in navigator) {
      // إرسال فوري عند الفتح
      navigator.geolocation.getCurrentPosition(sendLocation, handleError);

      // إعداد مؤقت للإرسال كل 60 ثانية (لتخفيف الضغط على القاعدة)
      const intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation, handleError);
      }, 60000); // كل دقيقة

      return () => clearInterval(intervalId);
    }
  }, [userId]);

  return null; // هذا المكون لا يعرض شيئاً، هو يعمل في الخلفية فقط
}