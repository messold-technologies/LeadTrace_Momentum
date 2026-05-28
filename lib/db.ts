import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: mongoose.Mongoose | null | undefined;
  // eslint-disable-next-line no-var
  var __mongoosePromise: Promise<mongoose.Mongoose> | null | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Add it to .env.local (do not commit secrets).",
    );
  }
  return uri;
}

export async function connectDb() {
  if (globalThis.__mongooseConn) return globalThis.__mongooseConn;
  if (!globalThis.__mongoosePromise) {
    globalThis.__mongoosePromise = mongoose.connect(getMongoUri(), {
      dbName: process.env.MONGODB_DB_NAME || "leadtrace",
    });
  }
  globalThis.__mongooseConn = await globalThis.__mongoosePromise;
  return globalThis.__mongooseConn;
}

