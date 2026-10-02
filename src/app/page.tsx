const principles = [
  [
    "01",
    "Start with place",
    "Serviceability comes before a customer spends time configuring a visit."
  ],
  [
    "02",
    "Price with clarity",
    "Every choice updates a server-authored estimate with no surprise totals."
  ],
  [
    "03",
    "Protect the moment",
    "Capacity, payment, and confirmation converge safely—even when retries happen."
  ]
] as const;

export default function HomePage() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="nav-shell">
          <a className="wordmark" href="#top" aria-label="Detailly home">
            DETAILLY<span aria-hidden="true">●</span>
          </a>
          <span className="phase-pill">Foundation / 01</span>
        </div>

        <div className="hero-grid" id="top">
          <div className="eyebrow">
            <span aria-hidden="true" />
            Booking infrastructure for mobile detailers
          </div>
          <h1 id="hero-title">
            Care starts
            <br />
            <em>before</em> the keys.
          </h1>
          <p className="hero-copy">
            The operational foundation for an address-first booking
            experience—designed to make every quote, time slot, and payment feel
            certain.
          </p>
          <a className="primary-action" href="#foundation">
            View the foundation
            <span aria-hidden="true">↘</span>
          </a>
          <div className="route-mark" aria-hidden="true">
            <span className="route-line" />
            <span className="route-dot route-dot-start" />
            <span className="route-dot route-dot-end" />
            <span className="route-label">A thoughtful route to booked</span>
          </div>
        </div>
      </section>

      <section
        className="foundation"
        id="foundation"
        aria-labelledby="foundation-title"
      >
        <div className="section-number" aria-hidden="true">
          01—03
        </div>
        <div>
          <p className="kicker">The booking contract</p>
          <h2 id="foundation-title">
            Simple for the customer. Rigorous underneath.
          </h2>
          <div className="principles">
            {principles.map(([number, title, description]) => (
              <article className="principle" key={number}>
                <span className="principle-number" aria-hidden="true">
                  {number}
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
