import { selectShowScreen, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const ScreenShareToggleButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => {
	const dispatch = useDispatch();
	const showScreen = useSelector(selectShowScreen);

	const defaultClassName = 'lk-button lk-track-toggle';

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		dispatch(voiceActions.setShowScreen(!showScreen));
		props.onClick?.(event);
	};

	return (
		<button ref={ref} className={`${defaultClassName} ${className}`} onClick={handleClick} {...props}>
			{showScreen ? <Icons.VoiceScreenShareStopIcon /> : <Icons.VoiceScreenShareIcon />}
		</button>
	);
});
