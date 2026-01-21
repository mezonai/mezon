export function getMeetCode(url: string) {
	const parts = url.split('/');
	if (parts.length < 4) return null;
	let meetCode = parts[3];
	meetCode = meetCode.split('?')[0].split('/')[0];
	return meetCode;
}
