import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DownloadFile, type IDownloadFile } from "@/lib/models";
import { getDownloadStream } from "@/lib/download-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const view = new URL(req.url).searchParams.get("view") === "1";

  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ error: "File unavailable" }, { status: 503 });
  }

  const item = await DownloadFile.findById(id).lean<IDownloadFile | null>();
  if (!item || !item.gridFsId) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const streamInfo = await getDownloadStream(item.gridFsId);
  if (!streamInfo) {
    return NextResponse.json({ error: "File is missing" }, { status: 404 });
  }

  const rawFilename = (item.filename || streamInfo.filename || "document.pdf").replace(/"/g, "");
  const disposition = view ? "inline" : "attachment";
  const contentLength = String(item.size || streamInfo.length);

  return new Response(streamInfo.stream, {
    status: 200,
    headers: {
      "Content-Type": item.mimeType || streamInfo.mimeType || "application/pdf",
      "Content-Length": contentLength,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(rawFilename)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
