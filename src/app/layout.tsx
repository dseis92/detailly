import type { Metadata } from "next";
import "./styles.css";

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
