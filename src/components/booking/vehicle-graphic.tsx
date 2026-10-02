import Image from "next/image";

export function VehicleGraphic({ shape = "sedan" }: { shape?: string }) {
  const vehicle = [
    "coupe",
    "sedan",
    "suv",
    "truck",
    "large",
    "minivan"
  ].includes(shape)
    ? shape
    : "sedan";
  return (
    <Image
      src={`/vehicles/${vehicle}.png`}
      width={180}
      height={135}
      alt=""
      className={`car-art vehicle-photo ${vehicle}`}
    />
  );
}
