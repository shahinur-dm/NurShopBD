import { Schema, models, model } from "mongoose";

export interface IDownloadUploadSession {
  uploadId: string;
  title: string;
  kind: "catalogue" | "manual";
  filename: string;
  mimeType: string;
  totalSize: number;
  totalChunks: number;
  order?: number;
  editingId?: string;
  createdAt: Date;
}

const DownloadUploadSessionSchema = new Schema<IDownloadUploadSession>({
  uploadId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  kind: { type: String, enum: ["catalogue", "manual"], required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  totalSize: { type: Number, required: true },
  totalChunks: { type: Number, required: true },
  order: { type: Number, default: 0 },
  editingId: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 7200 }, // TTL index: auto-deletes abandoned sessions after 2 hours
});

export const DownloadUploadSession =
  models.DownloadUploadSession ||
  model<IDownloadUploadSession>("DownloadUploadSession", DownloadUploadSessionSchema);
