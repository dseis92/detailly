import Link from "next/link";
import {
  catalogPackages,
  type ServiceGroupKey,
  type VehicleCategory
} from "@/modules/catalog-pricing/catalog";

const groupLabels: Record<ServiceGroupKey, string> = {
  "interior-detail": "Interior Detail",
  "exterior-detail": "Exterior Detail",
  "full-detail": "Full Detail Package"
};

const categoryLabels: Record<VehicleCategory, string> = {
  "sedan-coupe": "Sedan or Coupe",
  "mini-suv-crossover": "Mini SUV or Crossover",
  "medium-suv-medium-truck": "Medium SUV or Medium Truck",
  "large-suv-large-truck": "Large SUV or Large Truck"
};

const groupOrder: ServiceGroupKey[] = [
  "interior-detail",
  "exterior-detail",
  "full-detail"
];

export default function ServicesPage() {
  return (
    <main className="services-page" aria-labelledby="services-title">
      <header className="services-header">
        <Link className="wordmark" href="/" aria-label="Detailly home">
          DETAILLY<span aria-hidden="true">●</span>
        </Link>
        <span className="phase-pill">Mobile service</span>
      </header>
      <section className="services-intro">
        <p className="kicker">The approved menu</p>
        <h1 id="services-title">Good care, clearly priced.</h1>
        <p>
          Choose a package by vehicle size. Every service comes to you, with a
          50% deposit required at booking.
        </p>
        <div className="catalog-note" role="note">
          Prices shown before 5.5% sales tax · No add-ons currently offered
        </div>
      </section>
      <div className="service-groups">
        {groupOrder.map((group) => (
          <section
            className="service-group"
            key={group}
            aria-labelledby={`${group}-title`}
          >
            <div className="service-group-heading">
              <span className="section-number" aria-hidden="true">
                0{groupOrder.indexOf(group) + 1}
              </span>
              <h2 id={`${group}-title`}>{groupLabels[group]}</h2>
              <span className="discount-chip">
                Save {group === "full-detail" ? "25" : "10"}%
              </span>
            </div>
            <div className="service-cards">
              {catalogPackages
                .filter((item) => item.group === group)
                .map((item) => (
                  <article className="service-card" key={item.id}>
                    <div className="service-card-top">
                      <p className="service-category">
                        {categoryLabels[item.vehicleCategory]}
                      </p>
                      <p className="service-duration">
                        {formatDuration(item.durationMinutes)}
                      </p>
                    </div>
                    <div className="service-price">
                      <span>${formatMoney(item.promotionalPriceMinor)}</span>
                      <del>${formatMoney(item.originalPriceMinor)}</del>
                    </div>
                    <details>
                      <summary>View what&apos;s included</summary>
                      <ul>
                        {item.inclusions.map((inclusion) => (
                          <li key={inclusion}>{inclusion}</li>
                        ))}
                      </ul>
                    </details>
                    <button className="service-select" type="button">
                      Choose this package <span aria-hidden="true">↘</span>
                    </button>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function formatMoney(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hours` : `${hours}h ${remainder}m`;
}
