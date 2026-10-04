"use client";

import { useMemo, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type BookingStatus =
  "request_received" | "confirmed" | "cancelled" | "completed";

type Booking = {
  id: string;
  customerId: string;
  reference: string;
  status: BookingStatus;
  startsAt: string;
  serviceEndsAt: string;
  createdAt: string;
  timezone: string;
  address: string;
  customerAddress: string;
  vehicle: string;
  vehicleCategory: string;
  waterAvailable: boolean;
  electricityAvailable: boolean;
  conditionNotes: string;
  accessNotes: string;
  referralSource: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  depositMinor: number;
  currency: string;
  customerName: string;
  email: string;
  phone: string | null;
  services: string[];
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
};

type OwnerPortalProps = {
  ownerName: string;
  bookings: Booking[];
  customers: Customer[];
};

type CustomerView = {
  key: string;
  name: string;
  email: string;
  phone: string | null;
  bookings: Booking[];
  addedAt: string;
};

const statusNames: Record<BookingStatus, string> = {
  request_received: "Needs review",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed"
};

function formatDate(value: string, timezone = "America/Chicago") {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone
  }).format(new Date(value));
}

function formatTime(value: string, timezone = "America/Chicago") {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(value));
}

function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value / 100);
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function OwnerPortal({
  ownerName,
  bookings,
  customers
}: OwnerPortalProps) {
  const [activeTab, setActiveTab] = useState<"bookings" | "customers">(
    "bookings"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all"
  );

  const customerDirectory = useMemo(() => {
    const byEmail = new Map<string, CustomerView>();

    for (const customer of customers) {
      const key = normalize(customer.email);
      const existing = byEmail.get(key);
      const entry: CustomerView = existing
        ? {
            ...existing,
            name: existing.name || customer.name,
            phone: existing.phone || customer.phone,
            addedAt:
              existing.addedAt < customer.createdAt
                ? existing.addedAt
                : customer.createdAt
          }
        : {
            key,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            bookings: [],
            addedAt: customer.createdAt
          };
      byEmail.set(key, entry);
    }

    for (const booking of bookings) {
      const key = normalize(booking.email);
      let entry = byEmail.get(key);
      if (!entry) {
        entry = {
          key,
          name: booking.customerName,
          email: booking.email,
          phone: booking.phone,
          bookings: [],
          addedAt: booking.createdAt
        };
        byEmail.set(key, entry);
      }
      entry.bookings.push(booking);
    }

    return [...byEmail.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings, customers]);

  const filteredBookings = useMemo(() => {
    const term = normalize(search);
    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;
      const haystack = [
        booking.reference,
        booking.customerName,
        booking.email,
        booking.phone ?? "",
        booking.address,
        booking.customerAddress,
        booking.vehicle,
        ...booking.services
      ]
        .join(" ")
        .toLocaleLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [bookings, search, statusFilter]);

  const filteredCustomers = useMemo(() => {
    const term = normalize(search);
    if (!term) return customerDirectory;
    return customerDirectory.filter((customer) =>
      [customer.name, customer.email, customer.phone ?? ""].some((value) =>
        value.toLocaleLowerCase().includes(term)
      )
    );
  }, [customerDirectory, search]);

  const needsReview = bookings.filter(
    (booking) => booking.status === "request_received"
  ).length;
  const confirmedUpcoming = bookings.filter(
    (booking) =>
      booking.status === "confirmed" && new Date(booking.startsAt) >= new Date()
  ).length;
  const requestedValue = bookings
    .filter((booking) => booking.status !== "cancelled")
    .reduce((total, booking) => total + booking.totalMinor, 0);
  const greetingName = ownerName.trim().split(/\s+/)[0] || "there";
  const resultCount =
    activeTab === "bookings"
      ? filteredBookings.length
      : filteredCustomers.length;

  return (
    <main
      className="admin-page owner-portal-page"
      aria-labelledby="owner-title"
    >
      <div className="owner-dashboard">
        <header className="owner-masthead">
          <div className="owner-brand-lockup">
            <span className="owner-brand-mark" aria-hidden="true">
              D
            </span>
            <div>
              <span className="owner-brand-name">DETAILLY</span>
              <span className="owner-brand-caption">OWNER DESK</span>
            </div>
          </div>
          <SignOutButton />
        </header>

        <section className="owner-welcome">
          <div>
            <p className="owner-eyebrow">YOUR BUSINESS, AT A GLANCE</p>
            <h1 id="owner-title">Good to see you, {greetingName}.</h1>
            <p className="owner-welcome-note">
              Keep tabs on your booking requests and customer relationships in
              one place.
            </p>
          </div>
          <div className="owner-date-stamp">
            <span>WAUSAU · WISCONSIN</span>
            <strong>
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "America/Chicago"
              }).format(new Date())}
            </strong>
          </div>
        </section>

        <section className="owner-stat-grid" aria-label="Business overview">
          <article className="owner-stat-card owner-stat-featured">
            <span>Booking requests</span>
            <strong>{bookings.length}</strong>
            <small>All requests on file</small>
          </article>
          <article className="owner-stat-card">
            <span>Needs your review</span>
            <strong>{needsReview}</strong>
            <small>Waiting for follow-up</small>
          </article>
          <article className="owner-stat-card">
            <span>Upcoming details</span>
            <strong>{confirmedUpcoming}</strong>
            <small>Confirmed appointments</small>
          </article>
          <article className="owner-stat-card">
            <span>Customer book</span>
            <strong>{customerDirectory.length}</strong>
            <small>Unique customer emails</small>
          </article>
        </section>

        <section
          className="owner-workspace"
          aria-label="Bookings and customers"
        >
          <div className="owner-workspace-heading">
            <div>
              <p className="owner-eyebrow">YOUR DETAILING BUSINESS</p>
              <h2>Booking & customer desk</h2>
            </div>
            <div className="owner-requested-value">
              <span>Requested service value</span>
              <strong>{formatMoney(requestedValue)}</strong>
            </div>
          </div>

          <div
            className="owner-tabs"
            role="tablist"
            aria-label="Portal sections"
          >
            <button
              id="bookings-tab"
              className={activeTab === "bookings" ? "is-active" : ""}
              role="tab"
              aria-selected={activeTab === "bookings"}
              aria-controls="owner-tab-panel"
              onClick={() => setActiveTab("bookings")}
            >
              Bookings <span>{bookings.length}</span>
            </button>
            <button
              id="customers-tab"
              className={activeTab === "customers" ? "is-active" : ""}
              role="tab"
              aria-selected={activeTab === "customers"}
              aria-controls="owner-tab-panel"
              onClick={() => setActiveTab("customers")}
            >
              Customers <span>{customerDirectory.length}</span>
            </button>
          </div>

          <div className="owner-filter-row">
            <label className="owner-search">
              <span className="sr-only">
                Search {activeTab === "bookings" ? "bookings" : "customers"}
              </span>
              <span aria-hidden="true" className="owner-search-icon">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeTab === "bookings"
                    ? "Search name, service, email, address…"
                    : "Search customer name, email, phone…"
                }
              />
              {search && (
                <button
                  type="button"
                  className="owner-clear-search"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </label>
            {activeTab === "bookings" && (
              <label className="owner-status-filter">
                <span className="sr-only">Filter bookings by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as typeof statusFilter)
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="request_received">Needs review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            )}
            <p className="owner-result-count">
              {resultCount} {resultCount === 1 ? "result" : "results"}
            </p>
          </div>

          <div
            id="owner-tab-panel"
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            className="owner-tab-panel"
          >
            {activeTab === "bookings" ? (
              filteredBookings.length ? (
                <div className="owner-booking-list">
                  {filteredBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={
                    search || statusFilter !== "all"
                      ? "No matching bookings"
                      : "Your booking list is clear"
                  }
                  message={
                    search || statusFilter !== "all"
                      ? "Try changing your search or status filter."
                      : "New booking requests will show up here as soon as a customer schedules a detail."
                  }
                />
              )
            ) : filteredCustomers.length ? (
              <div className="owner-customer-list">
                {filteredCustomers.map((customer) => (
                  <CustomerCard key={customer.key} customer={customer} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={search ? "No matching customers" : "No customers yet"}
                message={
                  search
                    ? "Try searching by a different name, email, or phone number."
                    : "Customer profiles are added when they send a booking request."
                }
              />
            )}
          </div>
        </section>

        <footer className="owner-footer">
          <span>PRIVATE OWNER WORKSPACE</span>
          <span>Customer details are visible only to your owner account.</span>
        </footer>
      </div>
    </main>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <article className="owner-booking-card">
      <div className="owner-booking-main">
        <div className="owner-booking-topline">
          <span className="owner-reference">{booking.reference}</span>
          <span className={`owner-status owner-status-${booking.status}`}>
            <i aria-hidden="true" />
            {statusNames[booking.status]}
          </span>
        </div>
        <div className="owner-booking-title-row">
          <div>
            <h3>{booking.customerName}</h3>
            <p>
              <time dateTime={booking.startsAt}>
                {formatDate(booking.startsAt, booking.timezone)}
              </time>
              <span aria-hidden="true"> · </span>
              {formatTime(booking.startsAt, booking.timezone)}
            </p>
          </div>
          <div className="owner-booking-total">
            <strong>{formatMoney(booking.totalMinor, booking.currency)}</strong>
            <span>request total</span>
          </div>
        </div>
        <div className="owner-booking-details">
          <div>
            <span className="owner-detail-label">SERVICE</span>
            <strong>{booking.services.join(" · ") || "Detail service"}</strong>
            <p>{booking.vehicle}</p>
          </div>
          <div>
            <span className="owner-detail-label">MOBILE SERVICE ADDRESS</span>
            <strong>{booking.address}</strong>
            <p>Customer address: {booking.customerAddress || "Not provided"}</p>
          </div>
          <div className="owner-contact-block">
            <span className="owner-detail-label">CUSTOMER</span>
            <a href={`mailto:${booking.email}`}>{booking.email}</a>
            {booking.phone ? (
              <a href={`tel:${booking.phone}`}>{booking.phone}</a>
            ) : (
              <p>No phone number provided</p>
            )}
          </div>
        </div>
        <details className="owner-more-details">
          <summary>More booking details</summary>
          <div className="owner-extra-grid">
            <p>
              <span>Estimate breakdown</span>
              Subtotal {formatMoney(booking.subtotalMinor, booking.currency)} ·
              tax {formatMoney(booking.taxMinor, booking.currency)} · discount{" "}
              {formatMoney(booking.discountMinor, booking.currency)}
            </p>
            <p>
              <span>Deposit requested</span>
              {formatMoney(booking.depositMinor, booking.currency)}
            </p>
            <p>
              <span>Utilities at service location</span>
              Water {booking.waterAvailable ? "available" : "not available"} ·
              electricity{" "}
              {booking.electricityAvailable ? "available" : "not available"}
            </p>
            <p>
              <span>How they heard about Detailly</span>
              {booking.referralSource || "Not provided"}
            </p>
            <p>
              <span>Vehicle category</span>
              {booking.vehicleCategory.replaceAll("-", " ")}
            </p>
            <p>
              <span>Submitted</span>
              <time dateTime={booking.createdAt}>
                {formatDate(booking.createdAt, booking.timezone)} ·{" "}
                {formatTime(booking.createdAt, booking.timezone)}
              </time>
            </p>
            {booking.conditionNotes && (
              <p>
                <span>Vehicle condition</span>
                {booking.conditionNotes}
              </p>
            )}
            {booking.accessNotes && (
              <p>
                <span>Access notes</span>
                {booking.accessNotes}
              </p>
            )}
          </div>
          {booking.status === "request_received" && (
            <p className="owner-request-note">
              This is a request, not a confirmed appointment. Verify the time
              and address with the customer before confirming.
            </p>
          )}
        </details>
      </div>
      <div className="owner-booking-actions">
        <a
          href={`mailto:${booking.email}?subject=Detailly%20booking%20${booking.reference}`}
        >
          Email customer <span aria-hidden="true">↗</span>
        </a>
        {booking.phone && <a href={`tel:${booking.phone}`}>Call</a>}
      </div>
    </article>
  );
}

function CustomerCard({ customer }: { customer: CustomerView }) {
  const latestBooking = customer.bookings[0];
  const requestedValue = customer.bookings
    .filter((booking) => booking.status !== "cancelled")
    .reduce((sum, booking) => sum + booking.totalMinor, 0);

  return (
    <article className="owner-customer-card">
      <div className="owner-customer-heading">
        <span className="owner-customer-avatar" aria-hidden="true">
          {customer.name.trim().slice(0, 1).toUpperCase() || "?"}
        </span>
        <div>
          <h3>{customer.name}</h3>
          <p>Customer since {formatDate(customer.addedAt)}</p>
        </div>
        <span className="owner-customer-count">
          {customer.bookings.length}{" "}
          {customer.bookings.length === 1 ? "booking" : "bookings"}
        </span>
      </div>
      <div className="owner-customer-contact">
        <a href={`mailto:${customer.email}`}>{customer.email}</a>
        {customer.phone ? (
          <a href={`tel:${customer.phone}`}>{customer.phone}</a>
        ) : (
          <span>Phone not provided</span>
        )}
      </div>
      <div className="owner-customer-summary">
        <div>
          <span>Latest activity</span>
          <strong>
            {latestBooking
              ? formatDate(latestBooking.startsAt, latestBooking.timezone)
              : "No booking requests"}
          </strong>
        </div>
        <div>
          <span>Requested service value</span>
          <strong>{formatMoney(requestedValue)}</strong>
        </div>
      </div>
      {customer.bookings.length > 0 && (
        <details className="owner-customer-history">
          <summary>View booking history</summary>
          <ul>
            {customer.bookings.map((booking) => (
              <li key={booking.id}>
                <span>
                  <strong>{booking.reference}</strong>
                  <small>
                    {booking.services.join(" · ") || "Detail service"} ·{" "}
                    {formatDate(booking.startsAt, booking.timezone)}
                  </small>
                </span>
                <span className={`owner-status owner-status-${booking.status}`}>
                  <i aria-hidden="true" />
                  {statusNames[booking.status]}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="owner-empty-state">
      <span aria-hidden="true">✦</span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
