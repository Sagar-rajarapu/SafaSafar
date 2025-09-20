import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DigitalTouristID {
  id: string;
  touristAddress: string;
  kycData: KYCData;
  tripItinerary: TripItinerary;
  emergencyContacts: EmergencyContact[];
  validityPeriod: ValidityPeriod;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
  lastUpdated: Date;
  blockchainTxHash?: string;
}

export interface KYCData {
  aadhaarNumber?: string;
  passportNumber?: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: 'aadhaar' | 'passport';
  documentHash: string;
  verified: boolean;
  verificationDate?: Date;
}

export interface TripItinerary {
  entryPoint: string;
  entryDate: Date;
  exitDate: Date;
  plannedLocations: PlannedLocation[];
  accommodation: AccommodationInfo;
  purpose: string;
  groupSize: number;
}

export interface PlannedLocation {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  plannedVisitDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  isVisited: boolean;
  actualVisitDate?: Date;
}

export interface AccommodationInfo {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contactNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isLocal: boolean;
}

export interface ValidityPeriod {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  autoRenewal: boolean;
}

export interface SmartContractConfig {
  contractAddress: string;
  networkId: number;
  gasLimit: number;
  gasPrice: string;
}

class BlockchainServiceClass {
  private smartContractConfig: SmartContractConfig = {
    contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Mock address
    networkId: 137, // Polygon network
    gasLimit: 500000,
    gasPrice: '20000000000', // 20 gwei
  };

  private currentDigitalID: DigitalTouristID | null = null;

  async initialize() {
    try {
      await this.loadStoredDigitalID();
      console.log('BlockchainService initialized successfully');
    } catch (error) {
      console.error('BlockchainService initialization failed:', error);
    }
  }

  private async loadStoredDigitalID() {
    try {
      const storedID = await AsyncStorage.getItem('digitalTouristID');
      if (storedID) {
        const digitalID = JSON.parse(storedID);
        this.currentDigitalID = {
          ...digitalID,
          createdAt: new Date(digitalID.createdAt),
          lastUpdated: new Date(digitalID.lastUpdated),
          validityPeriod: {
            ...digitalID.validityPeriod,
            startDate: new Date(digitalID.validityPeriod.startDate),
            endDate: new Date(digitalID.validityPeriod.endDate),
          },
          tripItinerary: {
            ...digitalID.tripItinerary,
            entryDate: new Date(digitalID.tripItinerary.entryDate),
            exitDate: new Date(digitalID.tripItinerary.exitDate),
            plannedLocations: digitalID.tripItinerary.plannedLocations.map(
              (loc: any) => ({
                ...loc,
                plannedVisitDate: new Date(loc.plannedVisitDate),
                actualVisitDate: loc.actualVisitDate
                  ? new Date(loc.actualVisitDate)
                  : undefined,
              }),
            ),
            accommodation: {
              ...digitalID.tripItinerary.accommodation,
              checkInDate: new Date(
                digitalID.tripItinerary.accommodation.checkInDate,
              ),
              checkOutDate: new Date(
                digitalID.tripItinerary.accommodation.checkOutDate,
              ),
            },
          },
        };
      }
    } catch (error) {
      console.error('Failed to load stored digital ID:', error);
    }
  }

  async generateDigitalID(
    kycData: KYCData,
    tripItinerary: TripItinerary,
    emergencyContacts: EmergencyContact[],
  ): Promise<DigitalTouristID> {
    try {
      // Verify KYC data
      const isKYCValid = await this.verifyKYCData(kycData);
      if (!isKYCValid) {
        throw new Error('KYC verification failed');
      }

      // Generate unique tourist ID
      const touristID = this.generateTouristID();
      const touristAddress = this.generateTouristAddress();

      // Create validity period (default 30 days)
      const validityPeriod: ValidityPeriod = {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        autoRenewal: false,
      };

      const digitalID: DigitalTouristID = {
        id: touristID,
        touristAddress,
        kycData,
        tripItinerary,
        emergencyContacts,
        validityPeriod,
        status: 'active',
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      // Deploy to blockchain (mock implementation)
      const txHash = await this.deployToBlockchain(digitalID);
      digitalID.blockchainTxHash = txHash;

      this.currentDigitalID = digitalID;
      await this.storeDigitalID(digitalID);

      return digitalID;
    } catch (error) {
      console.error('Failed to generate digital ID:', error);
      throw error;
    }
  }

  private async verifyKYCData(kycData: KYCData): Promise<boolean> {
    // Mock KYC verification - in real implementation, this would call external APIs
    if (kycData.documentType === 'aadhaar') {
      return await this.verifyAadhaar(kycData.aadhaarNumber!, kycData.fullName);
    } else if (kycData.documentType === 'passport') {
      return await this.verifyPassport(
        kycData.passportNumber!,
        kycData.fullName,
      );
    }
    return false;
  }

  private async verifyAadhaar(
    aadhaarNumber: string,
    fullName: string,
  ): Promise<boolean> {
    // Mock Aadhaar verification
    // In real implementation, this would call UIDAI API or similar service
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate verification success for valid Aadhaar format
        const isValidFormat = /^\d{12}$/.test(aadhaarNumber);
        resolve(isValidFormat && fullName.length > 2);
      }, 2000);
    });
  }

  private async verifyPassport(
    passportNumber: string,
    fullName: string,
  ): Promise<boolean> {
    // Mock passport verification
    // In real implementation, this would call passport verification API
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate verification success for valid passport format
        const isValidFormat = /^[A-Z]{1,2}[0-9]{6,7}$/.test(passportNumber);
        resolve(isValidFormat && fullName.length > 2);
      }, 2000);
    });
  }

  private generateTouristID(): string {
    return `TID_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }

  private generateTouristAddress(): string {
    // Generate a mock Ethereum-style address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  private async deployToBlockchain(
    _digitalID: DigitalTouristID,
  ): Promise<string> {
    // Mock blockchain deployment
    // In real implementation, this would interact with actual smart contracts
    return new Promise(resolve => {
      setTimeout(() => {
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        resolve(txHash);
      }, 3000);
    });
  }

  async updateTripItinerary(updates: Partial<TripItinerary>): Promise<void> {
    if (!this.currentDigitalID) {
      throw new Error('No active digital ID found');
    }

    this.currentDigitalID.tripItinerary = {
      ...this.currentDigitalID.tripItinerary,
      ...updates,
    };
    this.currentDigitalID.lastUpdated = new Date();

    await this.storeDigitalID(this.currentDigitalID);
    await this.updateBlockchainRecord(this.currentDigitalID);
  }

  async markLocationVisited(locationId: string): Promise<void> {
    if (!this.currentDigitalID) {
      throw new Error('No active digital ID found');
    }

    const location = this.currentDigitalID.tripItinerary.plannedLocations.find(
      loc => loc.id === locationId,
    );

    if (location) {
      location.isVisited = true;
      location.actualVisitDate = new Date();
      this.currentDigitalID.lastUpdated = new Date();

      await this.storeDigitalID(this.currentDigitalID);
      await this.updateBlockchainRecord(this.currentDigitalID);
    }
  }

  async extendValidityPeriod(days: number): Promise<void> {
    if (!this.currentDigitalID) {
      throw new Error('No active digital ID found');
    }

    this.currentDigitalID.validityPeriod.endDate = new Date(
      this.currentDigitalID.validityPeriod.endDate.getTime() +
        days * 24 * 60 * 60 * 1000,
    );
    this.currentDigitalID.lastUpdated = new Date();

    await this.storeDigitalID(this.currentDigitalID);
    await this.updateBlockchainRecord(this.currentDigitalID);
  }

  async revokeDigitalID(): Promise<void> {
    if (!this.currentDigitalID) {
      throw new Error('No active digital ID found');
    }

    this.currentDigitalID.status = 'revoked';
    this.currentDigitalID.validityPeriod.isActive = false;
    this.currentDigitalID.lastUpdated = new Date();

    await this.storeDigitalID(this.currentDigitalID);
    await this.updateBlockchainRecord(this.currentDigitalID);
  }

  async checkValidityStatus(): Promise<{
    isValid: boolean;
    daysRemaining: number;
    status: string;
  }> {
    if (!this.currentDigitalID) {
      return {isValid: false, daysRemaining: 0, status: 'No ID found'};
    }

    const now = new Date();
    const endDate = this.currentDigitalID.validityPeriod.endDate;
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const isValid =
      this.currentDigitalID.status === 'active' &&
      this.currentDigitalID.validityPeriod.isActive &&
      daysRemaining > 0;

    return {
      isValid,
      daysRemaining: Math.max(0, daysRemaining),
      status: this.currentDigitalID.status,
    };
  }

  getCurrentDigitalID(): DigitalTouristID | null {
    return this.currentDigitalID;
  }

  private async storeDigitalID(digitalID: DigitalTouristID): Promise<void> {
    try {
      await AsyncStorage.setItem('digitalTouristID', JSON.stringify(digitalID));
    } catch (error) {
      console.error('Failed to store digital ID:', error);
      throw error;
    }
  }

  private async updateBlockchainRecord(
    _digitalID: DigitalTouristID,
  ): Promise<string> {
    // Mock blockchain update
    return new Promise(resolve => {
      setTimeout(() => {
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        resolve(txHash);
      }, 2000);
    });
  }

  async getBlockchainTransactionHistory(): Promise<
    Array<{txHash: string; timestamp: Date; type: string}>
  > {
    // Mock transaction history
    return [
      {
        txHash:
          this.currentDigitalID?.blockchainTxHash ||
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: this.currentDigitalID?.createdAt || new Date(),
        type: 'ID_CREATION',
      },
    ];
  }
}

export const BlockchainService = new BlockchainServiceClass();
