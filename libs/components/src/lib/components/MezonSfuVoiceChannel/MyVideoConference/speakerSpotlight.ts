export const SPEAKING_HOLD_MS = 400;

export const isStillSpeaking = (lastLoudAt: number | undefined, now: number, holdMs = SPEAKING_HOLD_MS): boolean =>
	lastLoudAt !== undefined && now - lastLoudAt < holdMs;

export const speakerRecency = (info: { speaking: boolean; recentlySpokeUntil: number } | undefined): number =>
	info?.speaking ? Number.POSITIVE_INFINITY : (info?.recentlySpokeUntil ?? 0);

export const isSwappableTile = (tileId: string, participantId: string | undefined): boolean =>
	participantId !== 'local' && !tileId.endsWith('-screen');

export const pickTileToSwapOut = (visibleTileIds: string[], recentlySpokeUntil: (tileId: string) => number): string | undefined => {
	let chosenTileId: string | undefined;
	let lowestScore = Number.POSITIVE_INFINITY;
	for (const tileId of visibleTileIds) {
		const score = recentlySpokeUntil(tileId);
		if (score <= lowestScore) {
			lowestScore = score;
			chosenTileId = tileId;
		}
	}
	return chosenTileId;
};
