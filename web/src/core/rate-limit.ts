import 'server-only';
import { db } from './db';

/**
 * Counts an attempt against `key` and says whether it is still within `limit` per `windowSeconds`.
 * One SQL statement, so two requests at once can't both slip past the limit.
 * Moves to Redis when the host provides it; the callers don't change.
 */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; retryAfter: number }> {
  const rows = await db.$queryRaw<{ count: number; window_start: Date }[]>`
    INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE rate_limits.window_start END
    RETURNING count, window_start`;
  const { count, window_start } = rows[0];
  const retryAfter = Math.max(1, Math.ceil(windowSeconds - (Date.now() - window_start.getTime()) / 1000));
  return { ok: count <= limit, retryAfter };
}

/** Clears a counter, e.g. after a successful sign-in. */
export async function clear(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}
