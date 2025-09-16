import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

interface UseLocationReturn {
  currentLocation: LocationData | null;
  isTracking: boolean;
  isLocationEnabled: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  locationHistory: LocationData[];
}

export const useLocation = (): UseLocationReturn => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);

  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator;

  // Request location permission
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!isGeolocationSupported) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      setIsLocationEnabled(true);
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(),
      };
      setCurrentLocation(locationData);

      toast({
        title: "Location Access Granted",
        description: "Your location will be used for safety monitoring.",
      });

      return true;
    } catch (error: any) {
      let errorMessage = "Unable to access your location.";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access was denied. Please enable location services in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out.";
          break;
      }

      toast({
        title: "Location Access Error",
        description: errorMessage,
        variant: "destructive",
      });

      setIsLocationEnabled(false);
      return false;
    }
  }, [isGeolocationSupported]);

  // Update location in database
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      const locationData: LocationData = {
        latitude: lat,
        longitude: lng,
        timestamp: new Date(),
      };

      setCurrentLocation(locationData);
      setLocationHistory(prev => [...prev.slice(-9), locationData]); // Keep last 10 locations
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Location Update Failed",
        description: "Unable to update your location. Please try again.",
        variant: "destructive",
      });
    }
  }, [user]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!isGeolocationSupported || !user) return;

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setIsTracking(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        updateLocation(latitude, longitude);
      },
      (error) => {
        console.error('Location tracking error:', error);
        toast({
          title: "Location Tracking Error",
          description: "Unable to track your location continuously.",
          variant: "destructive",
        });
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // 1 minute
      }
    );

    setWatchId(id);
  }, [isGeolocationSupported, user, requestLocationPermission, updateLocation]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Check location permission on load
  useEffect(() => {
    if (isGeolocationSupported && user) {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        setIsLocationEnabled(result.state === 'granted');
      });
    }
  }, [isGeolocationSupported, user]);

  return {
    currentLocation,
    isTracking,
    isLocationEnabled,
    startTracking,
    stopTracking,
    updateLocation,
    requestLocationPermission,
    locationHistory,
  };
};