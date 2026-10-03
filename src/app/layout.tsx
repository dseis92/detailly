import type { Metadata, Viewport } from "next";
import "./styles.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content"
};

export const metadata: Metadata = {
  title: {
    default: "Detailly",
    template: "%s · Detailly"
  },
  description: "A considered booking experience for exceptional vehicle care."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
