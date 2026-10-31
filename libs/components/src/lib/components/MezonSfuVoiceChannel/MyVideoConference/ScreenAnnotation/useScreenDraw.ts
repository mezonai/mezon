import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { supportsScreenAnnotation } from './ScreenAnnotationCompositor';
import { ScreenDrawSession } from './ScreenDrawSession';

export type ScreenDrawMode = 'broadcast';

interface UseScreenDrawOptions {
	screenTileIds: string[];
	localScreenTileId?: string;
	focusTile: (tileId: string) => void;
	startBroadcast: (session: ScreenDrawSession) => Promise<boolean>;
	stopBroadcast: () => Promise<void>;
}

const noopUnsubscribe = () => undefined;

export const useScreenDraw = ({ screenTileIds, localScreenTileId, focusTile, startBroadcast, stopBroadcast }: UseScreenDrawOptions) => {
	const [session, setSession] = useState<ScreenDrawSession | null>(null);
	const subscribe = useCallback((listener: () => void) => (session ? session.subscribe(listener) : noopUnsubscribe), [session]);
	const active = useSyncExternalStore(subscribe, () => session?.state.isActive ?? false);
	const mode: ScreenDrawMode | null = localScreenTileId && supportsScreenAnnotation() ? 'broadcast' : null;
	const sessionTilePresent = !session || screenTileIds.includes(session.tileId);

	useEffect(() => {
		if (!session || sessionTilePresent) return;
		setSession(null);
		void stopBroadcast();
	}, [session, sessionTilePresent, stopBroadcast]);

	const open = async () => {
		if (!mode || !localScreenTileId) return;
		const next = new ScreenDrawSession(localScreenTileId);
		if (!(await startBroadcast(next))) return;
		setSession(next);
		focusTile(localScreenTileId);
	};

	const close = async () => {
		if (!session) return;
		await stopBroadcast();
		setSession(null);
	};

	return {
		session,
		active,
		mode,
		toggle: () => void (active ? close() : open()),
		close: () => void close()
	};
};
