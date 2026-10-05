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

const DEFAULT_MONGODB_URI =
  "mongodb+srv://nur:nureng@cluster0.eloiyt1.mongodb.net/NurShopBD?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Next.js database connection manager.
 * Single persistent connection instance reused across all requests.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  if (!MONGODB_URI || !MONGODB_URI.startsWith("mongodb")) {
    MONGODB_URI = DEFAULT_MONGODB_URI;
  }
  if (!MONGODB_URI.includes("readPreference=")) {
    MONGODB_URI += (MONGODB_URI.includes("?") ? "&" : "?") + "readPreference=primary";
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
      .connect(MONGODB_URI, opts)
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB connection error:", err);
    return null;
  }
}

