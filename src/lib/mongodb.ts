import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __nurshop_mongoose_cache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__nurshop_mongoose_cache ?? {
  conn: null,
  promise: null,
};

globalThis.__nurshop_mongoose_cache = cached;

mongoose.set("autoIndex", false);
mongoose.set("bufferCommands", false);

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || !uri.startsWith("mongodb")) {
    console.error("MONGODB_URI environment variable is not defined or invalid.");
    return null;
  }

  let finalUri = uri;
  if (!finalUri.includes("readPreference=")) {
    finalUri += (finalUri.includes("?") ? "&" : "?") + "readPreference=primary";
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 1,
      maxConnecting: 3,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 15_000,
      connectTimeoutMS: 15_000,
      socketTimeoutMS: 45_000,
      heartbeatFrequencyMS: 15_000,
      waitQueueTimeoutMS: 15_000,
      readPreference: "primary" as const,
      autoIndex: false,
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose
      .connect(finalUri, opts)
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        console.error("MongoDB connection error:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch {
    cached.promise = null;
    cached.conn = null;
    return null;
  }
}

