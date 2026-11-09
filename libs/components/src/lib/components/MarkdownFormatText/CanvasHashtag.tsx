import { toChannelCanvas, useCustomNavigate } from '@mezon/core';
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';

interface CanvasHashtagProps {
	clanId: string;
	channelId: string;
	canvasId: string;
	title: string;
	isTokenClickAble: boolean;
	isJumMessageEnabled: boolean;
}

const CanvasHashtag = ({ clanId, channelId, canvasId, title, isTokenClickAble, isJumMessageEnabled }: CanvasHashtagProps) => {
	const navigate = useCustomNavigate();

	const handleCanvasClick = () => {
		navigate(toChannelCanvas(clanId, channelId, canvasId));
	};

	return (
		<div
			onClick={!isJumMessageEnabled || isTokenClickAble ? handleCanvasClick : undefined}
			className={`font-medium px-0.1 rounded-sm inline whitespace-nowrap !text-[#3297ff] dark:bg-[#3C4270] bg-[#D1E0FF] ${
				!isJumMessageEnabled ? 'hover:bg-[#5865F2] hover:!text-white cursor-pointer' : 'hover:none cursor-text'
			}`}
			data-e2e={generateE2eId('message.hashtag.canvas')}
		>
			<MezonIcon icon={MzIcons16.mzCanvas} className={`inline mt-[-0.2rem] ${isJumMessageEnabled ? 'mx-[-0.4rem]' : 'mr-0.5'}`} />
			{title}
		</div>
	);
};

export default CanvasHashtag;
