import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { hasGrandchildModal } from '@mezon/store';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Coords } from '../ChannelLink';

export const usePanelPosition = (coords: Coords, onClose: () => void, rootRef?: RefObject<HTMLElement>) => {
	const panelRef = useRef<HTMLDivElement>(null);
	const [positionTop, setPositionTop] = useState(false);
	const hasModalInChild = useSelector(hasGrandchildModal);

	useEffect(() => {
		const h = panelRef.current?.clientHeight;
		if (h && h > coords.distanceToBottom) setPositionTop(true);
	}, [coords.distanceToBottom]);

	useEscapeKeyClose(panelRef, onClose);
	useOnClickOutside(
		panelRef,
		() => {
			if (!hasModalInChild) onClose();
		},
		rootRef
	);

	return { panelRef, positionTop };
};
