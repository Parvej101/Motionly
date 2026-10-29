import { MongoClient, type Db } from "mongodb";

export const USERS_COLLECTION = "users";
export const RENDER_JOBS_COLLECTION = "render_jobs";

type MongoGlobal = {
  __motionlyMongoClient?: Promise<MongoClient>;
  __motionlyIndexes?: Promise<void>;
};

const globalForMongo = globalThis as typeof globalThis & MongoGlobal;

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "motionly";

const getClient = () => {
  if (!uri) {
    return null;
  }

  if (!globalForMongo.__motionlyMongoClient) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
    globalForMongo.__motionlyMongoClient = client.connect().catch((error) => {
      globalForMongo.__motionlyMongoClient = undefined;
      throw error;
    });
  }

  return globalForMongo.__motionlyMongoClient;
};

const ensureIndexes = async (db: Db) => {
  if (!globalForMongo.__motionlyIndexes) {
    globalForMongo.__motionlyIndexes = (async () => {
      await Promise.all([
        db.collection(USERS_COLLECTION).createIndex({ email: 1 }, { unique: true }),
        db
          .collection(RENDER_JOBS_COLLECTION)
          .createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }),
      ]);
    })().catch((error) => {
      globalForMongo.__motionlyIndexes = undefined;
      throw error;
    });
  }

  return globalForMongo.__motionlyIndexes;
};

export const isDatabaseConfigured = Boolean(uri);

export const getDb = async (): Promise<Db | null> => {
  const clientPromise = getClient();
  if (!clientPromise) {
    return null;
  }

  const client = await clientPromise;
  const db = client.db(databaseName);
  await ensureIndexes(db);
  return db;
};
