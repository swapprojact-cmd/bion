import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, AlertCircle, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LocationPermissionBannerProps {
  onLocationUpdate?: (coords: { lat: number; lng: number }) => void;
  compact?: boolean;
}

export const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({
  onLocationUpdate,
  compact = false,
}) => {
  const { currentUser, updateCurrentProfile } = useAuth();
  const [gpsStatus, setGpsStatus] = useState<'prompt' | 'requesting' | 'granted' | 'denied'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('bicircle_gps_status');
      if (saved === 'granted') return 'granted';
      if (saved === 'dismissed') return 'denied';
    }
    return 'prompt';
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (typeof window !== 'undefined') {
      const savedLat = sessionStorage.getItem('bicircle_gps_lat');
      const savedLng = sessionStorage.getItem('bicircle_gps_lng');
      if (savedLat && savedLng) {
        return { lat: parseFloat(savedLat), lng: parseFloat(savedLng) };
      }
    }
    return null;
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // If already granted, propagate on mount
  useEffect(() => {
    if (coords && onLocationUpdate) {
      onLocationUpdate(coords);
    }
  }, [coords]);

  const requestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('requesting');
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(newCoords);
        setGpsStatus('granted');
        sessionStorage.setItem('bicircle_gps_status', 'granted');
        sessionStorage.setItem('bicircle_gps_lat', newCoords.lat.toString());
        sessionStorage.setItem('bicircle_gps_lng', newCoords.lng.toString());

        if (onLocationUpdate) {
          onLocationUpdate(newCoords);
        }

        if (currentUser && updateCurrentProfile) {
          try {
            await updateCurrentProfile({
              location_lat: newCoords.lat,
              location_lng: newCoords.lng,
              location_city: 'Live GPS Location',
            });
          } catch (e) {
            console.warn('GPS location update to profile:', e);
          }
        }
      },
      (err) => {
        setGpsStatus('denied');
        setErrorMsg(
          err.code === 1
            ? 'Location permission was denied in your browser settings. You can still browse manually.'
            : 'Could not acquire GPS position. Try again or enter your city manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('bicircle_gps_status', 'dismissed');
  };

  if (dismissed && gpsStatus !== 'granted') return null;

  if (gpsStatus === 'granted' && coords) {
    return (
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Live GPS Active:</span>
          <span>
            {coords.lat.toFixed(3)}°, {coords.lng.toFixed(3)}° · Showing real distances to nearby members & posts
          </span>
        </div>
        <button
          onClick={requestLocation}
          className="text-emerald-400 hover:text-emerald-200 underline text-[11px] cursor-pointer"
        >
          Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#191321] via-[#211630] to-[#191321] border border-[#9B5CFF]/30 text-white shadow-md relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#B9B0C6] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        title="Dismiss location banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#9B5CFF]/20 border border-[#9B5CFF]/40 text-[#9B5CFF] shrink-0 mt-0.5">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Enable Real GPS Location</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                  Real Proximity
                </span>
              </h4>
            </div>
            <p className="text-xs text-[#D8D0E3] mt-1 max-w-xl leading-relaxed">
              BiCircle uses your device GPS to calculate real-world distances to nearby bisexual community members and local social posts. Your precise street address is never shared publicly.
            </p>
            {errorMsg && (
              <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={requestLocation}
            disabled={gpsStatus === 'requesting'}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#9B5CFF]/25 cursor-pointer transition-all disabled:opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{gpsStatus === 'requesting' ? 'Requesting GPS...' : 'Allow Live GPS'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-xs text-[#B9B0C6] hover:text-white rounded-xl border border-[#2D233D] hover:bg-white/5 cursor-pointer"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
