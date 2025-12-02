import { useReactFlow } from '@xyflow/react';
import { FitViewIcon, LockIcon, UnlockIcon, ZoomInIcon, ZoomOutIcon } from '../../../assets/icons/toolbarIcons';
import ToolbarItems from './ToolbarItems';

interface CustomControlsProps {
	locked: boolean;
	setLocked: (locked: boolean) => void;
}

const CustomControls = ({ locked, setLocked }: CustomControlsProps) => {
	const { zoomIn, zoomOut, fitView } = useReactFlow();

	const handleToggleLock = () => {
		setLocked(!locked);
	};

	return (
		<div className="absolute left-4 bottom-4 flex flex-row gap-2 z-50">
			<ToolbarItems icon={<ZoomInIcon className="w-5 h-5" />} label="Zoom in" isActive={false} onClick={zoomIn} tooltipPosition="top" />
			<ToolbarItems icon={<ZoomOutIcon className="w-5 h-5" />} label="Zoom out" isActive={false} onClick={zoomOut} tooltipPosition="top" />
			<ToolbarItems icon={<FitViewIcon className="w-5 h-5" />} label="Fit view" isActive={false} onClick={fitView} tooltipPosition="top" />
			<ToolbarItems
				icon={locked ? <LockIcon className="w-5 h-5" /> : <UnlockIcon className="w-5 h-5" />}
				label={locked ? 'Unlock nodes' : 'Lock nodes'}
				isActive={locked}
				onClick={handleToggleLock}
				tooltipPosition="top"
			/>
		</div>
	);
};

export default CustomControls;
