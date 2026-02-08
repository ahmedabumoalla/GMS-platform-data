'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LocationTracker({ userId }: { userId: number }) {
  useEffect(() => {
    if (!userId) return;

    const sendLocation = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      supabase
        .from('users')
        .update({
          lat: latitude,
          lng: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', userId);

      supabase
        .from('location_logs')
        .insert({
          user_id: userId,
          lat: latitude,
          lng: longitude,
        });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Location error:', error);
    };

    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(sendLocation, handleError);

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation, handleError);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [userId]);

  return null;
}
