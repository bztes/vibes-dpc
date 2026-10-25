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
