export type PlanetId = 'moon' | 'mars';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  options: FieldOption[];
}

export interface PlanetDef {
  id: PlanetId;
  name: string;
  fields: FieldDef[];
}

/** Information field: `value` is shown in the general view, `detail` in the advanced view. */
export interface InfoField {
  label: string;
  value: string;
  detail: string;
  /** Field correlation/similarity level (0-100), for the general view. */
  correlation?: number;
}

export interface BodyInfo {
  kicker: string;
  title: string;
  /** CSS background for the image placeholder (fallback). */
  tone: string;
  /** Real image URL of the location (optional). */
  imageUrl?: string;
  fields: InfoField[];
}

export interface Match {
  id: string;
  percentage: number;
  earth: BodyInfo;
  zone: BodyInfo;
  distanceKm?: number;
  fromUserKm?: number;
  routeKm?: number;
  routeMin?: number;
  placeName?: string;
  humanInterference?: string;
  isolated?: boolean;
}

export interface LocationQuery {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface SearchQuery {
  planet: PlanetId;
  /** field id -> selected value. Empty fields are not sent. */
  earth: Record<string, string>;
  zone: Record<string, string>;
  /** Geographic point on Earth and search radius (km). */
  location?: LocationQuery;
  /** User's current location (for accessibility/route and to avoid immediate sites). */
  userLocation?: UserLocation;
  preferIsolated?: boolean;
  preferAccessible?: boolean;
}
