type Parts = (string | false | undefined)[];

export function buildStyle(...parts: Parts) {
	return parts.filter(Boolean).join(';');
}
