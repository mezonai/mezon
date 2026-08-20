import { usePermissionChecker } from '@mezon/core';
import { handleAddAgentToVoice, handleKichAgentFromVoice, selectVoiceInfo, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

// Keep the optimistic Agent state when the control bar is remounted while the
// same SFU call is still active. The SFU snapshot currently has no `isAgent` flag.
const activeAgentChannels = new Set<string>();

export const SfuAgentControl = memo(() => {
	const [hasChannelPermission] = usePermissionChecker([EPermission.manageChannel]);
	const voiceInfo = useSelector(selectVoiceInfo);
	const dispatch = useAppDispatch();
	const [active, setActive] = useState(() => Boolean(voiceInfo?.channelId && activeAgentChannels.has(voiceInfo.channelId)));
	const [loading, setLoading] = useState(false);

	const handleToggle = useCallback(async () => {
		if (!voiceInfo?.channelId || loading) return;
		setLoading(true);
		const payload = { channel_id: voiceInfo.channelId, room_name: voiceInfo.roomId || '0' };
		try {
			await dispatch(active ? handleKichAgentFromVoice(payload) : handleAddAgentToVoice(payload)).unwrap();
			if (active) activeAgentChannels.delete(voiceInfo.channelId);
			else activeAgentChannels.add(voiceInfo.channelId);
			setActive(!active);
		} catch {
			return;
		} finally {
			setLoading(false);
		}
	}, [active, dispatch, loading, voiceInfo?.channelId, voiceInfo?.roomId]);

	if (!hasChannelPermission) return null;

	return (
		<button
			type="button"
			disabled={loading}
			onClick={() => void handleToggle()}
			aria-label={active ? 'Tắt KOMU Agent' : 'Bật KOMU Agent'}
			title={active ? 'Tắt KOMU Agent' : 'Bật KOMU Agent'}
			className={`${SFU_CONTROL_BUTTON_CLASS} ${active ? '!bg-[#da373c] hover:!bg-[#a12829]' : ''} ${loading ? 'cursor-default' : ''}`}
		>
			{loading ? (
				<Icons.LoadingSpinner />
			) : (
				<span className="relative">
					<AgentIcon />
					{active && (
						<span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-[#da373c]">
							×
						</span>
					)}
				</span>
			)}
		</button>
	);
});

const AgentIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 183" className="h-8 w-8" fill="currentColor" aria-hidden="true">
		<path d="M73.91 180.56c-17.45-4.82-35.91-21.15-35.91-38.45V67.7C44.27 43.63 64.35 29.04 98 29V21.75C98 12.59 100.36 7.08 105.67 3.66c7.25-4.69 15.04-4.3 21.42 1.07 4.41 3.71 5.91 7.96 5.91 16.74V29c19.78.03 38.81 10.82 46.88 26.75 5.73 11.36 6.12 49.31 6.12 49.31 0 17.41-.45 34.08-1 37.04-3.25 17.55-18.57 33.76-36.37 38.5-7.01 1.87-71.91 1.82-78.72-.05ZM89 80a16 16 0 1 0 0 32 16 16 0 0 0 0-32Zm50 0a16 16 0 1 0 0 32 16 16 0 0 0 0-32Zm-40 47a6 6 0 0 0 0 12h30a6 6 0 0 0 0-12H99Z" />
	</svg>
);
