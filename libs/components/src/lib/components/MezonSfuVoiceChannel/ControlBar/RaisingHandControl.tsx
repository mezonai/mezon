import { useAuth } from '@mezon/core';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSendReaction } from '../MyVideoConference/Reaction';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

export const SfuRaisingHandControl = memo(() => {
	const { userId } = useAuth();
	const { sendRaisingHand } = useSendReaction();
	const [active, setActive] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	const setHand = useCallback(
		(nextActive: boolean) => {
			if (!userId) return;
			setActive(nextActive);
			sendRaisingHand(userId, nextActive);
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
			if (nextActive) {
				timeoutRef.current = window.setTimeout(() => {
					setActive(false);
					sendRaisingHand(userId, false);
				}, 10000);
			}
		},
		[sendRaisingHand, userId]
	);

	useEffect(
		() => () => {
			if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
		},
		[]
	);

	return (
		<button
			type="button"
			title={active ? 'Hạ tay' : 'Giơ tay'}
			aria-label={active ? 'Hạ tay' : 'Giơ tay'}
			aria-pressed={active}
			className={SFU_CONTROL_BUTTON_CLASS}
			onClick={() => setHand(!active)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="-5 -10 110 135"
				className={`h-8 ${active ? 'text-[#efbc39]' : 'text-white'}`}
				fill="currentColor"
			>
				<path d="m50 94.488c-30.781-.488-28.59-41.488-28.59-41.488V32a4.86 4.86 0 0 1 9.71 0v21h2.12V14.67a4.86 4.86 0 0 1 9.71 0v36h2.16V10.35a4.85 4.85 0 0 1 9.7 0v40.32h2V15.75a5 5 0 0 1 10 0v45.38l2 .46V46a4.86 4.86 0 0 1 9.71 0v15.59s2.22 33.41-28.52 32.898Z" />
			</svg>
		</button>
	);
});
