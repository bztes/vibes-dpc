import * as v from 'valibot';
import { materialCategories } from '#lib/physics/types.ts';

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

export const category = v.picklist(materialCategories);
export const lambda = v.pipe(v.number(), v.minValue(0.001), v.maxValue(500));
export const mu = v.pipe(v.number(), v.minValue(0), v.maxValue(10_000_000));
export const thickness = v.pipe(v.number(), v.gtValue(0), v.maxValue(5000));

/** Details and layers of a template or of a user's build-up */
export const assemblyInput = v.object({
	name,
	description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500)), ''),
	keywords: v.optional(
		v.pipe(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(60))), v.maxLength(30)),
		[]
	),
	layers: v.pipe(
		v.array(
			v.object({
				material: v.optional(v.string()),
				name,
				category,
				lambda,
				mu,
				thickness,
				ventilated: v.optional(v.boolean()),
				disabled: v.optional(v.boolean())
			})
		),
		v.maxLength(100)
	)
});
