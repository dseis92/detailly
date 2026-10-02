export const vehicleCategories = [
  "sedan-coupe",
  "mini-suv-crossover",
  "medium-suv-medium-truck",
  "large-suv-large-truck"
] as const;

export type VehicleCategory = (typeof vehicleCategories)[number];
export type ServiceGroupKey =
  "interior-detail" | "exterior-detail" | "full-detail";

export interface CatalogPackage {
  readonly id: string;
  readonly group: ServiceGroupKey;
  readonly vehicleCategory: VehicleCategory;
  readonly name: string;
  readonly originalPriceMinor: number;
  readonly promotionalPriceMinor: number;
  readonly discountBasisPoints: number;
  readonly durationMinutes: number;
  readonly inclusions: readonly string[];
}

const interiorInclusions = [
  "Full Wipe Down",
  "Double Vacuum Interior",
  "Clean all Windows",
  "Clean & Protect Plastic",
  "Upholstery clean and extraction",
  "Leather Treatment",
  "Minor Pet Hair Removal",
  "Minor Carpet Stain Removal",
  "Detail Floor Mats",
  "Detail Trunk",
  "Air Freshener Treatment"
] as const;

const exteriorInclusions = [
  "Professional Hand Wash",
  "Clay Bar Vehicle",
  "Bug and Tar Removal",
  "Detail Rim Faces & Tires",
  "Dress and Shine Tires",
  "Dress All Exterior Plastic",
  "Clean Wheel Wells",
  "Minor Sap Removal",
  "Ceramic Spray Coating — 3 Month Protection (wax)",
  "Touch Up Spot Polish"
] as const;

const fullInclusions = [...exteriorInclusions, ...interiorInclusions] as const;

const matrix: ReadonlyArray<
  readonly [VehicleCategory, number, number, number, number, number, number]
> = [
  ["sedan-coupe", 15_000, 16_667, 120, 12_500, 13_889, 120],
  ["mini-suv-crossover", 17_500, 19_444, 135, 15_000, 16_667, 132],
  ["medium-suv-medium-truck", 20_000, 22_222, 150, 17_500, 19_444, 150],
  ["large-suv-large-truck", 22_500, 25_000, 150, 20_000, 22_222, 150]
];

export const catalogPackages: readonly CatalogPackage[] = matrix.flatMap(
  ([
    vehicleCategory,
    interiorPromo,
    interiorOriginal,
    interiorDuration,
    exteriorPromo,
    exteriorOriginal,
    exteriorDuration
  ]) => [
    {
      id: `interior-${vehicleCategory}`,
      group: "interior-detail" as const,
      vehicleCategory,
      name: "Interior Detail",
      originalPriceMinor: interiorOriginal,
      promotionalPriceMinor: interiorPromo,
      discountBasisPoints: 1_000,
      durationMinutes: interiorDuration,
      inclusions: interiorInclusions
    },
    {
      id: `exterior-${vehicleCategory}`,
      group: "exterior-detail" as const,
      vehicleCategory,
      name: "Exterior Detail",
      originalPriceMinor: exteriorOriginal,
      promotionalPriceMinor: exteriorPromo,
      discountBasisPoints: 1_000,
      durationMinutes: exteriorDuration,
      inclusions: exteriorInclusions
    },
    {
      id: `full-${vehicleCategory}`,
      group: "full-detail" as const,
      vehicleCategory,
      name: "Full Detail Package",
      originalPriceMinor: [33_333, 36_667, 40_000, 43_333][
        vehicleCategories.indexOf(vehicleCategory)
      ]!,
      promotionalPriceMinor: [25_000, 27_500, 30_000, 32_500][
        vehicleCategories.indexOf(vehicleCategory)
      ]!,
      discountBasisPoints: 2_500,
      durationMinutes: [180, 210, 240, 240][
        vehicleCategories.indexOf(vehicleCategory)
      ]!,
      inclusions: fullInclusions
    }
  ]
);

export function getCatalogPackage(id: string): CatalogPackage {
  const selected = catalogPackages.find((candidate) => candidate.id === id);
  if (!selected)
    throw new Error("The selected service package is unavailable.");
  return selected;
}
