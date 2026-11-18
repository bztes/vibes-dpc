/** Message of an error thrown by a remote function, or `fallback` */
export const errorMessage = (e: unknown, fallback = 'Something went wrong') =>
	(e as { body?: { message?: string } }).body?.message ?? fallback;
