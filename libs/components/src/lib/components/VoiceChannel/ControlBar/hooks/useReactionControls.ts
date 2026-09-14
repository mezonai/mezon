import { selectVoiceInfo } from '@mezon/store';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSendReaction } from '../../MyVideoConference/Reaction/useSendReaction';

export function useReactionControls() {
	const { sendEmojiReaction, sendSoundReaction, sendRaisingHand } = useSendReaction();
	const voiceInfo = useSelector(selectVoiceInfo);

	const [showEmojiPanel, setShowEmojiPanel] = useState(false);
	const [showSoundPanel, setShowSoundPanel] = useState(false);

	useEffect(() => {
		setShowEmojiPanel(false);
		setShowSoundPanel(false);
	}, [voiceInfo?.channelId]);

	useEffect(() => {
		if (!showEmojiPanel) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' || e.key === 'Esc') {
				setShowEmojiPanel(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [showEmojiPanel]);

	useEffect(() => {
		if (!showSoundPanel) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' || e.key === 'Esc') {
				setShowSoundPanel(false);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [showSoundPanel]);

	const handleEmojiSelect = useCallback(
		(emojiId: string, emoji: string) => {
			sendEmojiReaction(emoji, emojiId);
		},
		[sendEmojiReaction]
	);

	const handleSoundSelect = useCallback(
		(soundId: string, _soundUrl: string) => {
			sendSoundReaction(_soundUrl);
		},
		[sendSoundReaction]
	);

	return {
		showEmojiPanel,
		setShowEmojiPanel,
		showSoundPanel,
		setShowSoundPanel,
		handleEmojiSelect,
		handleSoundSelect,
		sendRaisingHand
	};
}
