"use client";

import { useEffect, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };
type GooglePlace = {
  formattedAddress?: string;
  location?: { lat(): number; lng(): number };
  fetchFields(options: { fields: string[] }): Promise<unknown>;
};
type PlaceAutocomplete = HTMLElement & {
  placeholder: string;
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
  places: {
    PlaceAutocompleteElement: new () => PlaceAutocomplete;
  };
};
type GoogleWindow = Window & {
  google?: { maps?: GoogleMapsLoader };
};
type GoogleMapsLoader = {
  importLibrary?(name: "maps" | "places"): Promise<unknown>;
  __ib__?: () => void;
};
let loading: Promise<MapsApi> | undefined;
function loadMaps(key: string): Promise<MapsApi> {
  if (loading) return loading;
  const windowWithGoogle = window as GoogleWindow;
  const namespace = (windowWithGoogle.google ??= {});
  const maps = (namespace.maps ??= {});
  if (!maps.importLibrary) {
    const libraries = new Set<string>();
    let scriptLoad: Promise<void> | undefined;
    maps.importLibrary = (name) => {
      libraries.add(name);
      scriptLoad ??= new Promise<void>((resolve, reject) => {
        queueMicrotask(() => {
          const script = document.createElement("script");
          const params = new URLSearchParams({
            key,
            v: "weekly",
            libraries: [...libraries].join(","),
            callback: "google.maps.__ib__"
          });
          script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
          script.async = true;
          maps.__ib__ = resolve;
          script.onerror = () => {
            scriptLoad = undefined;
            reject(new Error("Maps unavailable"));
          };
          script.nonce =
            document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ??
            "";
          document.head.append(script);
        });
      });
      return scriptLoad.then(() => maps.importLibrary?.(name));
    };
  }
  const importLibrary = maps.importLibrary;
  loading = Promise.all([importLibrary("maps"), importLibrary("places")])
    .then(([mapLibrary, placesLibrary]) => {
      const mapTypes = mapLibrary as Pick<
        MapsApi,
        "Map" | "Circle" | "Geocoder"
      >;
      const placeTypes = placesLibrary as MapsApi["places"];
      return { ...mapTypes, places: placeTypes };
    })
    .catch((cause: unknown) => {
      loading = undefined;
      throw cause;
    });
  return loading;
}

export function GoogleAddress({
  onSelect,
  serviceAreaNote
}: {
  onSelect(address: string): void;
  serviceAreaNote: string;
}) {
  const [key, setKey] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
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
    let autocomplete: PlaceAutocomplete | undefined;
    let selectListener: EventListener | undefined;
    void loadMaps(key)
      .then((api) => {
        if (disposed || !autocompleteRef.current || !mapRef.current) return;
        apiRef.current = api;
        const center = { lat: 44.9591, lng: -89.6301 };
        const map = new api.Map(mapRef.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          styles: [
            {
              featureType: "administrative",
              elementType: "geometry.fill",
              stylers: [{ color: "#d6e2e6" }]
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#cfd4d5" }]
            },
            {
              featureType: "administrative",
              elementType: "labels.text.fill",
              stylers: [{ color: "#7492a8" }]
            },
            {
              featureType: "administrative.neighborhood",
              elementType: "labels.text.fill",
              stylers: [{ lightness: 25 }]
            },
            {
              featureType: "landscape.man_made",
              elementType: "geometry.fill",
              stylers: [{ color: "#dde2e3" }]
            },
            {
              featureType: "landscape.man_made",
              elementType: "geometry.stroke",
              stylers: [{ color: "#cfd4d5" }]
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry.fill",
              stylers: [{ color: "#dde2e3" }]
            },
            {
              featureType: "landscape.natural",
              elementType: "labels.text.fill",
              stylers: [{ color: "#7492a8" }]
            },
            {
              featureType: "landscape.natural.terrain",
              elementType: "all",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "poi",
              elementType: "geometry.fill",
              stylers: [{ color: "#dde2e3" }]
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#588ca4" }]
            },
            {
              featureType: "poi",
              elementType: "labels.icon",
              stylers: [{ saturation: -100 }]
            },
            {
              featureType: "poi.park",
              elementType: "geometry.fill",
              stylers: [{ color: "#a9de83" }]
            },
            {
              featureType: "poi.park",
              elementType: "geometry.stroke",
              stylers: [{ color: "#bae6a1" }]
            },
            {
              featureType: "poi.sports_complex",
              elementType: "geometry.fill",
              stylers: [{ color: "#c6e8b3" }]
            },
            {
              featureType: "poi.sports_complex",
              elementType: "geometry.stroke",
              stylers: [{ color: "#bae6a1" }]
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#41626b" }]
            },
            {
              featureType: "road",
              elementType: "labels.icon",
              stylers: [
                { saturation: -45 },
                { lightness: 10 },
                { visibility: "on" }
              ]
            },
            {
              featureType: "road.highway",
              elementType: "geometry.fill",
              stylers: [{ color: "#c1d1d6" }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#a6b5bb" }]
            },
            {
              featureType: "road.highway",
              elementType: "labels.icon",
              stylers: [{ visibility: "on" }]
            },
            {
              featureType: "road.highway.controlled_access",
              elementType: "geometry.fill",
              stylers: [{ color: "#9fb6bd" }]
            },
            {
              featureType: "road.arterial",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "road.local",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "transit",
              elementType: "labels.icon",
              stylers: [{ saturation: -70 }]
            },
            {
              featureType: "transit.line",
              elementType: "geometry.fill",
              stylers: [{ color: "#b4cbd4" }]
            },
            {
              featureType: "transit.line",
              elementType: "labels.text.fill",
              stylers: [{ color: "#588ca4" }]
            },
            {
              featureType: "transit.station",
              elementType: "all",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#008cb5" }, { visibility: "on" }]
            },
            {
              featureType: "transit.station.airport",
              elementType: "geometry.fill",
              stylers: [{ saturation: -100 }, { lightness: -5 }]
            },
            {
              featureType: "water",
              elementType: "geometry.fill",
              stylers: [{ color: "#a6cbe3" }]
            }
          ]
        });
        const marker = new api.Circle({
          map,
          center,
          radius: 180,
          strokeColor: "#ff003b",
          fillColor: "#ff4568",
          fillOpacity: 0.16,
          strokeWeight: 2
        });
        const markerCenter = new api.Circle({
          map,
          center,
          radius: 24,
          strokeColor: "#ffffff",
          fillColor: "#ed3155",
          fillOpacity: 1,
          strokeWeight: 3
        });
        centerRef.current = (point) => {
          map.setCenter(point);
          map.setZoom(16);
          marker.setCenter(point);
          markerCenter.setCenter(point);
        };
        autocomplete = new api.places.PlaceAutocompleteElement();
        autocomplete.placeholder = "Search address or use your location";
        autocomplete.includedRegionCodes = ["us"];
        autocomplete.locationBias = { center, radius: 50000 };
        autocomplete.setAttribute(
          "aria-label",
          "Search service address with Google"
        );
        selectListener = (event) => {
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
        autocomplete.addEventListener("gmp-select", selectListener);
        autocompleteRef.current.replaceChildren(autocomplete);
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
      if (autocomplete && selectListener)
        autocomplete.removeEventListener("gmp-select", selectListener);
      autocomplete?.remove();
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
  if (!key || key.startsWith("replace_")) {
    return (
      <section
        className="google-address"
        aria-label="Find your service address"
      >
        <label className="sr-only" htmlFor="manual-service-address">
          Service address
        </label>
        <input
          id="manual-service-address"
          className="manual-address-input"
          autoComplete="street-address"
          placeholder="Enter your service address"
          onChange={(event) => onSelect(event.target.value)}
        />
        <p className="manual-hint">{serviceAreaNote}</p>
      </section>
    );
  }
  return (
    <section
      className="google-address"
      aria-label="Find your service address"
      data-google-ready={ready ? "true" : "false"}
    >
      <div ref={autocompleteRef} className="google-address-autocomplete" />
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
      {ready && <p className="manual-hint">{serviceAreaNote}</p>}
      <div
        ref={mapRef}
        className="google-address-map"
        aria-label="Service address map"
        hidden={!ready}
      />
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
