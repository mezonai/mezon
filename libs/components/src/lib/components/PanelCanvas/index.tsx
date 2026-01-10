import { useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { appActions, canvasAPIActions, useAppDispatch } from '@mezon/store';
import { RefObject, useEffect, useRef, useState } from 'react';
import { Coords } from '../ChannelLink';
import GroupPanels from '../PanelChannel/GroupPanels';
import ItemPanel from '../PanelChannel/ItemPanel';

interface IPanelCanvasProps {
	coords: Coords;
	channelId?: string;
	clanId?: string;
	canvasId?: string;
	handClosePannel: () => void;
	parentRef: RefObject<HTMLDivElement>;
}

const PanelCanvas: React.FC<IPanelCanvasProps> = ({ coords, channelId, clanId, canvasId, handClosePannel, parentRef }) => {
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState(false);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const heightPanel = panelRef.current?.clientHeight;
		if (heightPanel && heightPanel > coords.distanceToBottom) {
			setPositionTop(true);
		}
	}, [coords.distanceToBottom]);

	const handleDeleteCanvas = async () => {
		if (canvasId && channelId && clanId) {
			const body = {
				id: canvasId,
				channelId: channelId,
				clanId: clanId
			};
			const results = await dispatch(canvasAPIActions.deleteCanvas(body));
			dispatch(canvasAPIActions.removeOneCanvas({ channelId, canvasId: canvasId }));
			dispatch(appActions.setIsShowCanvas(false));
		}
	};

	useEscapeKeyClose(parentRef, handClosePannel);
	useOnClickOutside(parentRef, handClosePannel);

	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			role={'button'}
			style={{ left: coords.mouseX, bottom: positionTop ? '12px' : 'auto', top: positionTop ? 'auto' : coords.mouseY }}
			className="outline-none fixed top-full dark:bg-bgProfileBody bg-white rounded-sm z-20 w-[200px] py-[10px] px-[10px] shadow-md"
		>
			<GroupPanels>
				<ItemPanel onClick={() => handleDeleteCanvas()} danger>
					Delete Canvas
				</ItemPanel>
			</GroupPanels>
		</div>
	);
};

export default PanelCanvas;
