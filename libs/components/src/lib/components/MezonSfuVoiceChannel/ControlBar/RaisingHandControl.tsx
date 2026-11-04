import { useAuth } from '@mezon/core';
import { MezonIcon, MzIcons32, MzIcons40 } from '@mezon/ui';
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
			title={active ? 'Lower hand' : 'Raise hand'}
			aria-label={active ? 'Lower hand' : 'Raise hand'}
			aria-pressed={active}
			className={SFU_CONTROL_BUTTON_CLASS}
			onClick={() => setHand(!active)}
		>
			<MezonIcon icon={MzIcons40.mzHandRaise} className={`max-lg:hidden ${active ? 'text-[#efbc39]' : 'text-white'}`} />
			<MezonIcon icon={MzIcons32.mzHandRaise} className={`hidden max-lg:block ${active ? 'text-[#efbc39]' : 'text-white'}`} />
		</button>
	);
});
