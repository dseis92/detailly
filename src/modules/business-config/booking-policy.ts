import centers from "./service-area-centers.json";
import {
  isWithinRadius,
  type Coordinates
} from "@/modules/serviceability/policy";
import type { AvailabilityWindow } from "@/modules/availability/slots";

export const bookingPolicy = {
  timezone: "America/Chicago",
  opensAt: "09:00",
  closesAt: "21:00",
  crewCount: 1,
  slotIntervalMinutes: 15,
  postServiceBufferMinutes: 45,
  radiusMiles: 60,
  radiusMeters: 60 * 1609.344,
  radiusDefinition: "straight-line-from-any-zip-reference-point",
  centers,
  coordinateSource:
    "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_zcta_national.zip"
} as const;

export const operatingWindows: readonly AvailabilityWindow[] = Array.from(
  { length: 7 },
  (_, weekday) => ({
    weekday,
    startLocal: bookingPolicy.opensAt,
    endLocal: bookingPolicy.closesAt,
    timezone: bookingPolicy.timezone,
    slotIntervalMinutes: bookingPolicy.slotIntervalMinutes,
    capacity: bookingPolicy.crewCount
  })
);

/** Requires server-geocoded address coordinates; postal codes alone are not authoritative. */
export function isInBusinessServiceArea(point: Coordinates): boolean {
  if (
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.latitude) > 90 ||
    Math.abs(point.longitude) > 180
  )
    throw new Error("Invalid address coordinates.");
  return bookingPolicy.centers.some((center) =>
    isWithinRadius(point, { center, radiusMeters: bookingPolicy.radiusMeters })
  );
}
