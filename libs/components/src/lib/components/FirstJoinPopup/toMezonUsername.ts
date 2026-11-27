export const toMezonUsername = (name: string): string =>
	name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/đ/g, 'd')
		.replace(/[^a-z0-9._\-+]/g, '')
		.slice(0, 32);
