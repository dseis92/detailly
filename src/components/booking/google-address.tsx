"use client";

import { useEffect, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };
type GooglePlace = {
  formatted_address?: string;
  geometry?: { location?: { lat(): number; lng(): number } };
};
type Autocomplete = {
  addListener(event: "place_changed", handler: () => void): { remove(): void };
  getPlace(): GooglePlace;
};
type MapsApi = {
  Map: new (
    element: HTMLElement,
    options: object
  ) => { setCenter(point: Coordinates): void; setZoom(zoom: number): void };
  Circle: new (options: object) => { setCenter(point: Coordinates): void };
  Geocoder: new () => {
    geocode(options: {
      location: Coordinates;
    }): Promise<{ results: { formatted_address: string }[] }>;
  };
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      options: object
    ) => Autocomplete;
  };
};
type GoogleWindow = Window & {
  google?: { maps: MapsApi };
};
let loading: Promise<MapsApi> | undefined;
function loadMaps(key: string): Promise<MapsApi> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    script.async = true;
    script.onload = () => {
      const maps = (window as GoogleWindow).google?.maps;
      if (!maps) {
        reject(new Error("Maps unavailable"));
        return;
      }
      if (!maps.places?.Autocomplete || !maps.Map || !maps.Geocoder) {
        reject(new Error("Google Places library unavailable"));
        return;
      }
      resolve(maps);
    };
    script.onerror = () => {
      loading = undefined;
      reject(new Error("Maps unavailable"));
    };
    document.head.append(script);
  });
  return loading;
}

export function GoogleAddress({
  onSelect
}: {
  onSelect(address: string): void;
}) {
  const [key, setKey] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef(onSelect);
  const apiRef = useRef<MapsApi>(null);
  const centerRef = useRef<((point: Coordinates) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    void fetch("/api/maps/key", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ key: string | null }>)
      .then(({ key: configuredKey }) => {
        if (!disposed && configuredKey) setKey(configuredKey);
      })
      .catch(() => {
        if (!disposed)
          setError(
            "Google Maps is unavailable. Please enter your address manually."
          );
      });
    return () => {
      disposed = true;
    };
  }, []);
  useEffect(() => {
    if (!key || key.startsWith("replace_")) return;
    let disposed = false;
    let autocomplete: Autocomplete | undefined;
    let placeListener: { remove(): void } | undefined;
    void loadMaps(key)
      .then((api) => {
        if (disposed || !inputRef.current || !mapRef.current) return;
        apiRef.current = api;
        const center = { lat: 44.75, lng: -89.63 };
        const map = new api.Map(mapRef.current, {
          center,
          zoom: 9,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative"
        });
        const marker = new api.Circle({
          map,
          center,
          radius: 35,
          strokeColor: "#ff003b",
          fillColor: "#ff003b",
          fillOpacity: 1,
          strokeWeight: 3
        });
        centerRef.current = (point) => {
          map.setCenter(point);
          map.setZoom(16);
          marker.setCenter(point);
        };
        autocomplete = new api.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["formatted_address", "geometry.location"]
        });
        placeListener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          if (place?.formatted_address)
            selectRef.current(place.formatted_address);
          const location = place?.geometry?.location;
          if (location)
            centerRef.current?.({ lat: location.lat(), lng: location.lng() });
          setError("");
        });
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (!disposed) {
          console.error("Google Maps initialization failed", cause);
          setError(
            "Google Maps is unavailable. Please enter your address manually."
          );
        }
      });
    return () => {
      disposed = true;
      placeListener?.remove();
    };
  }, [key]);
  async function locate() {
    if (!navigator.geolocation) {
      setError(
        "Location is unavailable on this device. Enter your address manually."
      );
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const api = apiRef.current;
        if (!api) {
          setBusy(false);
          return;
        }
        void new api.Geocoder()
          .geocode({ location: point })
          .then(({ results }) => {
            const address = results[0]?.formatted_address;
            if (!address) throw new Error("No address");
            selectRef.current(address);
            centerRef.current?.(point);
          })
          .catch(() =>
            setError(
              "Couldn’t find your street address. Please enter it manually."
            )
          )
          .finally(() => setBusy(false));
      },
      () => {
        setBusy(false);
        setError(
          "Location access is unavailable. Enter your address or allow location access and retry."
        );
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }
  if (!key || key.startsWith("replace_")) return null;
  return (
    <section
      className="google-address"
      aria-label="Find your service address"
      data-google-ready={ready ? "true" : "false"}
    >
      <input
        ref={inputRef}
        className="google-address-autocomplete"
        type="search"
        aria-label="Search service address with Google"
        placeholder="Search address or use your location"
        autoComplete="off"
      />
      {ready && (
        <>
          <button
            type="button"
            className="location-button"
            onClick={() => void locate()}
            disabled={busy}
          >
            {busy ? "Finding your address…" : "⌖ Use my location"}
          </button>
        </>
      )}
      <div
        ref={mapRef}
        className="google-address-map"
        aria-label="Service address map"
        hidden={!ready}
      />
      {ready && (
        <p className="manual-hint">
          Confirm the street number below. You can also enter an address
          manually.
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
