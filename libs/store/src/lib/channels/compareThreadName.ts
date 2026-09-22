const threadNameCollator = new Intl.Collator('vi', { sensitivity: 'variant', caseFirst: 'lower', numeric: true });
const NAME_UNIT = /\p{Nd}+|\P{M}\p{M}*|\p{M}+/gu;

function toNameUnits(name?: string | null): string[] {
	const units = (name ?? '').trim().normalize('NFC').match(NAME_UNIT) ?? [];
	return units.filter((unit) => threadNameCollator.compare(unit, '') !== 0);
}

function compareNameUnits(a: string[], b: string[]): number {
	const len = Math.min(a.length, b.length);
	for (let i = 0; i < len; i++) {
		const diff = threadNameCollator.compare(a[i], b[i]);
		if (diff !== 0) return diff;
	}
	return a.length - b.length;
}

export function compareThreadName(nameA?: string | null, nameB?: string | null): number {
	return compareNameUnits(toNameUnits(nameA), toNameUnits(nameB));
}

type NamedThread = { id?: string; channel_id?: string; channel_label?: string };

export function sortThreadsByName<T extends NamedThread>(threads: T[]): T[] {
	return threads
		.map((thread) => ({ thread, units: toNameUnits(thread.channel_label), id: thread.channel_id ?? thread.id ?? '' }))
		.sort((a, b) => compareNameUnits(a.units, b.units) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
		.map(({ thread }) => thread);
}
