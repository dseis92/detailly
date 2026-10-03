"use client";

import { useEffect, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };
type GooglePlace = {
  formattedAddress?: string;
  location?: { lat(): number; lng(): number };
  fetchFields(options: { fields: string[] }): Promise<unknown>;
};
type Autocomplete = HTMLElement & {
  includedRegionCodes: string[];
  locationBias: { center: Coordinates; radius: number };
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
  places: { PlaceAutocompleteElement: new () => Autocomplete };
};
type GoogleWindow = Window & {
  google?: {
    maps: {
      importLibrary(name: "maps" | "places"): Promise<unknown>;
    };
  };
};
let loading: Promise<MapsApi> | undefined;
function loadMaps(key: string): Promise<MapsApi> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.onload = () => {
      const maps = (window as GoogleWindow).google?.maps;
      if (!maps) {
        reject(new Error("Maps unavailable"));
        return;
      }
      void Promise.all([
        maps.importLibrary("maps"),
        maps.importLibrary("places")
      ])
        .then(([mapLibrary, placesLibrary]) => {
          const mapTypes = mapLibrary as Pick<
            MapsApi,
            "Map" | "Circle" | "Geocoder"
          >;
          const placeTypes = placesLibrary as MapsApi["places"];
          resolve({ ...mapTypes, places: placeTypes });
        })
        .catch(reject);
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
  const widgetRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
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
    let widget: Autocomplete | undefined;
    let select: EventListener | undefined;
    void loadMaps(key)
      .then((api) => {
        if (disposed || !widgetRef.current || !mapRef.current) return;
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
        widget = new api.places.PlaceAutocompleteElement();
        widget.includedRegionCodes = ["us"];
        widget.locationBias = { center, radius: 50000 };
        widget.setAttribute("aria-label", "Search service address with Google");
        select = (event) => {
          const prediction = (
            event as Event & { placePrediction: { toPlace(): GooglePlace } }
          ).placePrediction;
          const place = prediction.toPlace();
          void place
            .fetchFields({ fields: ["formattedAddress", "location"] })
            .then(() => {
              if (disposed) return;
              if (place.formattedAddress)
                selectRef.current(place.formattedAddress);
              if (place.location)
                centerRef.current?.({
                  lat: place.location.lat(),
                  lng: place.location.lng()
                });
              setError("");
            })
            .catch(() => {
              if (!disposed)
                setError(
                  "Couldn’t load that address. Please enter it manually."
                );
            });
        };
        widget.addEventListener("gmp-select", select);
        widget.addEventListener("gmp-error", () =>
          setError(
            "Address search is unavailable. Please enter your address manually."
          )
        );
        widgetRef.current.replaceChildren(widget);
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
      if (widget && select) widget.removeEventListener("gmp-select", select);
      widget?.remove();
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
    <section className="google-address" aria-label="Find your service address">
      <div ref={widgetRef} />
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
