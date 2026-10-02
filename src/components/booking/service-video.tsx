"use client";

import { useEffect, useRef } from "react";

export function ServiceVideo({ group }: { group: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const name =
    group === "interior-detail"
      ? "interior"
      : group === "exterior-detail"
        ? "exterior"
        : "full";
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const video = ref.current;
      if (!video) return;
      if (preference.matches) video.pause();
      else void video.play().catch(() => {});
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [name]);
  return (
    <video
      ref={ref}
      className="service-video"
      src={`/services/${name}.mp4`}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
