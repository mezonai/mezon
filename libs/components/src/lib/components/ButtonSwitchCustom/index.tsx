import { generateE2eId } from '@mezon/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

export interface ButtonSwitchProps {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
	iconDefault: React.ReactNode;
	iconSwitch: React.ReactNode;
	duration?: number;
	title?: string;
}

export const ButtonSwitch: React.FC<ButtonSwitchProps> = ({ title, duration = 1000, onClick, disabled, className, iconDefault, iconSwitch }) => {
	const [isSwitched, setIsSwitched] = useState(false);
	const [isLeft, setIsLeft] = useState(false);
	const handleOnClickButton = useCallback(() => {
		if (disabled) return;
		if (isSwitched) return;

		onClick();
		setIsSwitched(true);
	}, [disabled, isSwitched]);

	useEffect(() => {
		if (!isLeft) return;
		const timer = setTimeout(() => {
			setIsSwitched(false);
			setIsLeft(false);
		}, duration);
		return () => clearTimeout(timer);
	}, [isLeft]);

	const handleSetDefault = useCallback(() => {
		if (isSwitched) {
			setIsLeft(true);
		}
	}, [isSwitched]);

	const displayedIcon = useMemo(() => (isSwitched ? iconSwitch : iconDefault), [isSwitched, iconDefault, iconSwitch]);

	return (
		<button
			onMouseLeave={handleSetDefault}
			className={`flex items-center p-1 rounded-sm bg-bgSecondary bg-item-theme-hover ${className ?? ''} `}
			onClick={handleOnClickButton}
			disabled={disabled}
			data-e2e={generateE2eId('button.copy')}
		>
			{displayedIcon} {title && <p>{title}</p>}
		</button>
	);
};

export default React.memo(ButtonSwitch);
