import { size } from '@mezon/mobile-ui';
import { FlashList } from '@shopify/flash-list';
import { ClanEmoji, ClanSticker } from 'mezon-js';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import Sound from 'react-native-sound';
import { SoundItem } from '../SoundItem';
type EmojiListProps = {
	soundList: ClanSticker[];
};

export const SoundList = ({ soundList }: EmojiListProps) => {
	const row: Array<any> = [];
	let prevOpenedRow: { close: () => void };
	const [currentSoundId, setCurrentSoundId] = useState(null);
	const currentSoundRef = useRef(null);

	const stopCurrentSound = () => {
		if (currentSoundRef.current) {
			currentSoundRef.current?.stop(() => {
				currentSoundRef.current?.release();
				currentSoundRef.current = null;
			});
		}
	};

	const onPlaySound = useCallback(
		(item: ClanSticker) => {
			if (item?.id === currentSoundId) {
				stopCurrentSound();
				setCurrentSoundId(null);
				return;
			}

			stopCurrentSound();

			const sound = new Sound(item.source, Sound.MAIN_BUNDLE, (error) => {
				if (error) {
					console.error('error load sound: ', error);
					return;
				}
				sound.play((success) => {
					setCurrentSoundId(null);
					sound.release();
					currentSoundRef.current = null;
				});
			});
			currentSoundRef.current = sound;
			setCurrentSoundId(item.id);
		},
		[currentSoundId]
	);

	const closeRow = (id: string) => {
		if (prevOpenedRow && prevOpenedRow !== row[parseInt(id)]) {
			prevOpenedRow.close();
		}
		prevOpenedRow = row[parseInt(id)];
	};

	const handleSwipe = useCallback((item: ClanEmoji) => {
		closeRow(item.id);
	}, []);

	const renderItem = useCallback(
		({ item }) => (
			<SoundItem
				item={item}
				key={`emoji_${item?.clan_id}_${item?.id}`}
				ref={(ref) => {
					row[parseInt(item.id)] = ref;
				}}
				onSwipeOpen={handleSwipe}
				onPressPlay={onPlaySound}
				isPlaying={currentSoundId === item?.id}
			/>
		),
		[currentSoundId, handleSwipe, onPlaySound]
	);

	return (
		<View>
			<FlashList
				data={soundList}
				extraData={currentSoundId}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				estimatedItemSize={size.s_60}
			/>
		</View>
	);
};
