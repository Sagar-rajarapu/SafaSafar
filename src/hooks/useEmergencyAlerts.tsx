import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useLocation } from './useLocation';
import { toast } from './use-toast';

interface EmergencyAlert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  alert_type: 'panic' | 'medical' | 'theft' | 'harassment' | 'other';
  status: 'active' | 'acknowledged' | 'resolved';
  message?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

interface UseEmergencyAlertsReturn {
  alerts: EmergencyAlert[];
  isLoading: boolean;
  createAlert: (type: EmergencyAlert['alert_type'], message?: string) => Promise<boolean>;
  acknowledgeAlert: (alertId: string) => Promise<boolean>;
  resolveAlert: (alertId: string) => Promise<boolean>;
  activeAlertsCount: number;
}

export const useEmergencyAlerts = (): UseEmergencyAlertsReturn => {
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch alerts based on user type
  const fetchAlerts = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First get user profile to check user type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      let query = supabase.from('emergency_alerts').select('*');

      if (profile?.user_type === 'authority') {
        // Authorities can see all alerts
        query = query.order('created_at', { ascending: false });
      } else {
        // Tourists can only see their own alerts
        query = query.eq('user_id', user.id).order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data as EmergencyAlert[] || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error Loading Alerts",
        description: "Unable to load emergency alerts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create new emergency alert
  const createAlert = useCallback(async (
    type: EmergencyAlert['alert_type'], 
    message?: string
  ): Promise<boolean> => {
    if (!user || !currentLocation) {
      toast({
        title: "Cannot Create Alert",
        description: "Location access is required for emergency alerts.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .insert({
          user_id: user.id,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          alert_type: type,
          message: message || null,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "Emergency Alert Created",
        description: "Your emergency alert has been sent to authorities.",
        variant: "destructive",
      });

      // Also insert emergency location
      await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          is_emergency: true,
          timestamp: new Date().toISOString(),
        });

      // Refresh alerts
      fetchAlerts();
      return true;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Alert Creation Failed",
        description: "Unable to create emergency alert. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentLocation, fetchAlerts]);

  // Acknowledge alert (authorities only)
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Acknowledged",
        description: "Emergency alert has been acknowledged.",
      });

      fetchAlerts();
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Acknowledgment Failed",
        description: "Unable to acknowledge alert. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, fetchAlerts]);

  // Resolve alert (authorities only)
  const resolveAlert = useCallback(async (alertId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('emergency_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Resolved",
        description: "Emergency alert has been marked as resolved.",
      });

      fetchAlerts();
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Resolution Failed",
        description: "Unable to resolve alert. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, fetchAlerts]);

  // Set up real-time subscription for alerts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('emergency-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_alerts',
        },
        (payload) => {
          console.log('Emergency alert change:', payload);
          fetchAlerts(); // Refresh alerts when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAlerts]);

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const activeAlertsCount = alerts.filter(alert => alert.status === 'active').length;

  return {
    alerts,
    isLoading,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    activeAlertsCount,
  };
};