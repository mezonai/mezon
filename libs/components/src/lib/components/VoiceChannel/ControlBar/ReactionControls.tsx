import clsx from 'clsx';
import { memo } from 'react';
import { EmojiReactionControl } from './EmojiReactionControl';
import { SoundReactionControl } from './SoundReactionControl';
import { useReactionControls } from './hooks/useReactionControls';

interface ReactionControlsProps {
	isGroupCall: boolean;
	isGridView: boolean;
	isShowMember: boolean;
	className?: string;
}

export const ReactionControls = memo(({ isGroupCall, isGridView, isShowMember, className }: ReactionControlsProps) => {
	const { showEmojiPanel, setShowEmojiPanel, showSoundPanel, setShowSoundPanel, handleEmojiSelect, handleSoundSelect } = useReactionControls();

	if (isGroupCall) {
		return null;
	}

	return (
		<div className={clsx('flex justify-start gap-4', className)}>
			<EmojiReactionControl
				isGridView={isGridView}
				isShowMember={isShowMember}
				showEmojiPanel={showEmojiPanel}
				onVisibleChange={setShowEmojiPanel}
				onEmojiSelect={handleEmojiSelect}
			/>
			<SoundReactionControl
				isGridView={isGridView}
				isShowMember={isShowMember}
				showSoundPanel={showSoundPanel}
				onVisibleChange={setShowSoundPanel}
				onSoundSelect={handleSoundSelect}
			/>
		</div>
	);
});
