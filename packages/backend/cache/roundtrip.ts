/** 스모크용 — redis 캐시 set→get round-trip. 성공 시 stdout "OK". */
import { createRedisCache } from "./src/index.js";

const host = process.env.REDIS_HOST ?? "localhost";
const port = Number(process.env.REDIS_PORT ?? 6379);
const cache = createRedisCache({ host, port });

await cache.set("smk", { n: 7 }, 30);
const got = await cache.get<{ n: number }>("smk");
await cache.del("smk");
await cache.close();

if (got !== null && got.n === 7) {
  process.stdout.write("OK");
} else {
  process.stderr.write("FAIL: cache miss\n");
  process.exit(1);
}
