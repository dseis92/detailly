"use client";

import Link from "next/link";
import { useState } from "react";
import { operatingWindows } from "@/modules/business-config/booking-policy";

type Slot = { startsAt: string; endsAt: string; timezone: string };

const previewWindows = operatingWindows;

export default function AvailabilityPage() {
  const [date, setDate] = useState(nextWeekday());
  const [duration, setDuration] = useState("120");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [status, setStatus] = useState(
    "Choose a day to preview available windows."
  );
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    setStatus("Checking the latest availability…");
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const response = await fetch("/api/availability/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        durationMinutes: Number(duration),
        windows: previewWindows
      })
    });
    const payload = (await response.json()) as {
      slots?: Slot[];
      error?: string;
    };
    setLoading(false);
    if (!response.ok || !payload.slots) {
      setSlots([]);
      setStatus(payload.error ?? "Availability could not be loaded.");
      return;
    }
    setSlots(payload.slots);
    setStatus(
      payload.slots.length
        ? `${payload.slots.length} windows available. Times shown in Central Time.`
        : "No windows are available for that day."
    );
  }

  return (
    <main className="availability-page" aria-labelledby="availability-title">
      <header className="services-header">
        <Link className="wordmark" href="/" aria-label="Detailly home">
          DETAILLY<span aria-hidden="true">●</span>
        </Link>
        <Link className="text-link" href="/services">
          View services
        </Link>
      </header>
      <section className="availability-intro">
        <p className="kicker">Find a time</p>
        <h1 id="availability-title">Bring the detail to your driveway.</h1>
        <p>
          Pick a day and service length to preview the mobile appointment
          windows.
        </p>
        <p className="preview-note" role="note">
          Monday–Sunday · 9am–9pm Central · One crew. Includes 45 minutes after
          each service for travel/setup. Existing bookings are not connected in
          this preview.
        </p>
      </section>
      <section className="availability-panel" aria-label="Availability search">
        <div className="availability-fields">
          <label>
            Day
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            Service length
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            >
              <option value="120">2 hours</option>
              <option value="135">2 hours 15 minutes</option>
              <option value="150">2 hours 30 minutes</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
            </select>
          </label>
          <button
            className="service-select availability-submit"
            type="button"
            onClick={search}
            disabled={loading}
          >
            {loading ? "Checking…" : "Show times"}{" "}
            <span aria-hidden="true">↘</span>
          </button>
        </div>
        <p className="availability-status" role="status" aria-live="polite">
          {status}
        </p>
        {slots.length > 0 && (
          <div className="slot-grid" aria-label="Available appointment times">
            {slots.map((slot) => (
              <button className="slot-card" type="button" key={slot.startsAt}>
                <strong>{formatTime(slot.startsAt, slot.timezone)}</strong>
                <span>Hold this window</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function nextWeekday(): string {
  const date = new Date();
  date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 1));
  return date.toISOString().slice(0, 10);
}

function formatTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
