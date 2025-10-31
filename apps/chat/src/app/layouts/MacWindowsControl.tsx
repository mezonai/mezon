import {
	checkMaximizedState,
	closeWindow,
	listenToWindowStateChanges,
	maximizeWindow,
	minimizeWindow,
	selectIsMaximized,
	selectIsWindowFocused,
	useAppDispatch,
	useAppSelector,
	windowControlsActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import React, { useCallback, useEffect } from 'react';
import { WEBKIT_NO_DRAG } from '../styles/commonStyles';

interface MacOSWindowControlsProps {
	className?: string;
}

export const MacOSWindowControls: React.FC<MacOSWindowControlsProps> = ({ className }) => {
	const dispatch = useAppDispatch();
	const isMaximized = useAppSelector(selectIsMaximized);
	const isWindowFocused = useAppSelector(selectIsWindowFocused);

	// Listen for window focus/blur events
	useEffect(() => {
		const handleFocus = () => dispatch(windowControlsActions.setIsWindowFocused(true));
		const handleBlur = () => dispatch(windowControlsActions.setIsWindowFocused(false));

		window.addEventListener('focus', handleFocus);
		window.addEventListener('blur', handleBlur);

		return () => {
			window.removeEventListener('focus', handleFocus);
			window.removeEventListener('blur', handleBlur);
		};
	}, [dispatch]);

	const handleMinimize = useCallback(() => {
		dispatch(minimizeWindow());
	}, [dispatch]);

	const handleMaximize = useCallback(() => {
		dispatch(maximizeWindow());
	}, [dispatch]);

	const handleClose = useCallback(() => {
		dispatch(closeWindow());
	}, [dispatch]);

	useEffect(() => {
		dispatch(checkMaximizedState());
		dispatch(listenToWindowStateChanges());
	}, [dispatch]);

	const buttonBaseClass =
		'w-3 h-3 rounded-full cursor-default border-none flex items-center justify-center transition-all duration-200 ease-in-out group';

	const MacOSButton: React.FC<{
		onClick: () => void;
		buttonType?: string;
		backgroundColor: string;
		title?: string;
		icon: React.ReactNode;
	}> = ({ onClick, backgroundColor, title, icon }) => (
		<button onClick={onClick} className={buttonBaseClass} title={title} style={{ backgroundColor }}>
			<span className={`opacity-0 ${isWindowFocused ? 'group-hover:opacity-100' : ''} transition-opacity duration-200`}>{icon}</span>
		</button>
	);

	return (
		<div
			className={`fixed top-0 left-0 flex items-center gap-2 z-[9999] rounded-sm pl-3 px-2 py-3 backdrop-blur-sm ${className}`}
			style={WEBKIT_NO_DRAG}
		>
			<MacOSButton onClick={handleClose} backgroundColor="#ff5f57" icon={<Icons.MacOSCloseIcon />} />
			<MacOSButton onClick={handleMinimize} backgroundColor="#ffbd2e" icon={<Icons.MacOSMinimizeIcon />} />
			<MacOSButton onClick={handleMaximize} backgroundColor="#28ca42" icon={<Icons.MacOSMaximizeIcon isMaximized={isMaximized} />} />
		</div>
	);
};
