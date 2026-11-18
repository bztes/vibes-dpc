const formatters = new Map<number, Intl.NumberFormat>();

/** Formats a number with a fixed number of decimals */
export function fmt(value: number, digits = 1): string {
	if (!Number.isFinite(value)) return '–';
	let formatter = formatters.get(digits);
	if (!formatter) {
		formatter = new Intl.NumberFormat('en-GB', {
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		});
		formatters.set(digits, formatter);
	}
	return formatter.format(value);
}

/** sd values with sensible precision */
export function fmtSd(sd: number): string {
	return sd >= 10 ? fmt(sd, 0) : sd >= 1 ? fmt(sd, 1) : fmt(sd, 2);
}

/** Case-insensitive search: the returned test passes if the text contains every word of `query` */
export function searchMatcher(query: string): (text: string) => boolean {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	return (text) => {
		const lower = text.toLowerCase();
		return terms.every((term) => lower.includes(term));
	};
}

const relativeFormat = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

/** "3 days ago", or the date for anything older than a month */
export function relativeTime(time: number, now = Date.now()): string {
	const seconds = Math.round((time - now) / 1000);
	const abs = Math.abs(seconds);
	if (abs < 60) return 'just now';
	if (abs < 3600) return relativeFormat.format(Math.round(seconds / 60), 'minute');
	if (abs < 86_400) return relativeFormat.format(Math.round(seconds / 3600), 'hour');
	if (abs < 30 * 86_400) return relativeFormat.format(Math.round(seconds / 86_400), 'day');
	return dateFormat.format(time);
}

export const formatDate = (time: number) => dateFormat.format(time);
