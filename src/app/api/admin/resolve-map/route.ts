import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { resolveGoogleMapsUrlAsync } from "@/lib/google-maps";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, address, zoom } = await req.json();
    const result = await resolveGoogleMapsUrlAsync(url || "", address || "", Number(zoom) || 15);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to resolve map URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
