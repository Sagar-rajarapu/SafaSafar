import AsyncStorage from '@react-native-async-storage/async-storage';
import {LocationData} from './LocationService';
import {AnomalyEvent} from './AIAnomalyDetectionService';
import {DigitalTouristID} from './BlockchainService';

export interface TouristCluster {
  id: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  touristCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
  tourists: Array<{
    id: string;
    name: string;
    lastSeen: Date;
    status: 'safe' | 'warning' | 'danger' | 'missing';
  }>;
}

export interface HeatMapData {
  id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  intensity: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  incidentCount: number;
  lastIncident: Date;
  zoneType: 'cave' | 'forest' | 'restricted' | 'urban' | 'rural';
}

export interface EFIRData {
  id: string;
  touristId: string;
  touristName: string;
  incidentType: 'missing_person' | 'safety_concern' | 'emergency' | 'anomaly';
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'under_investigation' | 'resolved';
  assignedOfficer?: string;
  caseNumber?: string;
  evidence: Array<{
    type: 'location' | 'audio' | 'video' | 'photo' | 'anomaly_data';
    data: string;
    timestamp: Date;
  }>;
  lastKnownLocation?: LocationData;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface DashboardStats {
  totalTourists: number;
  activeTourists: number;
  missingTourists: number;
  highRiskTourists: number;
  totalIncidents: number;
  resolvedIncidents: number;
  pendingEFIRs: number;
  averageResponseTime: number; // minutes
  lastUpdated: Date;
}

export interface AuthorityUser {
  id: string;
  name: string;
  role: 'police' | 'tourism_official' | 'admin';
  department: string;
  badgeNumber?: string;
  permissions: string[];
  lastLogin: Date;
}

class AuthorityDashboardServiceClass {
  private tourists: Map<string, DigitalTouristID> = new Map();
  private touristLocations: Map<string, LocationData> = new Map();
  private anomalyEvents: AnomalyEvent[] = [];
  private touristClusters: TouristCluster[] = [];
  private heatMapData: HeatMapData[] = [];
  private efirRecords: EFIRData[] = [];
  private currentUser: AuthorityUser | null = null;

  async initialize() {
    try {
      await this.loadTouristData();
      await this.loadAnomalyEvents();
      await this.loadEFIRRecords();
      await this.loadHeatMapData();
      await this.loadCurrentUser();
      console.log('AuthorityDashboardService initialized successfully');
    } catch (error) {
      console.error('AuthorityDashboardService initialization failed:', error);
    }
  }

  private async loadTouristData() {
    try {
      const tourists = await AsyncStorage.getItem('authorityTourists');
      if (tourists) {
        const parsed = JSON.parse(tourists);
        this.tourists = new Map(parsed);
      }
    } catch (error) {
      console.error('Failed to load tourist data:', error);
    }
  }

  private async saveTouristData() {
    try {
      const touristsArray = Array.from(this.tourists.entries());
      await AsyncStorage.setItem(
        'authorityTourists',
        JSON.stringify(touristsArray),
      );
    } catch (error) {
      console.error('Failed to save tourist data:', error);
    }
  }

  private async loadAnomalyEvents() {
    try {
      const events = await AsyncStorage.getItem('authorityAnomalyEvents');
      if (events) {
        this.anomalyEvents = JSON.parse(events).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp),
          resolvedAt: event.resolvedAt ? new Date(event.resolvedAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load anomaly events:', error);
    }
  }

  private async saveAnomalyEvents() {
    try {
      await AsyncStorage.setItem(
        'authorityAnomalyEvents',
        JSON.stringify(this.anomalyEvents),
      );
    } catch (error) {
      console.error('Failed to save anomaly events:', error);
    }
  }

  private async loadEFIRRecords() {
    try {
      const records = await AsyncStorage.getItem('efirRecords');
      if (records) {
        this.efirRecords = JSON.parse(records).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
          lastKnownLocation: record.lastKnownLocation
            ? {
                ...record.lastKnownLocation,
                timestamp: record.lastKnownLocation.timestamp,
              }
            : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load EFIR records:', error);
    }
  }

  private async saveEFIRRecords() {
    try {
      await AsyncStorage.setItem(
        'efirRecords',
        JSON.stringify(this.efirRecords),
      );
    } catch (error) {
      console.error('Failed to save EFIR records:', error);
    }
  }

  private async loadHeatMapData() {
    try {
      const data = await AsyncStorage.getItem('heatMapData');
      if (data) {
        this.heatMapData = JSON.parse(data).map((item: any) => ({
          ...item,
          lastIncident: new Date(item.lastIncident),
        }));
      }
    } catch (error) {
      console.error('Failed to load heat map data:', error);
    }
  }

  private async saveHeatMapData() {
    try {
      await AsyncStorage.setItem(
        'heatMapData',
        JSON.stringify(this.heatMapData),
      );
    } catch (error) {
      console.error('Failed to save heat map data:', error);
    }
  }

  private async loadCurrentUser() {
    try {
      const user = await AsyncStorage.getItem('authorityUser');
      if (user) {
        this.currentUser = {
          ...JSON.parse(user),
          lastLogin: new Date(JSON.parse(user).lastLogin),
        };
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  }

  async login(username: string, password: string): Promise<AuthorityUser> {
    // Mock authentication - in real implementation, this would call backend API
    const mockUsers: AuthorityUser[] = [
      {
        id: 'police_001',
        name: 'Inspector Rajesh Kumar',
        role: 'police',
        department: 'Tourist Police Unit',
        badgeNumber: 'TPU-001',
        permissions: [
          'view_tourists',
          'create_efir',
          'investigate',
          'emergency_response',
        ],
        lastLogin: new Date(),
      },
      {
        id: 'tourism_001',
        name: 'Ms. Priya Sharma',
        role: 'tourism_official',
        department: 'Tourism Department',
        permissions: ['view_tourists', 'view_analytics', 'coordinate_rescue'],
        lastLogin: new Date(),
      },
    ];

    const user = mockUsers.find(
      u => u.id === username && password === 'password123',
    );
    if (!user) {
      throw new Error('Invalid credentials');
    }

    this.currentUser = user;
    await AsyncStorage.setItem('authorityUser', JSON.stringify(user));
    return user;
  }

  async addTourist(tourist: DigitalTouristID) {
    this.tourists.set(tourist.id, tourist);
    await this.saveTouristData();
    await this.updateTouristClusters();
  }

  async updateTouristLocation(touristId: string, location: LocationData) {
    this.touristLocations.set(touristId, location);
    await this.updateTouristClusters();
  }

  async addAnomalyEvent(event: AnomalyEvent) {
    this.anomalyEvents.push(event);
    await this.saveAnomalyEvents();
    await this.updateHeatMapData(event);
  }

  private async updateTouristClusters() {
    const locations = Array.from(this.touristLocations.entries());
    this.touristClusters = this.calculateTouristClusters(locations);
  }

  private calculateTouristClusters(
    locations: Array<[string, LocationData]>,
  ): TouristCluster[] {
    const clusters: TouristCluster[] = [];
    const processed = new Set<string>();

    for (const [touristId, location] of locations) {
      if (processed.has(touristId)) continue;

      const cluster: TouristCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: 500, // 500 meters
        touristCount: 1,
        riskLevel: 'low',
        lastUpdated: new Date(),
        tourists: [
          {
            id: touristId,
            name: this.tourists.get(touristId)?.kycData.fullName || 'Unknown',
            lastSeen: new Date(location.timestamp),
            status: 'safe',
          },
        ],
      };

      // Find nearby tourists
      for (const [otherTouristId, otherLocation] of locations) {
        if (processed.has(otherTouristId) || otherTouristId === touristId)
          continue;

        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          otherLocation.latitude,
          otherLocation.longitude,
        );

        if (distance <= cluster.radius) {
          cluster.touristCount++;
          cluster.tourists.push({
            id: otherTouristId,
            name:
              this.tourists.get(otherTouristId)?.kycData.fullName || 'Unknown',
            lastSeen: new Date(otherLocation.timestamp),
            status: 'safe',
          });
          processed.add(otherTouristId);
        }
      }

      // Determine risk level based on cluster characteristics
      cluster.riskLevel = this.determineClusterRiskLevel(cluster);
      clusters.push(cluster);
      processed.add(touristId);
    }

    return clusters;
  }

  private determineClusterRiskLevel(
    cluster: TouristCluster,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const now = Date.now();
    const recentTourists = cluster.tourists.filter(
      t => (now - t.lastSeen.getTime()) / (1000 * 60) <= 30, // Last 30 minutes
    );

    if (recentTourists.length === 0) return 'critical';
    if (recentTourists.length < cluster.touristCount * 0.5) return 'high';
    if (cluster.touristCount > 20) return 'medium';
    return 'low';
  }

  private async updateHeatMapData(event: AnomalyEvent) {
    if (!event.location) return;

    const existingPoint = this.heatMapData.find(
      point =>
        this.calculateDistance(
          point.coordinates.latitude,
          point.coordinates.longitude,
          event.location!.latitude,
          event.location!.longitude,
        ) <= 100, // Within 100 meters
    );

    if (existingPoint) {
      existingPoint.intensity = Math.min(1, existingPoint.intensity + 0.1);
      existingPoint.incidentCount++;
      existingPoint.lastIncident = event.timestamp;
      existingPoint.riskLevel = this.calculateRiskLevel(
        existingPoint.intensity,
      );
    } else {
      const newPoint: HeatMapData = {
        id: `heat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        coordinates: {
          latitude: event.location.latitude,
          longitude: event.location.longitude,
        },
        intensity: 0.1,
        riskLevel: 'low',
        incidentCount: 1,
        lastIncident: event.timestamp,
        zoneType: this.determineZoneType(event.location),
      };
      this.heatMapData.push(newPoint);
    }

    await this.saveHeatMapData();
  }

  private determineZoneType(
    location: LocationData,
  ): 'cave' | 'forest' | 'restricted' | 'urban' | 'rural' {
    // Mock zone type determination based on coordinates
    // In real implementation, this would use GIS data
    const lat = location.latitude;
    const lng = location.longitude;

    if (lat > 20.2 && lat < 20.4 && lng > 85.7 && lng < 85.9) return 'cave';
    if (lat > 21.5 && lat < 22.0 && lng > 86.0 && lng < 86.5) return 'forest';
    if (lat > 20.25 && lat < 20.35 && lng > 85.8 && lng < 85.85)
      return 'restricted';
    if (lat > 20.0 && lat < 20.5 && lng > 85.5 && lng < 86.0) return 'urban';
    return 'rural';
  }

  private calculateRiskLevel(
    intensity: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (intensity >= 0.8) return 'critical';
    if (intensity >= 0.6) return 'high';
    if (intensity >= 0.3) return 'medium';
    return 'low';
  }

  async generateEFIR(
    touristId: string,
    incidentType: EFIRData['incidentType'],
    description: string,
  ): Promise<EFIRData> {
    const tourist = this.tourists.get(touristId);
    if (!tourist) {
      throw new Error('Tourist not found');
    }

    const lastLocation = this.touristLocations.get(touristId);
    const caseNumber = this.generateCaseNumber();

    const efir: EFIRData = {
      id: `EFIR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      touristId,
      touristName: tourist.kycData.fullName,
      incidentType,
      description,
      location: {
        latitude: lastLocation?.latitude || 0,
        longitude: lastLocation?.longitude || 0,
        address: 'Location to be determined',
      },
      timestamp: new Date(),
      severity: this.determineSeverity(incidentType),
      status: 'draft',
      caseNumber,
      evidence: [],
      lastKnownLocation: lastLocation,
      emergencyContacts: tourist.emergencyContacts.map(contact => ({
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
      })),
    };

    this.efirRecords.push(efir);
    await this.saveEFIRRecords();

    return efir;
  }

  private generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const sequence = String(this.efirRecords.length + 1).padStart(4, '0');
    return `EFIR/${year}${month}${day}/${sequence}`;
  }

  private determineSeverity(
    incidentType: EFIRData['incidentType'],
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (incidentType) {
      case 'missing_person':
      case 'emergency':
        return 'critical';
      case 'safety_concern':
        return 'high';
      case 'anomaly':
        return 'medium';
      default:
        return 'low';
    }
  }

  async updateEFIRStatus(
    efirId: string,
    status: EFIRData['status'],
    assignedOfficer?: string,
  ) {
    const efir = this.efirRecords.find(e => e.id === efirId);
    if (efir) {
      efir.status = status;
      if (assignedOfficer) {
        efir.assignedOfficer = assignedOfficer;
      }
      await this.saveEFIRRecords();
    }
  }

  async addEvidence(efirId: string, evidence: EFIRData['evidence'][0]) {
    const efir = this.efirRecords.find(e => e.id === efirId);
    if (efir) {
      efir.evidence.push(evidence);
      await this.saveEFIRRecords();
    }
  }

  getDashboardStats(): DashboardStats {
    const now = new Date();
    const activeThreshold = 30 * 60 * 1000; // 30 minutes

    const activeTourists = Array.from(this.touristLocations.values()).filter(
      loc => now.getTime() - loc.timestamp <= activeThreshold,
    ).length;

    const missingTourists = this.tourists.size - activeTourists;
    const highRiskTourists = this.anomalyEvents.filter(
      e => !e.isResolved && e.severity === 'critical',
    ).length;

    const totalIncidents = this.anomalyEvents.length;
    const resolvedIncidents = this.anomalyEvents.filter(
      e => e.isResolved,
    ).length;
    const pendingEFIRs = this.efirRecords.filter(
      e => e.status === 'draft' || e.status === 'submitted',
    ).length;

    return {
      totalTourists: this.tourists.size,
      activeTourists,
      missingTourists,
      highRiskTourists,
      totalIncidents,
      resolvedIncidents,
      pendingEFIRs,
      averageResponseTime: 15, // Mock data
      lastUpdated: now,
    };
  }

  getTouristClusters(): TouristCluster[] {
    return [...this.touristClusters];
  }

  getHeatMapData(): HeatMapData[] {
    return [...this.heatMapData];
  }

  getEFIRRecords(): EFIRData[] {
    return [...this.efirRecords];
  }

  getTouristById(touristId: string): DigitalTouristID | undefined {
    return this.tourists.get(touristId);
  }

  getTouristLocation(touristId: string): LocationData | undefined {
    return this.touristLocations.get(touristId);
  }

  getAnomalyEvents(): AnomalyEvent[] {
    return [...this.anomalyEvents];
  }

  getCurrentUser(): AuthorityUser | null {
    return this.currentUser;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const AuthorityDashboardService = new AuthorityDashboardServiceClass();
