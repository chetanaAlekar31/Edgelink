import EmbeddedPostgres from "embedded-postgres";
import { RedisMemoryServer } from "redis-memory-server";

const postgres = new EmbeddedPostgres({
  databaseDir: "./data/pg",
  user: "postgres",
  password: "postgres",
  port: 54329,
  persistent: true,
});

await postgres.initialise();
await postgres.start();
try {
  await postgres.createDatabase("seo_automation");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) throw error;
}

const redis = new RedisMemoryServer({
  instance: { port: 63799, ip: "127.0.0.1" },
});
const host = await redis.getHost();
const port = await redis.getPort();
console.log(`[services] Postgres postgresql://postgres:postgres@127.0.0.1:54329/seo_automation`);
console.log(`[services] Redis redis://${host}:${port}`);

await new Promise(() => {});
