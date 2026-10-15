import { Schema, models, model } from "mongoose";

export interface IUploadChunk {
  uploadId: string;
  chunkIndex: number;
  data: Buffer;
  createdAt: Date;
}

const UploadChunkSchema = new Schema<IUploadChunk>({
  uploadId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now, expires: 7200 }, // TTL index: auto-deletes abandoned chunks after 2 hours
});

UploadChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true });

export const UploadChunk =
  models.UploadChunk || model<IUploadChunk>("UploadChunk", UploadChunkSchema);
