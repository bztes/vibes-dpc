import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenBucket } from './rate-limit.ts';

describe('TokenBucket', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('allows `max` attempts, then one per refill interval', () => {
		const bucket = new TokenBucket(5, 60_000);
		for (let i = 0; i < 5; i++) expect(bucket.consume('a')).toBe(true);
		expect(bucket.consume('a')).toBe(false);

		vi.advanceTimersByTime(30_000);
		expect(bucket.consume('a')).toBe(false);
		vi.advanceTimersByTime(30_000);
		expect(bucket.consume('a')).toBe(true);
		expect(bucket.consume('a')).toBe(false);
	});

	it('tracks keys separately and never refills beyond `max`', () => {
		const bucket = new TokenBucket(2, 1000);
		expect(bucket.consume('a')).toBe(true);
		expect(bucket.consume('b')).toBe(true);

		vi.advanceTimersByTime(60_000);
		expect(bucket.consume('a')).toBe(true);
		expect(bucket.consume('a')).toBe(true);
		expect(bucket.consume('a')).toBe(false);
	});
});
