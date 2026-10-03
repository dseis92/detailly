import { NextResponse } from "next/server";

export function GET() {
  const key = process.env.NEXT_GOOGLE_MAPS_API_KEY;
  if (!key)
    return NextResponse.json(
      { key: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  return NextResponse.json(
    { key },
    { headers: { "Cache-Control": "no-store" } }
  );
}
