# Approved Mobile Service Catalog

Status: Approved business input recorded 2026-10-01. This is the mobile-only catalog baseline for Phase 3. Prices are customer-facing promotional prices before tax; savings are calculated against explicitly stored original prices.

## Booking rules

- Fulfillment: **mobile service only**. There is no shop drop-off option.
- Deposit: **50% of the authoritative total**, required before confirmation.
- Sales tax: **5.5%**, applied server-side to taxable service amounts.
- Discounts: Interior Detail is **10% off**; Full Detail is **25% off**. Store original and promotional prices; calculate savings from those stored values.
- Add-ons: **none in the current catalog**.
- Quantity: each package defaults to `1`; multiple quantities are not offered in the current customer flow.

## Shared inclusions

### Interior Detail

- Full Wipe Down
- Double Vacuum Interior
- Clean all Windows
- Clean & Protect Plastic
- Upholstery clean and extraction
- Leather Treatment
- Minor Pet Hair Removal
- Minor Carpet Stain Removal
- Detail Floor Mats
- Detail Trunk
- Air Freshener Treatment

### Exterior Detail

- Professional Hand Wash
- Clay Bar Vehicle
- Bug and Tar Removal
- Detail Rim Faces & Tires
- Dress and Shine Tires
- Dress All Exterior Plastic
- Clean Wheel Wells
- Minor Sap Removal
- Ceramic Spray Coating — 3 Month Protection (wax)
- Touch Up Spot Polish

### Full Detail

Full Detail combines all Interior and Exterior inclusions. Its upholstery line is **Upholstery/carpet shampoo and extraction**.

## Interior Detail — save 10%

| Vehicle category           | Promotional price | Approximate time |
| -------------------------- | ----------------: | ---------------: |
| Sedan or Coupe             |           $150.00 |          2 hours |
| Mini SUV or Crossover      |           $175.00 |       2.25 hours |
| Medium SUV or Medium Truck |           $200.00 |        2.5 hours |
| Large SUV or Large Truck   |           $225.00 |        2.5 hours |

## Exterior Detail — save 10%

| Vehicle category           | Promotional price | Approximate time |
| -------------------------- | ----------------: | ---------------: |
| Sedan or Coupe             |           $125.00 |          2 hours |
| Mini SUV or Crossover      |           $150.00 |        2.2 hours |
| Medium SUV or Medium Truck |           $175.00 |        2.5 hours |
| Large SUV or Large Truck   |           $200.00 |        2.5 hours |

## Full Detail Package — save 25%

| Vehicle category           | Promotional price | Approximate time |
| -------------------------- | ----------------: | ---------------: |
| Sedan or Coupe             |           $250.00 |          3 hours |
| Mini SUV or Crossover      |           $275.00 |        3.5 hours |
| Medium SUV or Medium Truck |           $300.00 |          4 hours |
| Large SUV or Large Truck   |           $325.00 |          4 hours |

## Implementation notes

- Publish three groups: **Interior Detail**, **Exterior Detail**, and **Full Detail Package**.
- Each group contains four vehicle-specific packages with explicit compatibility rules.
- The UI shows promotional price, savings label, inclusions, duration, and quantity without inventing extras.
- The quote calculator stores original amount, promotional amount, discount amount, tax, deposit, and total as integer minor units.
- The exact cent-rounding policy for reconstructing original prices must be decided before the quote calculator is implemented.
