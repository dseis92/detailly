"use client";
import { useEffect, useRef, useState } from "react";
import type {
  CatalogPackage,
  VehicleCategory
} from "@/modules/catalog-pricing/catalog";
import { GoogleAddress } from "./google-address";
import { ServiceVideo } from "./service-video";
import { BookingGuide } from "./booking-guide";
import { VehicleGraphic as Car } from "./vehicle-graphic";
import type { Quote } from "@/modules/catalog-pricing/quote";

const categories: { id: VehicleCategory; name: string; shape: string }[] = [
  { id: "sedan-coupe", name: "Coupe", shape: "coupe" },
  { id: "sedan-coupe", name: "Sedan", shape: "sedan" },
  { id: "mini-suv-crossover", name: "SUV (5 seats)", shape: "suv" },
  { id: "medium-suv-medium-truck", name: "Truck", shape: "truck" },
  { id: "large-suv-large-truck", name: "SUV (7 seats)", shape: "large" },
  { id: "large-suv-large-truck", name: "Minivan", shape: "minivan" }
];
const titles = [
  "",
  "We Come To You",
  "Select A Package",
  "Select Your Date & Time",
  "Additional Information",
  "Provide Your Info",
  "Confirmation"
];
const progress = [10, 20, 40, 60, 70, 80, 100];
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value / 100
  );
const duration = (minutes: number) =>
  `${Math.floor(minutes / 60)} hour${minutes >= 120 ? "s" : ""}${minutes % 60 ? ` ${minutes % 60} min` : ""}`;
function MapBackdrop() {
  return (
    <div className="map-backdrop" aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <rect width="1000" height="1000" fill="#f5f6f5" />
        <path
          d="M0 0H710L690 90 620 150 570 280 430 350 360 440 210 420 140 320 0 300Z"
          fill="#a6dce6"
        />
        <path
          d="M0 280L90 300 130 800H0ZM300 610L650 600 620 1000H470Z"
          fill="#d3efdd"
        />
        <g fill="none" stroke="#d5dce0" strokeWidth="5">
          <path d="M0 590H1000M0 750H1000M730 0L690 390 710 680 630 1000M520 440V590L530 1000M460 450V590M800 300L940 440 1000 480M800 300L880 270 930 300 1000 270M250 450L260 1000M100 440L160 520 170 1000" />
        </g>
        <g fill="none" stroke="#fff" strokeWidth="3">
          <path d="M0 590H1000M0 750H1000M730 0L690 390 710 680 630 1000" />
        </g>
      </svg>
      <span className="map-pin">●</span>
    </div>
  );
}
export function BookingFlow({
  catalog
}: {
  catalog: readonly CatalogPackage[];
}) {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [vehicleChoice, setVehicleChoice] = useState<string>("sedan");
  const [category, setCategory] = useState<VehicleCategory | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<CatalogPackage | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [timeChoices, setTimeChoices] = useState<string[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const timeRequest = useRef(0);
  const [vehicle, setVehicle] = useState("");
  const [vehicleModal, setVehicleModal] = useState(false);
  const [condition, setCondition] = useState("");
  const [water, setWater] = useState("");
  const [electricity, setElectricity] = useState("");
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [customer, setCustomer] = useState({
    email: "",
    first: "",
    last: "",
    phone: "",
    mailing: "",
    referral: ""
  });
  const [notes, setNotes] = useState("");
  const [menu, setMenu] = useState(false);
  const [basket, setBasket] = useState(false);
  const [payment, setPayment] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const quoteRequest = useRef(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  const photoRef = useRef(photos);
  useEffect(() => {
    photoRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photoRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    []
  );
  useEffect(() => {
    heading.current?.focus();
  }, [step, category]);
  useEffect(() => {
    if (detail || vehicleModal || payment || basket)
      closeButton.current?.focus();
  }, [detail, vehicleModal, payment, basket]);
  const services = catalog.filter((s) => selected.includes(s.id));
  const guideMessage =
    [
      "Hey, I’m Sudsy! Where’s your ride parked? Enter your full address to get started.",
      "We bring the shine to you! Choose our mobile menu and we’ll take it from here.",
      category
        ? "Inside, outside, or the whole works? Tap a package to see what’s included."
        : "Let’s find your ride’s size! Pick the vehicle that looks closest to yours.",
      "Pick your perfect time! We leave 45 minutes after every detail for travel and setup.",
      "Tell me about your ride! Add its condition, photos, and whether water and electricity are available.",
      "Who’s getting the shine? Add your contact details. You can continue as a guest.",
      "One last look! Check your details and 50% deposit. This preview won’t charge or book anything yet."
    ][step] ?? "Let’s get your ride looking its best!";
  const modalGuideMessage = detail
    ? "Here’s what’s included! Take a look, then add this package when you’re ready."
    : vehicleModal
      ? "What do you drive? Add the make and model so we know which ride to pamper."
      : basket
        ? "Here’s your shine lineup! You can remove a package before you keep going."
        : "Secure payments are coming next. This preview doesn’t collect card details or charge you.";
  const categoryLabel = categories.find((c) => c.shape === vehicleChoice)?.name;
  const categoryShape = vehicleChoice;
  const formattedDay = day
    ? new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      })
    : "";
  async function updateQuote(ids: string[]) {
    const requestId = ++quoteRequest.current;
    setSelected(ids);
    setDay("");
    setTime("");
    setQuote(null);
    setError("");
    if (!ids.length) {
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIds: ids })
      });
      if (!response.ok)
        throw new Error("Unable to update your estimate. Please try again.");
      const nextQuote = (await response.json()) as Quote;
      if (requestId === quoteRequest.current) setQuote(nextQuote);
    } catch (e) {
      if (requestId === quoteRequest.current)
        setError(e instanceof Error ? e.message : "Unable to update estimate.");
    } finally {
      if (requestId === quoteRequest.current) setBusy(false);
    }
  }
  async function chooseDay(date: string) {
    const requestId = ++timeRequest.current;
    setDay(date);
    setTime("");
    setTimeChoices([]);
    setTimesLoading(true);
    setError("");
    try {
      const response = await fetch("/api/booking/times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, packageIds: selected })
      });
      if (!response.ok)
        throw new Error("Unable to load appointment times. Please try again.");
      const result = (await response.json()) as { slots: { label: string }[] };
      if (requestId === timeRequest.current)
        setTimeChoices(result.slots.map((slot) => slot.label));
    } catch (e) {
      if (requestId === timeRequest.current)
        setError(e instanceof Error ? e.message : "Unable to load times.");
    } finally {
      if (requestId === timeRequest.current) setTimesLoading(false);
    }
  }
  function advance() {
    setError("");
    if (step === 0 && address.trim().length < 8)
      return setError("Enter the street number and full address.");
    if (step === 2 && !quote) return setError("Choose a service to continue.");
    if (step === 3 && (!day || !time))
      return setError("Select a date and time.");
    if (step === 3 && !vehicle) return setVehicleModal(true);
    if (step === 4 && (!water || !electricity))
      return setError("Please answer both site questions.");
    if (
      step === 4 &&
      (electricity === "No" ||
        (water === "No" && services.some((s) => s.group !== "interior-detail")))
    )
      return setError(
        "This service requires the listed utilities. Please choose a location with access before continuing."
      );
    setStep((s) => Math.min(s + 1, 6));
  }
  function back() {
    setError("");
    if (step === 2 && category) setCategory(null);
    else setStep((s) => Math.max(0, s - 1));
  }
  function closeModal() {
    setDetail(null);
    setVehicleModal(false);
    setPayment(false);
    setBasket(false);
    setError("");
  }
  const currentMonthDays = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const leadingDays = (month.getDay() + 6) % 7;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Chicago"
  });
  const appRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const modalFooterRef = useRef<HTMLElement>(null);
  const modalOpen = !!(detail || vehicleModal || payment || basket);
  useEffect(() => {
    const measure = () => {
      appRef.current?.style.setProperty(
        "--booking-dock-height",
        `${dockRef.current?.offsetHeight ?? 0}px`
      );
      appRef.current?.style.setProperty(
        "--modal-dock-height",
        `${modalFooterRef.current?.offsetHeight ?? 0}px`
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    if (dockRef.current) observer.observe(dockRef.current);
    if (modalFooterRef.current) observer.observe(modalFooterRef.current);
    measure();
    return () => observer.disconnect();
  }, [modalOpen, step]);
  return (
    <main className="booking-app" ref={appRef}>
      <div className="booking-shell" inert={modalOpen}>
        {step === 0 ? (
          <section className="address-screen">
            <MapBackdrop />
            <nav className="address-nav">
              <button
                className="icon-button hamburger"
                aria-label="Open menu"
                onClick={() => setMenu(!menu)}
              >
                ☰
              </button>
              <span className="brand">
                DETAILLY<span>MOBILE DETAILING</span>
              </span>
            </nav>
            <div className="address-entry">
              <h1 ref={heading} tabIndex={-1}>
                Simply Enter Your Address To View Prices Or Book An Appointment
              </h1>
              <GoogleAddress onSelect={setAddress} />
              <p className="manual-hint">
                Choose your address from Google’s suggestions. We serve within
                60 miles of Wausau, Rothschild, Schofield, Stevens Point and
                Plover.
              </p>
            </div>
          </section>
        ) : (
          <>
            <header className="step-header">
              <button className="icon-button" aria-label="Back" onClick={back}>
                ‹
              </button>
              <h1 ref={heading} tabIndex={-1}>
                {titles[step]}
              </h1>
              <span />
            </header>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Booking progress"
              aria-valuenow={progress[step]}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{ width: `${progress[step]}%` }} />
            </div>
            <div
              className="step-content"
              key={`${step}-${category ?? "sizes"}`}
            >
              {step === 1 && (
                <div className="card-grid">
                  <button className="option-card selected" onClick={advance}>
                    <svg
                      viewBox="0 0 80 80"
                      className="mobile-art"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 49V23H48V49M48 32H61L72 45V55H10V49"
                        fill="#f6f7f8"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <circle cx="24" cy="56" r="8" fill="currentColor" />
                      <circle cx="60" cy="56" r="8" fill="currentColor" />
                      <path
                        d="M24 37H39M32 29V45"
                        stroke="var(--accent)"
                        strokeWidth="3"
                      />
                    </svg>
                    <strong>
                      Mobile Detail Menu
                      <br />
                      (We Come To You)
                    </strong>
                  </button>
                </div>
              )}
              {step === 2 && (
                <>
                  <div className="breadcrumbs">
                    <button onClick={() => setCategory(null)}>Services</button>
                    {category && (
                      <>
                        <span>›</span>
                        <span>{categoryLabel}</span>
                      </>
                    )}
                  </div>
                  <div className="card-grid">
                    {!category
                      ? categories.map((c) => (
                          <button
                            key={c.shape}
                            className={`option-card vehicle-card vehicle-card-${c.shape}`}
                            onClick={() => {
                              if (category !== c.id) void updateQuote([]);
                              setVehicleChoice(c.shape);
                              setCategory(c.id);
                            }}
                          >
                            <div className="vehicle-stage">
                              <Car shape={c.shape} />
                            </div>
                            <strong>{c.name}</strong>
                            <span className="vehicle-choose">View Options</span>
                          </button>
                        ))
                      : catalog
                          .filter((s) => s.vehicleCategory === category)
                          .map((s) => (
                            <button
                              key={s.id}
                              className={`option-card service-card ${selected.includes(s.id) ? "selected" : ""}`}
                              onClick={() => {
                                setDetail(s);
                                setExpanded(false);
                              }}
                            >
                              <div className="service-illustration">
                                <ServiceVideo
                                  group={s.group}
                                  active={selected.includes(s.id)}
                                />
                                <span>
                                  {s.group === "interior-detail"
                                    ? "Interior Only"
                                    : s.group === "exterior-detail"
                                      ? "Exterior Only"
                                      : "Full Detail"}
                                </span>
                              </div>
                              <strong>{s.name}</strong>
                              <span>{money(s.promotionalPriceMinor)}</span>
                              <small className="saving">
                                Save {s.discountBasisPoints / 100}%
                              </small>
                              {selected.includes(s.id) && (
                                <span className="selected-check">✓</span>
                              )}
                            </button>
                          ))}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="calendar-card">
                    <div className="calendar-service">
                      <div>
                        <strong>
                          {services.map((s) => s.name).join(" + ")}
                        </strong>
                        <span>
                          {quote && money(quote.totalMinor)} ·{" "}
                          {quote && duration(quote.durationMinutes)}
                        </span>
                      </div>
                      <Car shape={categoryShape} />
                    </div>
                    <div className="month-row">
                      <button
                        aria-label="Previous month"
                        className="icon-button"
                        onClick={() => {
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() - 1,
                              1
                            )
                          );
                        }}
                      >
                        ‹
                      </button>
                      <strong>
                        {month.toLocaleDateString("en-US", {
                          month: "long",
                          year: "2-digit"
                        })}
                      </strong>
                      <button
                        aria-label="Next month"
                        className="icon-button"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() + 1,
                              1
                            )
                          )
                        }
                      >
                        ›
                      </button>
                    </div>
                    <div className="calendar-grid">
                      {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                      {Array.from({ length: leadingDays }, (_, i) => (
                        <span key={`blank${i}`} />
                      ))}
                      {Array.from({ length: currentMonthDays }, (_, i) => {
                        const value = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                        return (
                          <button
                            key={value}
                            disabled={value < today}
                            aria-label={new Date(
                              `${value}T12:00:00`
                            ).toLocaleDateString("en-US", {
                              dateStyle: "full"
                            })}
                            aria-pressed={value === day}
                            className={value === day ? "chosen" : ""}
                            onClick={() => {
                              void chooseDay(value);
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="earliest"
                      onClick={() => {
                        setMonth(
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            1
                          )
                        );
                        void chooseDay(today);
                      }}
                    >
                      ⌕ Earliest
                    </button>
                  </div>
                  <p role="status" className="setup-notice">
                    {timesLoading
                      ? "Loading times…"
                      : day && !timeChoices.length
                        ? "No time windows for this date. Choose another day."
                        : ""}
                  </p>
                  <div className="time-grid">
                    {timeChoices.map((t) => (
                      <button
                        key={t}
                        disabled={!day}
                        aria-pressed={time === t}
                        className={time === t ? "chosen" : ""}
                        onClick={() => setTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="setup-notice">
                    Monday–Sunday · 9am–9pm Central · One crew. Preview times
                    follow your hours and service length; A 45-minute
                    travel/setup buffer follows every service. Existing bookings
                    are not yet connected.
                  </p>
                </>
              )}
              {step === 4 && (
                <div className="questionnaire">
                  <div className="label-row">
                    <strong>Select Vehicle</strong>
                    <button
                      className="text-button"
                      onClick={() => setVehicleModal(true)}
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    className="vehicle-row"
                    onClick={() => setVehicleModal(true)}
                  >
                    <Car shape={categoryShape} />
                    <strong>{vehicle}</strong>
                    <span>✓</span>
                  </button>
                  <label>
                    Please describe the condition of the vehicle
                    <textarea
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      rows={4}
                    />
                  </label>
                  <label className="upload-label">
                    Upload a photo of your car
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (
                          files.length + photos.length > 5 ||
                          files.some(
                            (f) =>
                              f.size > 10485760 ||
                              ![
                                "image/jpeg",
                                "image/png",
                                "image/webp"
                              ].includes(f.type)
                          )
                        ) {
                          setError(
                            "Choose up to 5 JPG, PNG, or WebP photos, each under 10 MB."
                          );
                          return;
                        }
                        setPhotos((old) => [
                          ...old,
                          ...files.map((f) => ({
                            name: f.name,
                            url: URL.createObjectURL(f)
                          }))
                        ]);
                        setError("");
                        e.target.value = "";
                      }}
                    />
                    <span className="upload-box">
                      ♧<small>Add photos</small>
                    </span>
                  </label>
                  {photos.length > 0 && (
                    <div className="photo-list">
                      {photos.map((p, i) => (
                        <div key={p.url}>
                          <img src={p.url} alt={p.name} />
                          <button
                            aria-label={`Remove ${p.name}`}
                            onClick={() => {
                              URL.revokeObjectURL(p.url);
                              setPhotos((old) => old.filter((_, j) => j !== i));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label>
                    Access to water?{" "}
                    <span>
                      Access to water required for exterior and full details!
                    </span>
                    <select
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                    >
                      <option value="">Please select</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </label>
                  <label>
                    Access to electricity?{" "}
                    <span>
                      Access to electricity required for interior and exterior
                      details!
                    </span>
                    <select
                      value={electricity}
                      onChange={(e) => setElectricity(e.target.value)}
                    >
                      <option value="">Please select</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </label>
                </div>
              )}
              {step === 5 && (
                <form
                  className="customer-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customer.referral)
                      return setError("Select how you heard about us.");
                    setError("");
                    setStep(6);
                  }}
                >
                  <label className="sr-only" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                  />
                  <label className="sr-only" htmlFor="first">
                    Your First Name
                  </label>
                  <input
                    id="first"
                    required
                    placeholder="Your First Name"
                    autoComplete="given-name"
                    value={customer.first}
                    onChange={(e) =>
                      setCustomer({ ...customer, first: e.target.value })
                    }
                  />
                  <label className="sr-only" htmlFor="last">
                    Your Last Name
                  </label>
                  <input
                    id="last"
                    required
                    placeholder="Your Last Name"
                    autoComplete="family-name"
                    value={customer.last}
                    onChange={(e) =>
                      setCustomer({ ...customer, last: e.target.value })
                    }
                  />
                  <label>
                    Phone Number
                    <div className="phone-input">
                      <span>🇺🇸 +1</span>
                      <input
                        type="tel"
                        required
                        pattern="[+()0-9 .-]{10,20}"
                        placeholder="(201) 555-0123"
                        autoComplete="tel"
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                      />
                    </div>
                  </label>
                  <label>
                    Mailing Address
                    <input
                      required
                      placeholder="Search address..."
                      autoComplete="street-address"
                      value={customer.mailing || address}
                      onChange={(e) =>
                        setCustomer({ ...customer, mailing: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    How Did You Hear About Us?
                    <select
                      required
                      value={customer.referral}
                      onChange={(e) =>
                        setCustomer({ ...customer, referral: e.target.value })
                      }
                    >
                      <option value="">How Did You Hear About Us?</option>
                      {[
                        "Instagram",
                        "LinkedIn",
                        "Facebook",
                        "Google",
                        "Twitter",
                        "Our Website"
                      ].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <button className="soft-button" type="submit">
                    Continue As Guest
                  </button>
                  <div className="or-rule">
                    <span />
                    or
                    <span />
                  </div>
                  <button
                    type="button"
                    className="soft-button"
                    onClick={() =>
                      setError(
                        "Account sign-in is not configured. Continue as guest to review your booking."
                      )
                    }
                  >
                    Login / Sign up
                  </button>
                </form>
              )}
              {step === 6 && (
                <div className="confirmation">
                  <section className="review-card">
                    <div className="label-row">
                      <h2>Location</h2>
                      <button
                        className="text-button"
                        onClick={() => setStep(0)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="location-row">
                      <p>
                        {address}
                        <small>Mobile service · We come to you</small>
                      </p>
                      <span className="mini-pin">●</span>
                    </div>
                  </section>
                  <section className="review-card">
                    <div className="label-row">
                      <h2>Date & Time</h2>
                      <button
                        className="text-button"
                        onClick={() => setStep(3)}
                      >
                        Edit
                      </button>
                    </div>
                    <p>
                      {time}
                      <small>{formattedDay} · America/Chicago</small>
                      <small>For: {vehicle}</small>
                    </p>
                    <hr />
                    <div className="label-row">
                      <h2>Service</h2>
                      <button
                        className="text-button"
                        onClick={() => setStep(2)}
                      >
                        Edit
                      </button>
                    </div>
                    {services.map((s) => (
                      <div className="review-service" key={s.id}>
                        <p>
                          {s.name}
                          <small>{duration(s.durationMinutes)}</small>
                          <span className="qty">1</span>{" "}
                          {money(s.promotionalPriceMinor)} ea
                        </p>
                        <Car shape={categoryShape} />
                      </div>
                    ))}
                  </section>
                  <section className="review-card">
                    <div className="label-row">
                      <h2>Your Details</h2>
                      <button
                        className="text-button"
                        onClick={() => setStep(5)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="customer-row">
                      <span>{customer.first.slice(0, 1)}</span>
                      <p>
                        {customer.first} {customer.last}
                        <small>{customer.phone}</small>
                        <small>{customer.email}</small>
                      </p>
                    </div>
                    <label className="sr-only" htmlFor="notes">
                      Additional booking notes
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Additional notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <p className="muted">{condition}</p>
                    <p className="muted">
                      Water: {water} · Electricity: {electricity}
                      {photos.length ? ` · ${photos.length} photo(s)` : ""}
                    </p>
                  </section>
                  {quote && (
                    <section className="review-card summary">
                      <h2>Summary</h2>
                      <div>
                        <span>Sub Total</span>
                        <span>{money(quote.subtotalMinor)}</span>
                      </div>
                      <div>
                        <span>+sales tax (5.5%)</span>
                        <span>{money(quote.taxMinor)}</span>
                      </div>
                      <div className="savings-row">
                        <span>You save</span>
                        <span>{money(quote.discountMinor)}</span>
                      </div>
                      <div className="total">
                        <strong>Total</strong>
                        <strong>{money(quote.totalMinor)}</strong>
                      </div>
                      <div>
                        <span>Pre-Payment (Required · 50%)</span>
                        <strong>{money(quote.depositMinor)}</strong>
                      </div>
                      <div>
                        <span>Remaining after service</span>
                        <span>
                          {money(quote.totalMinor - quote.depositMinor)}
                        </span>
                      </div>
                      <button
                        className="soft-button"
                        onClick={() => setPayment(true)}
                      >
                        Add Card
                      </button>
                      <p className="setup-notice">
                        Preview only. Your appointment and payment are not
                        submitted. Live scheduling, service-area verification,
                        private uploads and secure payment must be configured.
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="booking-bottom-dock" ref={dockRef}>
          <BookingGuide
            key={`${step}-${category ?? "sizes"}`}
            message={guideMessage}
          />
          {step !== 5 && (
            <footer
              className={`booking-toolbar ${step === 0 ? "address-toolbar" : ""}`}
            >
              <button
                className="toolbar-summary"
                disabled={step === 0 || step === 1}
                onClick={() =>
                  step === 2
                    ? setBasket(true)
                    : step >= 3 && step < 6
                      ? setStep(3)
                      : undefined
                }
              >
                {step === 0 ? (
                  ""
                ) : step === 1 ? (
                  "Mobile Detail Menu (We Come To You)"
                ) : step === 2 ? (
                  <>
                    <span className="count">{selected.length}</span>
                    {busy
                      ? "Updating…"
                      : quote
                        ? money(quote.totalMinor)
                        : "Choose a service"}
                  </>
                ) : step === 6 ? (
                  `Deposit ${quote ? money(quote.depositMinor) : ""}`
                ) : (
                  <>
                    <span className="calendar-icon">▦</span>
                    <span>
                      {formattedDay || "Select a date"}
                      <small>{time}</small>
                    </span>
                  </>
                )}
              </button>
              <button
                className="primary-button"
                disabled={busy || (step === 2 && !quote)}
                onClick={step === 6 ? () => setPayment(true) : advance}
              >
                {step === 6
                  ? `BOOK NOW · ${quote ? money(quote.depositMinor) : ""}`
                  : "Next"}
              </button>
            </footer>
          )}
        </div>
        {menu && (
          <div className="menu-popover">
            <button
              onClick={() => {
                setStep(0);
                setMenu(false);
              }}
            >
              Book an appointment
            </button>
            <button
              onClick={() => {
                setStep(1);
                setMenu(false);
              }}
            >
              View services
            </button>
            <button onClick={() => setMenu(false)}>Close</button>
          </div>
        )}
      </div>
      {modalOpen && (
        <div
          className="modal-overlay"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeModal();
            if (e.key === "Tab") {
              const nodes = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not([disabled]),input,textarea,select,[tabindex="0"]'
                )
              );
              const first = nodes[0],
                last = nodes[nodes.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }
          }}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <header className="step-header">
              <button
                className="icon-button"
                aria-label="Back to booking"
                onClick={closeModal}
              >
                ‹
              </button>
              <h2 id="modal-title">
                {detail?.name ||
                  (vehicleModal
                    ? "Add Vehicle"
                    : basket
                      ? "Your Services"
                      : "Add Card")}
              </h2>
              <button
                ref={closeButton}
                className="text-button"
                onClick={closeModal}
              >
                Close
              </button>
            </header>
            <div className="modal-content">
              {detail && (
                <>
                  <div className="detail-image">
                    <ServiceVideo group={detail.group} active />
                    <span>
                      {detail.group === "interior-detail"
                        ? "Interior Only"
                        : detail.group === "exterior-detail"
                          ? "Exterior Only"
                          : "Full Detail"}
                    </span>
                  </div>
                  <p>{detail.name} includes:</p>
                  <ul className={`inclusions ${expanded ? "expanded" : ""}`}>
                    {detail.inclusions.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  <button
                    className="text-button"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Show Less" : "Show More"}
                  </button>
                  <div className="package-price">
                    <span>
                      <strong>{money(detail.promotionalPriceMinor)}</strong> ·{" "}
                      {duration(detail.durationMinutes)}
                    </span>
                    <span className="quantity-control">1</span>
                  </div>
                  <p className="saving">
                    Save {detail.discountBasisPoints / 100}% ·{" "}
                    <del>{money(detail.originalPriceMinor)}</del>
                  </p>
                  <p className="muted">{categoryLabel}</p>
                </>
              )}
              {vehicleModal && (
                <form
                  id="vehicle-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setVehicleModal(false);
                    if (step === 3) setStep(4);
                  }}
                >
                  <label>
                    Vehicle Make & Model
                    <input
                      required
                      maxLength={100}
                      placeholder="Ford Bronco"
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                    />
                  </label>
                </form>
              )}
              {basket && (
                <>
                  {services.map((s) => (
                    <div className="basket-row" key={s.id}>
                      <p>
                        {s.name}
                        <small>
                          {categoryLabel} · {duration(s.durationMinutes)}
                        </small>
                      </p>
                      <strong>{money(s.promotionalPriceMinor)}</strong>
                      <button
                        className="text-button"
                        aria-label={`Remove ${s.name}`}
                        onClick={() =>
                          void updateQuote(selected.filter((id) => id !== s.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {quote && (
                    <p>
                      Total including tax:{" "}
                      <strong>{money(quote.totalMinor)}</strong>
                    </p>
                  )}
                </>
              )}
              {payment && (
                <>
                  <h3>Card information</h3>
                  <div className="payment-placeholder">
                    <span aria-hidden="true">▣</span>
                    <p>Secure payment setup required</p>
                    <small>
                      Card information will be collected by the payment
                      provider. No card details are collected in this preview.
                    </small>
                  </div>
                  <p className="setup-notice">
                    The required deposit is {quote && money(quote.depositMinor)}
                    . Booking will open once live availability and payments are
                    connected.
                  </p>
                </>
              )}
            </div>
            <footer className="modal-footer" ref={modalFooterRef}>
              <BookingGuide message={modalGuideMessage} />
              {detail ? (
                <button
                  className="primary-button"
                  onClick={() => {
                    void updateQuote(
                      selected.includes(detail.id)
                        ? selected
                        : selected.concat(detail.id)
                    );
                    setDetail(null);
                  }}
                >
                  Add 1 · {money(detail.promotionalPriceMinor)}
                </button>
              ) : vehicleModal ? (
                <button
                  className="soft-button"
                  form="vehicle-form"
                  type="submit"
                >
                  Save
                </button>
              ) : (
                <button className="soft-button" onClick={closeModal}>
                  {basket ? "Continue" : "Return to booking"}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
