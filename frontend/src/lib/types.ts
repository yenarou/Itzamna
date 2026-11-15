export type PlanetId = 'luna' | 'marte';

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

/** Campo de información: `value` va en la vista general, `detail` en la avanzada. */
export interface InfoField {
  label: string;
  value: string;
  detail: string;
  /** Nivel de correlación/similitud del campo (0-100), para la vista general. */
  correlation?: number;
}

export interface BodyInfo {
  kicker: string;
  title: string;
  /** Fondo CSS del marcador de imagen (respaldo). */
  tone: string;
  /** URL de imagen real del lugar (opcional). */
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
  /** id de campo -> valor elegido. Los campos vacíos no se envían. */
  earth: Record<string, string>;
  zone: Record<string, string>;
  /** Punto geográfico en la Tierra y radio de búsqueda (km). */
  location?: LocationQuery;
  /** Ubicación actual del usuario (para accesibilidad/ruta y evitar sitios inmediatos). */
  userLocation?: UserLocation;
  preferIsolated?: boolean;
  preferAccessible?: boolean;
}
