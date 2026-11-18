import * as v from 'valibot';

/** Kept in sync with `MAX_PASSWORD_LENGTH` in `#lib/server/auth.ts` */
const MAX_PASSWORD_LENGTH = 100;

export const name = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Enter a name'),
	v.maxLength(120, 'Use at most 120 characters')
);

export const email = v.pipe(v.string(), v.trim(), v.email('Enter a valid email address'));

export const newPassword = v.pipe(
	v.string(),
	v.regex(/^[\x20-\x7E]*$/, 'Use letters, digits, spaces and common symbols only'),
	v.check((p) => p.trim() === p, 'Remove spaces at the start and end'),
	v.minLength(8, 'Use at least 8 characters'),
	v.maxLength(MAX_PASSWORD_LENGTH, `Use at most ${MAX_PASSWORD_LENGTH} characters`)
);
