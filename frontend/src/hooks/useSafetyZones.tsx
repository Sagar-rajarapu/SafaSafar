import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SafetyZone {
  id: string;
  name: string;
  description?: string;
  zone_type: 'safe' | 'caution' | 'danger';
  coordinates: any; // GeoJSON coordinates
  radius?: number;
  center_lat?: number;
  center_lng?: number;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseSafetyZonesReturn {
  safetyZones: SafetyZone[];
  isLoading: boolean;
  createZone: (zone: Omit<SafetyZone, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateZone: (id: string, updates: Partial<SafetyZone>) => Promise<boolean>;
  deleteZone: (id: string) => Promise<boolean>;
  refreshZones: () => Promise<void>;
}

export const useSafetyZones = (): UseSafetyZonesReturn => {
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchSafetyZones = async () => {
    try {
      setIsLoading(true);
        const { data, error } = await supabase
          .from('safety_zones')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching safety zones:', error);
          return;
        }

        setSafetyZones((data || []) as SafetyZone[]);
    } catch (error) {
      console.error('Error fetching safety zones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createZone = async (zone: Omit<SafetyZone, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safety_zones')
        .insert({
          ...zone,
          created_by: user.id,
        });

      if (error) {
        console.error('Error creating safety zone:', error);
        return false;
      }

      await fetchSafetyZones();
      return true;
    } catch (error) {
      console.error('Error creating safety zone:', error);
      return false;
    }
  };

  const updateZone = async (id: string, updates: Partial<SafetyZone>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('safety_zones')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating safety zone:', error);
        return false;
      }

      await fetchSafetyZones();
      return true;
    } catch (error) {
      console.error('Error updating safety zone:', error);
      return false;
    }
  };

  const deleteZone = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('safety_zones')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting safety zone:', error);
        return false;
      }

      await fetchSafetyZones();
      return true;
    } catch (error) {
      console.error('Error deleting safety zone:', error);
      return false;
    }
  };

  const refreshZones = async () => {
    await fetchSafetyZones();
  };

  useEffect(() => {
    fetchSafetyZones();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('safety_zones_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'safety_zones'
        },
        () => {
          fetchSafetyZones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    safetyZones,
    isLoading,
    createZone,
    updateZone,
    deleteZone,
    refreshZones,
  };
};