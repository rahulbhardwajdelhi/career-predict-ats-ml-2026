import { MongoClient, type Collection, type Document } from "mongodb";

let cachedClient: MongoClient | null = null;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }
  return uri;
};

export const getMongoClient = async (): Promise<MongoClient> => {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(getMongoUri());
  await client.connect();
  cachedClient = client;
  return client;
};

export const getCollection = async <T extends Document>(
  collectionName: string
): Promise<Collection<T>> => {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB_NAME || "career_predict";
  return client.db(dbName).collection<T>(collectionName);
};
