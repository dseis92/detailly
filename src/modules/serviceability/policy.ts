export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface ServiceAreaRadius {
  readonly center: Coordinates;
  readonly radiusMeters: number;
}

export function isWithinRadius(
  point: Coordinates,
  area: ServiceAreaRadius
): boolean {
  if (area.radiusMeters < 0)
    throw new Error("Service-area radius cannot be negative.");
  return haversineMeters(point, area.center) <= area.radiusMeters;
}

export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const latitudeA = toRadians(a.latitude);
  const latitudeB = toRadians(b.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(value));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
