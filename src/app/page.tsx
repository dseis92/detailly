import { BookingFlow } from "@/components/booking/booking-flow";
import { catalogPackages } from "@/modules/catalog-pricing/catalog";
export default function HomePage() {
  return <BookingFlow catalog={catalogPackages} />;
}
