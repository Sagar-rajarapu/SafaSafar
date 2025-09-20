import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineData {
  id: string;
  type:
    | 'location'
    | 'panic'
    | 'anomaly'
    | 'geo_fence'
    | 'safety_score'
    | 'digital_id';
  data: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  isSynced: boolean;
}

export interface OfflineConfig {
  enabled: boolean;
  maxStorageSize: number; // MB
  syncInterval: number; // minutes
  retryDelay: number; // minutes
  maxRetries: number;
  autoSync: boolean;
  compressionEnabled: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
  syncedItems: number;
  failedItems: number;
  isSyncing: boolean;
}

class OfflineServiceClass {
  private config: OfflineConfig = {
    enabled: true,
    maxStorageSize: 50, // 50 MB
    maxRetries: 3,
    syncInterval: 5, // 5 minutes
    retryDelay: 2, // 2 minutes
    autoSync: true,
    compressionEnabled: true,
  };

  private offlineData: OfflineData[] = [];
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSync: null,
    pendingItems: 0,
    syncedItems: 0,
    failedItems: 0,
    isSyncing: false,
  };

  private syncInterval: NodeJS.Timeout | null = null;
  private networkListener: any = null;

  async initialize() {
    try {
      await this.loadConfiguration();
      await this.loadOfflineData();
      await this.setupNetworkListener();
      await this.startAutoSync();
      console.log('OfflineService initialized successfully');
    } catch (error) {
      console.error('OfflineService initialization failed:', error);
    }
  }

  private async loadConfiguration() {
    try {
      const config = await AsyncStorage.getItem('offlineConfig');
      if (config) {
        this.config = {...this.config, ...JSON.parse(config)};
      }
    } catch (error) {
      console.error('Failed to load offline config:', error);
    }
  }

  private async saveConfiguration() {
    try {
      await AsyncStorage.setItem('offlineConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save offline config:', error);
    }
  }

  private async loadOfflineData() {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        this.offlineData = JSON.parse(data).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private async saveOfflineData() {
    try {
      await AsyncStorage.setItem(
        'offlineData',
        JSON.stringify(this.offlineData),
      );
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  private async setupNetworkListener() {
    this.networkListener = NetInfo.addEventListener(state => {
      const wasOnline = this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isConnected || false;

      if (!wasOnline && this.syncStatus.isOnline) {
        // Just came online, trigger sync
        this.performSync();
      }
    });
  }

  private async startAutoSync() {
    if (!this.config.autoSync) return;

    this.syncInterval = setInterval(async () => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        await this.performSync();
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  // Store data for offline sync
  async storeOfflineData(
    type: OfflineData['type'],
    data: any,
    priority: OfflineData['priority'] = 'normal',
    maxRetries: number = this.config.maxRetries,
  ): Promise<string> {
    if (!this.config.enabled) {
      console.log('Offline storage disabled');
      return '';
    }

    const offlineItem: OfflineData = {
      id: this.generateOfflineId(),
      type,
      data,
      timestamp: new Date(),
      priority,
      retryCount: 0,
      maxRetries,
      isSynced: false,
    };

    this.offlineData.push(offlineItem);
    await this.saveOfflineData();

    // Try immediate sync if online
    if (this.syncStatus.isOnline) {
      await this.syncItem(offlineItem);
    }

    return offlineItem.id;
  }

  // Sync specific item
  private async syncItem(item: OfflineData): Promise<boolean> {
    try {
      const success = await this.sendDataToServer(item);

      if (success) {
        item.isSynced = true;
        this.syncStatus.syncedItems++;
        await this.saveOfflineData();
        return true;
      } else {
        item.retryCount++;
        this.syncStatus.failedItems++;

        if (item.retryCount >= item.maxRetries) {
          // Mark as failed permanently
          console.log(
            `Item ${item.id} failed after ${item.maxRetries} retries`,
          );
        }

        await this.saveOfflineData();
        return false;
      }
    } catch (error) {
      console.error('Failed to sync item:', error);
      item.retryCount++;
      this.syncStatus.failedItems++;
      await this.saveOfflineData();
      return false;
    }
  }

  // Perform full sync
  async performSync(): Promise<void> {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.pendingItems = this.offlineData.filter(
      item => !item.isSynced,
    ).length;

    try {
      // Sort by priority and timestamp
      const pendingItems = this.offlineData
        .filter(item => !item.isSynced)
        .sort((a, b) => {
          const priorityOrder = {critical: 4, high: 3, normal: 2, low: 1};
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          return a.timestamp.getTime() - b.timestamp.getTime();
        });

      for (const item of pendingItems) {
        await this.syncItem(item);

        // Add delay between syncs to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.syncStatus.lastSync = new Date();
      await this.cleanupSyncedData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Mock server communication
  private async sendDataToServer(_item: OfflineData): Promise<boolean> {
    // Mock server communication
    // In real implementation, this would make actual API calls
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        resolve(success);
      }, 1000);
    });
  }

  // Cleanup synced data
  private async cleanupSyncedData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep for 7 days

    this.offlineData = this.offlineData.filter(item => {
      return !item.isSynced || item.timestamp > cutoffDate;
    });

    await this.saveOfflineData();
  }

  // Get offline data by type
  getOfflineDataByType(type: OfflineData['type']): OfflineData[] {
    return this.offlineData.filter(item => item.type === type);
  }

  // Get pending items
  getPendingItems(): OfflineData[] {
    return this.offlineData.filter(item => !item.isSynced);
  }

  // Get failed items
  getFailedItems(): OfflineData[] {
    return this.offlineData.filter(
      item => !item.isSynced && item.retryCount >= item.maxRetries,
    );
  }

  // Retry failed items
  async retryFailedItems(): Promise<void> {
    const failedItems = this.getFailedItems();

    for (const item of failedItems) {
      item.retryCount = 0; // Reset retry count
      item.isSynced = false;
    }

    await this.saveOfflineData();

    if (this.syncStatus.isOnline) {
      await this.performSync();
    }
  }

  // Clear all offline data
  async clearAllOfflineData(): Promise<void> {
    this.offlineData = [];
    await this.saveOfflineData();
  }

  // Get storage usage
  async getStorageUsage(): Promise<{
    used: number;
    available: number;
    percentage: number;
  }> {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      const used = data ? data.length / (1024 * 1024) : 0; // MB
      const available = this.config.maxStorageSize - used;
      const percentage = (used / this.config.maxStorageSize) * 100;

      return {used, available, percentage};
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {used: 0, available: this.config.maxStorageSize, percentage: 0};
    }
  }

  // Check if storage is full
  async isStorageFull(): Promise<boolean> {
    const usage = await this.getStorageUsage();
    return usage.percentage >= 90; // 90% threshold
  }

  // Compress data
  private compressData(data: any): string {
    // Mock compression
    // In real implementation, this would use actual compression
    return JSON.stringify(data);
  }

  // Decompress data
  private decompressData(compressedData: string): any {
    // Mock decompression
    // In real implementation, this would use actual decompression
    return JSON.parse(compressedData);
  }

  // Update configuration
  async updateConfiguration(updates: Partial<OfflineConfig>): Promise<void> {
    this.config = {...this.config, ...updates};
    await this.saveConfiguration();

    // Restart auto sync if interval changed
    if (updates.syncInterval && this.syncInterval) {
      clearInterval(this.syncInterval);
      await this.startAutoSync();
    }
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return {...this.syncStatus};
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (this.syncStatus.isOnline) {
      await this.performSync();
    }
  }

  // Check network status
  async checkNetworkStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.syncStatus.isOnline = state.isConnected || false;
    return this.syncStatus.isOnline;
  }

  // Utility methods
  private generateOfflineId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.networkListener) {
      this.networkListener();
    }
  }

  // Get configuration
  getConfiguration(): OfflineConfig {
    return {...this.config};
  }

  // Get offline data count
  getOfflineDataCount(): number {
    return this.offlineData.length;
  }

  // Get pending count
  getPendingCount(): number {
    return this.offlineData.filter(item => !item.isSynced).length;
  }
}

export const OfflineService = new OfflineServiceClass();
