import { voiceActions } from '@mezon/store';
import { memo, useCallback } from 'react';
import { useDispatch } from 'react-redux';

type ScreenItemsProps = {
	id: string;
	name: string;
	thumbnail: string;
	onClose?: () => void;
};

const ScreenItems = memo(({ id, name, thumbnail, onClose }: ScreenItemsProps) => {
	const dispatch = useDispatch();

	const selectStreamScreen = useCallback(async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: id
				}
			},
			audio: {
				mandatory: {
					chromeMediaSource: 'desktop',
					chromeMediaSourceId: id
				}
			}
		} as MediaStreamConstraints);
		dispatch(voiceActions.setShowSelectScreenModal(false));
		dispatch(voiceActions.setStreamScreen(stream));
		dispatch(voiceActions.setShowScreen(true));
		onClose?.();
	}, [id, dispatch, onClose]);

	return (
		<div onClick={() => selectStreamScreen()} className="h-40 overflow-hidden flex flex-col gap-2">
			<img className="w-full h-[136px] object-cover" src={thumbnail} alt={thumbnail} />
			<p className="text-base h-4 truncate leading-4">{name}</p>
		</div>
	);
});

export default ScreenItems;
