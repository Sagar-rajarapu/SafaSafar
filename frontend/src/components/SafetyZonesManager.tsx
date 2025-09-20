import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Shield, AlertTriangle, AlertOctagon, Trash2, Eye } from 'lucide-react';
import { useSafetyZones, SafetyZone } from '@/hooks/useSafetyZones';
import { toast } from 'sonner';

interface SafetyZonesManagerProps {
  onZoneSelect?: (zone: SafetyZone) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const SafetyZonesManager = ({ onZoneSelect, selectedLocation }: SafetyZonesManagerProps) => {
  const { safetyZones, isLoading, createZone, deleteZone } = useSafetyZones();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newZone, setNewZone] = useState<{
    name: string;
    description: string;
    zone_type: 'safe' | 'caution' | 'danger';
    radius: number;
  }>({
    name: '',
    description: '',
    zone_type: 'safe',
    radius: 500,
  });

  const handleCreateZone = async () => {
    if (!newZone.name.trim()) {
      toast.error('Zone name is required');
      return;
    }

    if (!selectedLocation) {
      toast.error('Please select a location on the map first');
      return;
    }

    const success = await createZone({
      ...newZone,
      center_lat: selectedLocation.lat,
      center_lng: selectedLocation.lng,
      coordinates: {
        type: 'Point',
        coordinates: [selectedLocation.lng, selectedLocation.lat]
      },
      is_active: true,
    });

    if (success) {
      toast.success('Safety zone created successfully');
      setIsCreateDialogOpen(false);
      setNewZone({
        name: '',
        description: '',
        zone_type: 'safe',
        radius: 500,
      });
    } else {
      toast.error('Failed to create safety zone');
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const success = await deleteZone(id);
      if (success) {
        toast.success('Safety zone deleted');
      } else {
        toast.error('Failed to delete safety zone');
      }
    }
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'safe': return <Shield className="w-4 h-4 text-safety" />;
      case 'caution': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'danger': return <AlertOctagon className="w-4 h-4 text-emergency" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getZoneBadgeVariant = (type: string) => {
    switch (type) {
      case 'safe': return 'default';
      case 'caution': return 'secondary';
      case 'danger': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Safety Zones
            </CardTitle>
            <CardDescription>
              Manage safety zones for tourist areas
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Zone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Safety Zone</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="zone-name">Zone Name</Label>
                  <Input
                    id="zone-name"
                    value={newZone.name}
                    onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter zone name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zone-description">Description</Label>
                  <Textarea
                    id="zone-description"
                    value={newZone.description}
                    onChange={(e) => setNewZone(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zone-type">Safety Level</Label>
                  <Select 
                    value={newZone.zone_type} 
                    onValueChange={(value: 'safe' | 'caution' | 'danger') => 
                      setNewZone(prev => ({ ...prev, zone_type: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">Safe Zone</SelectItem>
                      <SelectItem value="caution">Caution Zone</SelectItem>
                      <SelectItem value="danger">Danger Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone-radius">Radius (meters)</Label>
                  <Input
                    id="zone-radius"
                    type="number"
                    value={newZone.radius}
                    onChange={(e) => setNewZone(prev => ({ ...prev, radius: Number(e.target.value) }))}
                    min="50"
                    max="5000"
                    className="mt-1"
                  />
                </div>
                {selectedLocation && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                    <strong>Location:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                )}
                {!selectedLocation && (
                  <div className="text-sm text-warning bg-warning/10 p-3 rounded border border-warning/20">
                    Please select a location on the map first
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateZone} disabled={!selectedLocation}>
                  Create Zone
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : safetyZones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No safety zones created yet</p>
            <p className="text-sm">Click "Add Zone" to create your first safety zone</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {safetyZones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getZoneIcon(zone.zone_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{zone.name}</h4>
                      <Badge variant={getZoneBadgeVariant(zone.zone_type)} className="text-xs">
                        {zone.zone_type}
                      </Badge>
                    </div>
                    {zone.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {zone.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {zone.radius}m radius
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onZoneSelect?.(zone)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                    className="h-8 w-8 p-0 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyZonesManager;