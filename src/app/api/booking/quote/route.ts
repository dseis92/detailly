import { z } from "zod";
import { calculateQuote } from "@/modules/catalog-pricing/quote";
const schema = z.object({ packageIds: z.array(z.string()).min(1).max(12) });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    return Response.json(calculateQuote(input.packageIds), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json(
      { error: "Choose an available service package." },
      { status: 400 }
    );
  }
}
