import { EmojiSuggestionProvider } from '@mezon/core';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { EmojiPlaces } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import Tooltip from 'rc-tooltip';
import { memo, useCallback } from 'react';
import { GifStickerEmojiPopup } from '../../GifsStickersEmojis';

interface EmojiReactionControlProps {
	isGridView?: boolean;
	isShowMember?: boolean;
	showEmojiPanel: boolean;
	onVisibleChange: (visible: boolean) => void;
	onEmojiSelect: (emojiId: string, emoji: string) => void;
}

export const EmojiReactionControl = memo(({ showEmojiPanel, onVisibleChange, onEmojiSelect }: EmojiReactionControlProps) => {
	const handleEmojiSelect = useCallback(
		(emojiId: string, emoji: string) => {
			onEmojiSelect(emojiId, emoji);
		},
		[onEmojiSelect]
	);

	const iconClassName = 'cursor-pointer text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]';

	return (
		<Tooltip
			placement="topLeft"
			trigger={['click']}
			overlayClassName="w-auto"
			visible={showEmojiPanel}
			onVisibleChange={onVisibleChange}
			overlay={
				<EmojiSuggestionProvider>
					<GifStickerEmojiPopup
						showTabs={{ emojis: true }}
						mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
						emojiAction={EmojiPlaces.EMOJI_REACTION}
						onEmojiSelect={handleEmojiSelect}
					/>
				</EmojiSuggestionProvider>
			}
			destroyTooltipOnHide
		>
			<div>
				<MezonIcon icon={MzIcons20.mzEmoji} className={iconClassName} />
			</div>
		</Tooltip>
	);
});

EmojiReactionControl.displayName = 'SfuEmojiReactionControl';
