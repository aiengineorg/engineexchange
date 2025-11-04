import { createClient } from "redis";

// biome-ignore lint: Forbidden non-null assertion.
const redisUrl = process.env.REDIS_URL!;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

// Create Redis client
const client = createClient({
  url: redisUrl,
});

client.on("error", (err) => console.error("Redis Client Error:", err));

// Connect on module load
let isConnected = false;

export async function getRedisClient() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client;
}

export default client;
