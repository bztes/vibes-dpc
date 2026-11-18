import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { asc, count, eq, gt, isNull } from 'drizzle-orm';
import { command, getRequestEvent, query } from '$app/server';
import { createUser, requireAdmin, setPassword } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { assembly, material, session, user } from '#lib/server/db/schema.ts';
import { getSettings as readSettings, setSetting } from '#lib/server/settings.ts';
import { email, name, newPassword } from '#lib/validation.ts';

export type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'user';
	createdAt: number;
	/** Number of signed-in devices */
	sessions: number;
	/** The signed-in admin */
	self: boolean;
};

/** Every account, oldest first */
export const getUsers = query((): AdminUser[] => {
	requireAdmin();
	const me = getRequestEvent().locals.user!.id;
	const activity = db
		.select({ userId: session.userId, sessions: count().as('sessions') })
		.from(session)
		.where(gt(session.expiresAt, new Date()))
		.groupBy(session.userId)
		.as('activity');
	return db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			sessions: activity.sessions
		})
		.from(user)
		.leftJoin(activity, eq(activity.userId, user.id))
		.orderBy(asc(user.createdAt))
		.all()
		.map((row) => ({
			...row,
			createdAt: row.createdAt.getTime(),
			sessions: row.sessions ?? 0,
			self: row.id === me
		}));
});

/** Counts for the overview page */
export const getStats = query(() => {
	requireAdmin();
	const total = (table: typeof user | typeof material) =>
		db.select({ value: count() }).from(table).get()!.value;
	return {
		users: total(user),
		admins: db.select({ value: count() }).from(user).where(eq(user.role, 'admin')).get()!.value,
		materials: total(material),
		templates: db.select({ value: count() }).from(assembly).where(isNull(assembly.ownerId)).get()!
			.value
	};
});

/** Admins can't change or remove their own account here, so there is always at least one admin */
function requireOther(id: string) {
	requireAdmin();
	if (id === getRequestEvent().locals.user!.id) error(400, 'You can’t change your own account');
	if (!db.select({ id: user.id }).from(user).where(eq(user.id, id)).get()) {
		error(404, 'User not found');
	}
}

const role = v.picklist(['admin', 'user']);

export const addUser = command(
	v.object({ name, email, password: newPassword, role }),
	async (values) => {
		requireAdmin();
		const result = await createUser(values);
		if (result === 'taken') error(400, 'An account with this email already exists');
		if (result === 'closed') error(400, 'The account could not be created');
		void getUsers().refresh();
		void getStats().refresh();
	}
);

export const setUserRole = command(v.object({ id: v.string(), role }), ({ id, role }) => {
	requireOther(id);
	db.update(user).set({ role }).where(eq(user.id, id)).run();
	void getUsers().refresh();
	void getStats().refresh();
});

export const resetUserPassword = command(
	v.object({ id: v.string(), password: newPassword }),
	async ({ id, password }) => {
		requireOther(id);
		await setPassword(id, password);
		void getUsers().refresh();
	}
);

/** Signs the account out on every device */
export const endUserSessions = command(v.string(), (id) => {
	requireOther(id);
	db.delete(session).where(eq(session.userId, id)).run();
	void getUsers().refresh();
});

export const deleteUser = command(v.string(), (id) => {
	requireOther(id);
	db.delete(user).where(eq(user.id, id)).run();
	void getUsers().refresh();
	void getStats().refresh();
});

export const getSettings = query(() => {
	requireAdmin();
	return readSettings();
});

export const setSignupEnabled = command(v.boolean(), (enabled) => {
	requireAdmin();
	setSetting('signupEnabled', enabled);
	void getSettings().refresh();
});
