"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function ServiceVideo({
  group,
  active = false
}: {
  group: string;
  active?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const name =
    group === "interior-detail"
      ? "interior"
      : group === "exterior-detail"
        ? "exterior"
        : "full";
  useEffect(() => {
    const video = ref.current;
    if (!video || !active) return;
    video.muted = true;
    void video.play().catch(() => {});
  }, [name, active]);
  if (!active)
    return (
      <Image
        src={`/services/${name}.jpg`}
        alt=""
        fill
        sizes="(max-width: 606px) 50vw, 280px"
        className="service-video"
      />
    );
  return (
    <video
      ref={ref}
      className="service-video"
      src={`/services/${name}.mp4`}
      poster={`/services/${name}.jpg`}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
