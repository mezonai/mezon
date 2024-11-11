import { useGifsStickersEmoji } from '@mezon/core';
import { reactionActions, referencesActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { SubPanelName } from '@mezon/utils';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

type ReactionBottomProps = {
	smileButtonRef: React.RefObject<HTMLDivElement>;
	messageIdRefReaction: string;
};

const ReactionBottom = ({ smileButtonRef, messageIdRefReaction }: ReactionBottomProps) => {
	const dispatch = useDispatch();
	const [highlightColor, setHighLightColor] = useState('#AEAEAE');
	const { setSubPanelActive, subPanelActive } = useGifsStickersEmoji();
	const handleClickOpenEmojiBottom = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			setSubPanelActive(SubPanelName.EMOJI_REACTION_BOTTOM);
			event.stopPropagation();
			dispatch(referencesActions.setIdReferenceMessageReaction(messageIdRefReaction));
		},
		[setSubPanelActive]
	);

	useEffect(() => {
		if (subPanelActive === SubPanelName.EMOJI_REACTION_BOTTOM) {
			setHighLightColor('#FFFFFF');
		}
	});

	const handleHoverSmileButton = useCallback(() => {
		if (smileButtonRef.current) {
			const rect = smileButtonRef.current.getBoundingClientRect();

			dispatch(
				reactionActions.setPositionOfSmileButton({
					top: rect.top,
					right: rect.right,
					left: rect.left,
					bottom: rect.bottom
				})
			);
		}
		setSubPanelActive(SubPanelName.NONE);
	}, [smileButtonRef, dispatch]);

	return (
		<div onMouseEnter={handleHoverSmileButton} onClick={handleClickOpenEmojiBottom} ref={smileButtonRef}>
			<Icons.Smile defaultSize="w-5 h-5" defaultFill={highlightColor} />
		</div>
	);
};

export default ReactionBottom;
