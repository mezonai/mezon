const CLASS_SYMBOL = 0;
const CLASS_DIGIT = 1;
const CLASS_LOWER = 2;
const CLASS_UPPER = 3;

const VI_ALPHABET = 'a ă â b c d đ e ê f g h i j k l m n o ô ơ p q r s t u ư v w x y z'.split(' ');
const VI_ALPHABET_INDEX = new Map(VI_ALPHABET.map((letter, index) => [letter, index]));

const BREVE = String.fromCharCode(0x0306);
const CIRCUMFLEX = String.fromCharCode(0x0302);
const HORN = String.fromCharCode(0x031b);

const TONE_INDEX: Record<string, number> = {
	[String.fromCharCode(0x0300)]: 1,
	[String.fromCharCode(0x0301)]: 2,
	[String.fromCharCode(0x0309)]: 3,
	[String.fromCharCode(0x0303)]: 4,
	[String.fromCharCode(0x0323)]: 5
};

const COMBINING_MARK = /\p{M}/u;
const DIGIT = /\p{Nd}/u;
const LETTER = /\p{L}/u;

type NameUnit = {
	cls: number;
	key: number | string;
	tone: number;
};

const unitCache = new Map<string, NameUnit[]>();
const MAX_CACHE_SIZE = 2000;

function letterRank(base: string, marks: string): number {
	const lower = base.toLowerCase();
	let letter = lower;
	if (marks.includes(BREVE) && lower === 'a') letter = 'ă';
	else if (marks.includes(CIRCUMFLEX) && (lower === 'a' || lower === 'e' || lower === 'o')) letter = lower + CIRCUMFLEX;
	else if (marks.includes(HORN) && (lower === 'o' || lower === 'u')) letter = lower + HORN;
	const index = VI_ALPHABET_INDEX.get(letter.normalize('NFC'));
	return index ?? VI_ALPHABET.length + (lower.codePointAt(0) ?? 0);
}

function toneOf(marks: string): number {
	for (const mark of marks) {
		const tone = TONE_INDEX[mark];
		if (tone) return tone;
	}
	return 0;
}

function tokenize(name: string): NameUnit[] {
	const cached = unitCache.get(name);
	if (cached) return cached;

	const chars = Array.from(name.normalize('NFD'));
	const units: NameUnit[] = [];
	let i = 0;
	while (i < chars.length) {
		const char = chars[i];

		if (DIGIT.test(char)) {
			let digits = '';
			while (i < chars.length && DIGIT.test(chars[i])) {
				digits += chars[i];
				i++;
			}
			units.push({ cls: CLASS_DIGIT, key: digits.replace(/^0+(?=\d)/, ''), tone: 0 });
			continue;
		}

		let marks = '';
		i++;
		while (i < chars.length && COMBINING_MARK.test(chars[i])) {
			marks += chars[i];
			i++;
		}

		if (LETTER.test(char)) {
			const isUpper = char !== char.toLowerCase();
			units.push({ cls: isUpper ? CLASS_UPPER : CLASS_LOWER, key: letterRank(char, marks), tone: toneOf(marks) });
		} else {
			units.push({ cls: CLASS_SYMBOL, key: char.codePointAt(0) ?? 0, tone: 0 });
		}
	}

	if (unitCache.size >= MAX_CACHE_SIZE) unitCache.clear();
	unitCache.set(name, units);
	return units;
}

function compareKey(a: NameUnit, b: NameUnit): number {
	if (a.cls === CLASS_DIGIT) {
		const aNum = a.key as string;
		const bNum = b.key as string;
		if (aNum.length !== bNum.length) return aNum.length - bNum.length;
		return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
	}
	return (a.key as number) - (b.key as number);
}

export function compareThreadName(nameA = '', nameB = ''): number {
	const a = tokenize(nameA.trim());
	const b = tokenize(nameB.trim());
	const len = Math.min(a.length, b.length);

	for (let i = 0; i < len; i++) {
		if (a[i].cls !== b[i].cls) return a[i].cls - b[i].cls;
		const diff = compareKey(a[i], b[i]);
		if (diff !== 0) return diff;
	}
	if (a.length !== b.length) return a.length - b.length;

	for (let i = 0; i < len; i++) {
		if (a[i].tone !== b[i].tone) return a[i].tone - b[i].tone;
	}
	return 0;
}

type NamedThread = { id?: string; channel_id?: string; channel_label?: string };

export function sortThreadsByName<T extends NamedThread>(threads: T[]): T[] {
	return threads.slice().sort((a, b) => {
		const diff = compareThreadName(a.channel_label, b.channel_label);
		if (diff !== 0) return diff;
		const aId = a.channel_id ?? a.id ?? '';
		const bId = b.channel_id ?? b.id ?? '';
		return aId < bId ? -1 : aId > bId ? 1 : 0;
	});
}
