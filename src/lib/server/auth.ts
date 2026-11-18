import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { error, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/env';
import { getRequestEvent } from '$app/server';
import { count, eq, getTableColumns, lt } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { session, user } from '#lib/server/db/schema.ts';
import { TokenBucket } from '#lib/server/rate-limit.ts';
import { getSetting } from '#lib/server/settings.ts';

const DAY = 24 * 60 * 60 * 1000;
/** Sessions expire after 30 days of inactivity */
const SESSION_LIFETIME = 30 * DAY;
/** Active sessions are extended once less than half of their lifetime is left */
const SESSION_RENEW_BEFORE = 15 * DAY;

const SESSION_COOKIE = 'session';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- picked out so it's never selected
const { passwordHash, ...userColumns } = getTableColumns(user);

export type SessionUser = Omit<typeof user.$inferSelect, 'passwordHash'>;

// ─── Passwords ───────────────────────────────────────────────────────────────
// scrypt (memory-hard) with a random per-password salt, stored as `salt:key` in hex

const SCRYPT = { N: 16384, r: 16, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;
/** Longer inputs are rejected before hashing */
export const MAX_PASSWORD_LENGTH = 100;

function deriveKey(password: string, salt: string) {
	return new Promise<Buffer>((resolve, reject) =>
		scrypt(password, salt, KEY_LENGTH, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)))
	);
}

async function hashPassword(password: string) {
	const salt = randomBytes(16).toString('hex');
	return `${salt}:${(await deriveKey(password, salt)).toString('hex')}`;
}

async function verifyPassword(hash: string, password: string) {
	const [salt, key] = hash.split(':');
	if (!salt || !key) return false;
	const expected = Buffer.from(key, 'hex');
	const actual = await deriveKey(password, salt);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Verified against when the email is unknown, so response times don't reveal which accounts exist */
let dummyHash: Promise<string> | undefined;

/**
 * Password hashing is slow on purpose, so sign-in attempts are limited per email address:
 * 5 attempts, then one more per minute (see https://auth.pilcrowonpaper.com/passwords)
 */
const signInAttempts = new TokenBucket(5, 60_000);

// ─── Sessions ────────────────────────────────────────────────────────────────

const hashSecret = (secret: string) => createHash('sha256').update(secret).digest();

/**
 * Creates a session for the user and sets its cookie. The token is `<id>.<secret>`: the id is
 * public (safe to log or show), the secret proves ownership and is only stored as a SHA-256 hash.
 * See https://auth.pilcrowonpaper.com/sessions
 */
export function createSession(cookies: Cookies, userId: string) {
	const id = randomBytes(15).toString('base64url');
	const secret = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_LIFETIME);
	// Sign-ins are rare, so this is a cheap place to drop abandoned sessions
	db.delete(session).where(lt(session.expiresAt, new Date())).run();
	db.insert(session)
		.values({ id, secretHash: hashSecret(secret), userId, expiresAt })
		.run();
	setSessionCookie(cookies, `${id}.${secret}`, expiresAt);
}

/** Populates `locals` from the session cookie, extending the session if it's about to expire */
export function authenticate({ cookies, locals }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return;

	const [id, secret, ...rest] = token.split('.');
	const row =
		id && secret && !rest.length
			? db
					.select({
						secretHash: session.secretHash,
						expiresAt: session.expiresAt,
						user: userColumns
					})
					.from(session)
					.innerJoin(user, eq(session.userId, user.id))
					.where(eq(session.id, id))
					.get()
			: undefined;
	const authentic = row && timingSafeEqual(hashSecret(secret), row.secretHash);
	const now = Date.now();
	const expired = authentic && row.expiresAt.getTime() <= now;

	if (!authentic || expired) {
		// Only the token owner may remove a session – a guessed id alone must not sign anyone out
		if (expired) db.delete(session).where(eq(session.id, id)).run();
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return;
	}
	if (row.expiresAt.getTime() - now < SESSION_RENEW_BEFORE) {
		const expiresAt = new Date(now + SESSION_LIFETIME);
		db.update(session).set({ expiresAt }).where(eq(session.id, id)).run();
		setSessionCookie(cookies, token, expiresAt);
	}
	locals.sessionId = id;
	locals.user = row.user;
}

/** Ends the current request's session and clears its cookie */
export function invalidateSession({ cookies, locals }: RequestEvent) {
	if (locals.sessionId) db.delete(session).where(eq(session.id, locals.sessionId)).run();
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

function setSessionCookie(cookies: Cookies, token: string, expires: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires
	});
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export type Role = SessionUser['role'];

/** Whether any account exists – until then, the first account to register becomes the admin */
export function hasUsers(q: Pick<typeof db, 'select'> = db) {
	const [{ value }] = q.select({ value: count() }).from(user).all();
	return value > 0;
}

/** Sign-up is open for the first account (the admin) and afterwards while an admin allows it */
export const signupOpen = (q: Pick<typeof db, 'select'> = db) =>
	!hasUsers(q) || getSetting('signupEnabled', q);

/**
 * Registers an account. The first account becomes the admin, later ones are users – unless
 * `role` is given (an admin adding an account, which also works while sign-up is closed).
 * Returns the new id, `'closed'` if sign-up is closed or `'taken'` if the email is in use.
 */
export async function createUser({
	name,
	email,
	password,
	role
}: {
	name: string;
	email: string;
	password: string;
	role?: Role;
}) {
	email = email.toLowerCase();
	if (!role && !signupOpen()) return 'closed';
	if (password.length > MAX_PASSWORD_LENGTH) return 'closed';
	const hash = await hashPassword(password);
	// Checked again in the transaction in case another sign-up finished while hashing
	return db.transaction((tx) => {
		const first = !hasUsers(tx);
		if (!role && !first && !getSetting('signupEnabled', tx)) return 'closed' as const;
		if (tx.select({ id: user.id }).from(user).where(eq(user.email, email)).get()) {
			return 'taken' as const;
		}
		return tx
			.insert(user)
			.values({ name, email, passwordHash: hash, role: first ? 'admin' : (role ?? 'user') })
			.returning({ id: user.id })
			.get().id;
	});
}

/** Sets a new password and signs the account out everywhere */
export async function setPassword(userId: string, password: string) {
	const hash = await hashPassword(password);
	db.transaction((tx) => {
		tx.update(user).set({ passwordHash: hash }).where(eq(user.id, userId)).run();
		tx.delete(session).where(eq(session.userId, userId)).run();
	});
}

/** Returns the user id if the credentials are valid, or `'rate-limited'` after too many attempts */
export async function verifyCredentials(email: string, password: string) {
	email = email.toLowerCase();
	if (!signInAttempts.consume(email)) return 'rate-limited';
	if (password.length > MAX_PASSWORD_LENGTH) return null;

	const row = db
		.select({ id: user.id, passwordHash: user.passwordHash })
		.from(user)
		.where(eq(user.email, email))
		.get();
	dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
	const valid = await verifyPassword(row?.passwordHash ?? (await dummyHash), password);
	return row && valid ? row.id : null;
}

export const isAdmin = (user?: Pick<SessionUser, 'role'> | null) => user?.role === 'admin';

/** Throws 401 unless the current request belongs to a signed-in admin */
export function requireAdmin() {
	if (!isAdmin(getRequestEvent().locals.user)) error(401, 'Admin login required');
}
