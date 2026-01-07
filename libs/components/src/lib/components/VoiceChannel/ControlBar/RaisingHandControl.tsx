import { useAuth } from '@mezon/core';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useReactionControls } from './hooks/useReactionControls';

export const RaisingHandControls = memo(() => {
	const { sendRaisingHand } = useReactionControls();
	const { userId } = useAuth();
	const [hand, setHand] = useState(false);

	const timeoutRef = useRef<number | null>(null);
	const timeCount = useRef<number>(0);
	const resetCountTimeoutRef = useRef<number | null>(null);

	const handleRaisingHand = useCallback(() => {
		if (!userId) return;
		if (timeCount.current >= 10) return;

		setHand(!hand);
		sendRaisingHand(userId, !hand);

		if (timeoutRef.current && hand) {
			clearTimeout(timeoutRef.current);
		}
		if (!hand) {
			timeCount.current++;
		}

		if (hand) {
			timeoutRef.current = window.setTimeout(() => {
				setHand(false);
				timeoutRef.current = null;
			}, 10000);
		}

		if (timeCount.current === 10) {
			if (resetCountTimeoutRef.current) clearTimeout(resetCountTimeoutRef.current);

			resetCountTimeoutRef.current = window.setTimeout(() => {
				timeCount.current = 0;
				resetCountTimeoutRef.current = null;
			}, 10000);
		}
	}, [hand, sendRaisingHand, userId]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (resetCountTimeoutRef.current) {
				clearTimeout(resetCountTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="relative rounded-full bg-gray-300 dark:bg-black" onClick={handleRaisingHand}>
			<div className="w-14 aspect-square max-md:w-10 max-md:p-2 !rounded-full flex justify-center items-center border-none dark:border-none bg-zinc-500 dark:bg-zinc-900 lk-button">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="-5.0 -10.0 110.0 135.0"
					className="h-8"
					fill={` ${hand ? '#efbc39' : 'currentColor'} `}
				>
					<path d="m50 94.488c-30.781-0.48828-28.59-41.488-28.59-41.488v-21c-0.058594-1.3242 0.42578-2.6172 1.3398-3.5781 0.91797-0.96094 2.1875-1.5039 3.5156-1.5039s2.5977 0.54297 3.5117 1.5039c0.91797 0.96094 1.4023 2.2539 1.3438 3.5781v21h0.51953v-0.12891h1.6016l-0.003907-38.199c-0.058593-1.3281 0.42578-2.6211 1.3438-3.5781 0.91797-0.96094 2.1875-1.5039 3.5117-1.5039 1.3281 0 2.5977 0.54297 3.5156 1.5039 0.91797 0.95703 1.4023 2.25 1.3398 3.5781v36h2.1602v-40.32c0-2.6797 2.1719-4.8516 4.8516-4.8516 2.6758 0 4.8477 2.1719 4.8477 4.8516v40.32h2v-34.922c0-2.7617 2.2383-5 5-5 2.7617 0 5 2.2383 5 5v45.379l2 0.46094v-15.59c0.12109-2.5977 2.2578-4.6406 4.8555-4.6406 2.5977 0 4.7383 2.043 4.8555 4.6406v15.59s2.2188 33.41-28.52 32.898z" />
				</svg>
			</div>
		</div>
	);
});
