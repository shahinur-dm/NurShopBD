import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { DownloadFile, UploadChunk, DownloadUploadSession } from "@/lib/models";
import { getCurrentAdminUser, logActivity } from "@/lib/auth";
import {
  deleteDownloadBuffer,
  isAllowedDownloadFile,
  isPdfMagicBytes,
  storeDownloadFromChunks,
  MAX_DOWNLOAD_FILE_BYTES,
} from "@/lib/download-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serialize(doc: {
  _id: unknown;
  kind?: string;
  title?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    _id: String(doc._id),
    kind: doc.kind,
    title: doc.title,
    filename: doc.filename,
    mimeType: doc.mimeType,
    size: doc.size,
    order: doc.order,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    downloadUrl: `/api/downloads/${String(doc._id)}/file`,
  };
}

export async function POST(req: Request) {
  const admin = await getCurrentAdminUser(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role === "viewer") {
    return NextResponse.json({ error: "Forbidden: Viewer cannot upload" }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  await connectDB();

  // ACTION: INIT
  if (action === "init") {
    try {
      const body = await req.json();
      const { title, kind, filename, mimeType, totalSize, totalChunks, order, editingId } = body;

      if (!title || typeof title !== "string") {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      if (kind !== "catalogue" && kind !== "manual") {
        return NextResponse.json({ error: "Invalid download type" }, { status: 400 });
      }
      if (!filename || typeof filename !== "string") {
        return NextResponse.json({ error: "Filename is required" }, { status: 400 });
      }
      if (!isAllowedDownloadFile({ name: filename, type: mimeType })) {
        return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
      }
      if (!totalSize || typeof totalSize !== "number" || totalSize <= 0) {
        return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
      }
      if (totalSize > MAX_DOWNLOAD_FILE_BYTES) {
        return NextResponse.json(
          { error: `File size exceeds ${(MAX_DOWNLOAD_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB limit. Please upload a smaller file.` },
          { status: 400 }
        );
      }
      if (!totalChunks || typeof totalChunks !== "number" || totalChunks <= 0 || totalChunks > 100) {
        return NextResponse.json({ error: "Invalid chunk count" }, { status: 400 });
      }

      const uploadId = crypto.randomUUID();
      await DownloadUploadSession.create({
        uploadId,
        title: title.trim(),
        kind,
        filename: filename.trim(),
        mimeType: mimeType || "application/pdf",
        totalSize,
        totalChunks,
        order: Number(order) || 0,
        editingId: editingId ? String(editingId) : undefined,
      });

      return NextResponse.json({ success: true, uploadId });
    } catch (err: unknown) {
      console.error("Chunk init error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to initialize upload" },
        { status: 500 }
      );
    }
  }

  // ACTION: CHUNK
  if (action === "chunk") {
    try {
      const formData = await req.formData();
      const uploadId = String(formData.get("uploadId") || "").trim();
      const chunkIndex = Number(formData.get("chunkIndex"));
      const chunk = formData.get("chunk") as File | null;

      if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
      if (isNaN(chunkIndex) || chunkIndex < 0) {
        return NextResponse.json({ error: "Invalid chunkIndex" }, { status: 400 });
      }
      if (!chunk) return NextResponse.json({ error: "Missing chunk data" }, { status: 400 });

      const session = await DownloadUploadSession.findOne({ uploadId });
      if (!session) {
        return NextResponse.json({ error: "Upload session expired or invalid" }, { status: 404 });
      }
      if (chunkIndex >= session.totalChunks) {
        return NextResponse.json({ error: "chunkIndex exceeds totalChunks" }, { status: 400 });
      }

      const buffer = Buffer.from(await chunk.arrayBuffer());

      // Validate actual file magic bytes on the first chunk
      if (chunkIndex === 0 && !isPdfMagicBytes(buffer)) {
        await DownloadUploadSession.deleteOne({ uploadId });
        await UploadChunk.deleteMany({ uploadId });
        return NextResponse.json(
          { error: "Invalid file content: The uploaded file does not have a valid PDF header (%PDF-)." },
          { status: 400 }
        );
      }

      await UploadChunk.findOneAndUpdate(
        { uploadId, chunkIndex },
        { uploadId, chunkIndex, data: buffer },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, chunkIndex });
    } catch (err: unknown) {
      console.error("Chunk upload error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to upload chunk" },
        { status: 500 }
      );
    }
  }

  // ACTION: COMPLETE
  if (action === "complete") {
    try {
      const body = await req.json();
      const uploadId = String(body.uploadId || "").trim();
      if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

      const session = await DownloadUploadSession.findOne({ uploadId });
      if (!session) {
        return NextResponse.json({ error: "Upload session expired or not found" }, { status: 404 });
      }

      const chunks = await UploadChunk.find({ uploadId }).sort({ chunkIndex: 1 }).lean();
      if (chunks.length !== session.totalChunks) {
        return NextResponse.json(
          { error: `Incomplete upload: received ${chunks.length} of ${session.totalChunks} chunks.` },
          { status: 400 }
        );
      }

      const stored = await storeDownloadFromChunks({
        filename: session.filename,
        mimeType: session.mimeType || "application/pdf",
        chunks: chunks.map((c) => ({ chunkIndex: c.chunkIndex, data: c.data })),
      });

      if (!stored) {
        return NextResponse.json({ error: "Failed to store assembled file in GridFS" }, { status: 500 });
      }

      // Cleanup temporary chunks & session
      await UploadChunk.deleteMany({ uploadId });
      await DownloadUploadSession.deleteOne({ uploadId });

      let resultDoc;

      if (session.editingId) {
        const item = await DownloadFile.findById(session.editingId);
        if (!item) {
          return NextResponse.json({ error: "Existing file record not found" }, { status: 404 });
        }

        // Delete old binary from GridFS
        if (item.gridFsId) {
          await deleteDownloadBuffer(item.gridFsId);
        }

        item.title = session.title;
        item.filename = session.filename;
        item.mimeType = session.mimeType;
        item.size = stored.size;
        item.gridFsId = stored.id;
        if (session.order !== undefined) item.order = session.order;

        await item.save();
        resultDoc = item;

        await logActivity({
          action: "DOWNLOAD_UPDATE",
          entity: "DownloadFile",
          entityId: String(item._id),
          details: `Updated ${item.kind} "${item.title}" (size: ${(stored.size / (1024 * 1024)).toFixed(2)} MB via chunked upload)`,
          user: {
            _id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        });
      } else {
        const item = await DownloadFile.create({
          kind: session.kind,
          title: session.title,
          filename: session.filename,
          mimeType: session.mimeType,
          size: stored.size,
          gridFsId: stored.id,
          order: session.order || 0,
        });

        resultDoc = item;

        await logActivity({
          action: "DOWNLOAD_CREATE",
          entity: "DownloadFile",
          entityId: String(item._id),
          details: `Uploaded ${item.kind} "${item.title}" (size: ${(stored.size / (1024 * 1024)).toFixed(2)} MB via chunked upload)`,
          user: {
            _id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        });
      }

      return NextResponse.json({ success: true, item: serialize(resultDoc) });
    } catch (err: unknown) {
      console.error("Chunk complete error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to finalize upload" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action. Expected ?action=init, ?action=chunk, or ?action=complete" }, { status: 400 });
}
