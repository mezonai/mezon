import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { supportsScreenAnnotation } from './ScreenAnnotationCompositor';
import { ScreenDrawSession } from './ScreenDrawSession';

export type ScreenDrawMode = 'broadcast' | 'local';

interface UseScreenDrawOptions {
	screenTileIds: string[];
	localScreenTileId?: string;
	pinnedTileId?: string;
	focusTile: (tileId: string) => void;
	startBroadcast: (session: ScreenDrawSession) => Promise<boolean>;
	stopBroadcast: () => Promise<void>;
}

const noopUnsubscribe = () => undefined;

export const useScreenDraw = ({ screenTileIds, localScreenTileId, pinnedTileId, focusTile, startBroadcast, stopBroadcast }: UseScreenDrawOptions) => {
	const [session, setSession] = useState<ScreenDrawSession | null>(null);
	const subscribe = useCallback((listener: () => void) => (session ? session.subscribe(listener) : noopUnsubscribe), [session]);
	const active = useSyncExternalStore(subscribe, () => session?.state.isActive ?? false);
	const remoteScreenTileIds = screenTileIds.filter((id) => id !== localScreenTileId);
	const mode: ScreenDrawMode | null = localScreenTileId && supportsScreenAnnotation() ? 'broadcast' : remoteScreenTileIds.length ? 'local' : null;
	const sessionTilePresent = !session || screenTileIds.includes(session.tileId);

	useEffect(() => {
		if (!session || sessionTilePresent) return;
		setSession(null);
		if (session.broadcast) void stopBroadcast();
	}, [session, sessionTilePresent, stopBroadcast]);

	const open = async () => {
		if (mode === 'broadcast' && localScreenTileId) {
			const next = new ScreenDrawSession(localScreenTileId, true);
			if (!(await startBroadcast(next))) return;
			setSession(next);
			focusTile(localScreenTileId);
			return;
		}
		const tileId = pinnedTileId && remoteScreenTileIds.includes(pinnedTileId) ? pinnedTileId : remoteScreenTileIds[0];
		if (!tileId) return;
		if (session && !session.broadcast && session.tileId === tileId) session.edit((state) => state.setActive(true));
		else setSession(new ScreenDrawSession(tileId, false));
		focusTile(tileId);
	};

	const close = async () => {
		if (!session) return;
		if (!session.broadcast) {
			session.edit((state) => state.setActive(false));
			return;
		}
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
