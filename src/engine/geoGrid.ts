/**
 * Local SEO Geo-Grid Coordinate Generator
 * 
 * Generates an N x N matrix of equidistant geographic coordinates centered
 * around a target business or latitude/longitude location.
 * Implements geodesic calculations (equirectangular local approximation and
 * spherical distance/bearing formulas) suitable for local SEO tracking radii (0.1km - 50km+).
 */

export type DistanceUnit = 'km' | 'mi';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface GridGeneratorConfig {
  /** Center latitude & longitude (e.g. Google Business Profile address) */
  center: GeoCoordinate;
  /** Grid dimension: odd integer like 3, 5, 7, 9 (e.g. 5 yields a 5x5 grid of 25 nodes) */
  gridSize: number;
  /** Distance step between adjacent pins (e.g. 1.0 km or 0.5 mi) */
  distanceStep: number;
  /** Unit of distance: 'km' (default) or 'mi' */
  unit?: DistanceUnit;
}

export interface GridPoint {
  id: string;
  rowIndex: number; // 0 (North-most) to gridSize - 1 (South-most)
  colIndex: number; // 0 (West-most) to gridSize - 1 (East-most)
  lat: number;
  lng: number;
  offsetNorth: number; // Distance in selected units (positive = North, negative = South)
  offsetEast: number;  // Distance in selected units (positive = East, negative = West)
  distanceFromCenter: number; // True geodesic distance from center
  bearingFromCenterDegrees: number; // 0° = North, 90° = East, 180° = South, 270° = West
  isCenter: boolean;
  unit: DistanceUnit;
}

export interface GridResult {
  center: GeoCoordinate;
  gridSize: number;
  totalPoints: number;
  distanceStep: number;
  unit: DistanceUnit;
  points: GridPoint[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/** Earth's mean radius in kilometers and miles (WGS-84 / IUGG) */
export const EARTH_RADIUS = {
  km: 6371.0088,
  mi: 3958.7613,
} as const;

/** Convert degrees to radians */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Convert radians to degrees */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates the exact great-circle distance between two points using the Haversine formula.
 */
export function haversineDistance(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate,
  unit: DistanceUnit = 'km'
): number {
  const R = EARTH_RADIUS[unit];
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates initial bearing from coord1 to coord2 in degrees (0°..360°).
 */
export function calculateBearing(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = toDegrees(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Generates an N x N coordinate grid for local maps rank tracking.
 * 
 * Grid indexing convention:
 * - Row 0 is the northernmost row; Row (N - 1) is southernmost.
 * - Col 0 is the westernmost column; Col (N - 1) is easternmost.
 * - Center is at rowIndex = (gridSize - 1) / 2, colIndex = (gridSize - 1) / 2.
 */
export function generateGeoGrid(config: GridGeneratorConfig): GridResult {
  const { center, gridSize, distanceStep, unit = 'km' } = config;

  if (gridSize < 1 || !Number.isInteger(gridSize)) {
    throw new Error(`Grid size must be a positive integer, received: ${gridSize}`);
  }
  if (distanceStep <= 0) {
    throw new Error(`Distance step must be greater than 0, received: ${distanceStep}`);
  }
  if (center.lat < -90 || center.lat > 90) {
    throw new Error(`Center latitude out of bounds (-90 to 90): ${center.lat}`);
  }
  if (center.lng < -180 || center.lng > 180) {
    throw new Error(`Center longitude out of bounds (-180 to 180): ${center.lng}`);
  }

  const R = EARTH_RADIUS[unit];
  const centerRow = (gridSize - 1) / 2;
  const centerCol = (gridSize - 1) / 2;

  const points: GridPoint[] = [];
  let maxLat = -Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let minLng = Infinity;

  for (let r = 0; r < gridSize; r++) {
    // Row 0 is North (+), row N-1 is South (-)
    const deltaY = (centerRow - r) * distanceStep;

    // Angular distance North/South in radians
    const deltaLatRad = deltaY / R;
    const pointLat = center.lat + toDegrees(deltaLatRad);

    // Compute latitude in radians for longitude scaling (meridional convergence)
    const avgLatRad = toRadians((center.lat + pointLat) / 2);
    const cosLat = Math.cos(avgLatRad);

    // Guard against polar singularities
    const safeCosLat = Math.abs(cosLat) < 1e-6 ? 1e-6 : cosLat;

    for (let c = 0; c < gridSize; c++) {
      // Col 0 is West (-), col N-1 is East (+)
      const deltaX = (c - centerCol) * distanceStep;

      // Angular distance East/West in radians adjusted for latitude
      const deltaLngRad = deltaX / (R * safeCosLat);
      const pointLng = center.lng + toDegrees(deltaLngRad);

      const pointCoord: GeoCoordinate = {
        lat: Number(pointLat.toFixed(6)),
        lng: Number(pointLng.toFixed(6)),
      };

      const isCenter = r === centerRow && c === centerCol;
      const trueDistance = isCenter ? 0 : haversineDistance(center, pointCoord, unit);
      const bearing = isCenter ? 0 : calculateBearing(center, pointCoord);

      maxLat = Math.max(maxLat, pointCoord.lat);
      minLat = Math.min(minLat, pointCoord.lat);
      maxLng = Math.max(maxLng, pointCoord.lng);
      minLng = Math.min(minLng, pointCoord.lng);

      points.push({
        id: `node_r${r}_c${c}`,
        rowIndex: r,
        colIndex: c,
        lat: pointCoord.lat,
        lng: pointCoord.lng,
        offsetNorth: Number(deltaY.toFixed(4)),
        offsetEast: Number(deltaX.toFixed(4)),
        distanceFromCenter: Number(trueDistance.toFixed(3)),
        bearingFromCenterDegrees: Number(bearing.toFixed(1)),
        isCenter,
        unit,
      });
    }
  }

  return {
    center,
    gridSize,
    totalPoints: points.length,
    distanceStep,
    unit,
    points,
    bounds: {
      north: Number(maxLat.toFixed(6)),
      south: Number(minLat.toFixed(6)),
      east: Number(maxLng.toFixed(6)),
      west: Number(minLng.toFixed(6)),
    },
  };
}
