import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const globalForMongoose = globalThis as unknown as { mongooseCache?: MongooseCache };

const cached: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cached;

const DEFAULT_MONGODB_URI =
  "mongodb+srv://nextgen:nextgen2026@cluster0.qbunbkx.mongodb.net/NurShopBD?appName=Cluster0";

/**
 * Next.js catalog site: database connection manager.
 * Connects safely with cached instance and handles reconnections if severed.
 */
export async function connectDB() {
  let MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  if (!MONGODB_URI || !MONGODB_URI.startsWith("mongodb")) {
    MONGODB_URI = DEFAULT_MONGODB_URI;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 20,
        minPoolSize: 2,
        maxIdleTimeMS: 120_000,
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 8_000,
        socketTimeoutMS: 20_000,
        family: 4,
        autoIndex: false,
      })
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
    console.error("MongoDB connection failed:", err);
    return null;
  }
}

