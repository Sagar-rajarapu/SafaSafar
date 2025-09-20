declare module 'react-native-maps' {
  import {Component} from 'react';
  import {ViewProps} from 'react-native';

  export interface MapViewProps extends ViewProps {
    provider?: 'google' | 'apple';
    region?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    followsUserLocation?: boolean;
  }

  export interface MarkerProps {
    coordinate: {
      latitude: number;
      longitude: number;
    };
    title?: string;
    description?: string;
    pinColor?: string;
    onPress?: () => void;
  }

  export interface CircleProps {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }

  export interface PolylineProps {
    coordinates: Array<{
      latitude: number;
      longitude: number;
    }>;
    strokeColor?: string;
    strokeWidth?: number;
  }

  export const PROVIDER_GOOGLE = 'google';
  export const PROVIDER_APPLE = 'apple';

  export default class MapView extends Component<MapViewProps> {}
  export class Marker extends Component<MarkerProps> {}
  export class Circle extends Component<CircleProps> {}
  export class Polyline extends Component<PolylineProps> {}
}
