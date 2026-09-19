import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const isProductionRuntime = process.env.NODE_ENV === "production" && !isProductionBuild;
const configuredMongoUri = process.env.MONGODB_URI;

if (isProductionRuntime && !configuredMongoUri) {
  throw new Error("MONGODB_URI must be configured before starting SAYVA in production.");
}

/**
 * The one authoritative database target for the whole app:
 * host mongodb://localhost:27017/, database `sayva`. Every domain
 * collection (vocabulary_items, grammar_topics, listening_items, ...)
 * lives inside that single database; the database name never merges
 * collections together.
 */
const mongodbUri = configuredMongoUri ?? "mongodb://localhost:27017/sayva";

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
  mongooseConnection?: Promise<typeof mongoose>;
};

/**
 * The native client is used only by Better Auth's official Mongo adapter.
 * SAYVA-owned application data uses the Mongoose connection below.
 */
export const mongoClient =
  globalForMongo.mongoClient ??
  new MongoClient(mongodbUri, {
    serverSelectionTimeoutMS: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = mongoClient;
}

export const mongoDb = mongoClient.db();

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalForMongo.mongooseConnection) {
    globalForMongo.mongooseConnection = mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    return await globalForMongo.mongooseConnection;
  } catch (error) {
    globalForMongo.mongooseConnection = undefined;
    throw error;
  }
}
