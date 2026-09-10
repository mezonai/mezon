import type { ReactNode, Ref } from 'react';
import type { Coords } from '../ChannelLink';

type ContextMenuPanelProps = {
	panelRef: Ref<HTMLDivElement>;
	coords: Coords;
	positionTop: boolean;
	children: ReactNode;
};

const ContextMenuPanel = ({ panelRef, coords, positionTop, children }: ContextMenuPanelProps) => {
	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			style={{
				left: coords.mouseX,
				bottom: positionTop ? '12px' : 'auto',
				top: positionTop ? 'auto' : coords.mouseY
			}}
			className="outline-none fixed top-full bg-theme-contexify border-theme-primary rounded-lg shadow z-30 w-[200px] py-[10px] px-[10px]"
		>
			{children}
		</div>
	);
};

export default ContextMenuPanel;
