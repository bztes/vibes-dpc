interface Bucket {
	tokens: number;
	updatedAt: number;
}

/**
 * In-memory token bucket rate limiter. Each key starts with `max` tokens; every attempt consumes
 * one and tokens refill at one per `refillMs`. State lives in this process – move it to the
 * database or Redis when running more than one instance.
 */
export class TokenBucket {
	#buckets = new Map<string, Bucket>();
	#sweptAt = Date.now();

	constructor(
		readonly max: number,
		readonly refillMs: number
	) {}

	/** Takes a token for `key`; returns `false` if none is left */
	consume(key: string) {
		const now = Date.now();
		this.#sweep(now);
		const bucket = this.#buckets.get(key);
		const tokens = bucket ? this.#available(bucket, now) : this.max;
		if (tokens < 1) return false;
		this.#buckets.set(key, { tokens: tokens - 1, updatedAt: now });
		return true;
	}

	#available(bucket: Bucket, now: number) {
		return Math.min(this.max, bucket.tokens + (now - bucket.updatedAt) / this.refillMs);
	}

	/** Now and then, forget buckets that have refilled completely – they equal a fresh one */
	#sweep(now: number) {
		if (now - this.#sweptAt < this.max * this.refillMs) return;
		this.#sweptAt = now;
		for (const [key, bucket] of this.#buckets) {
			if (this.#available(bucket, now) >= this.max) this.#buckets.delete(key);
		}
	}
}
