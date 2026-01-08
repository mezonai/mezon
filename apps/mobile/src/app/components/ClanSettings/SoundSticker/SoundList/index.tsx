import { size } from '@mezon/mobile-ui';
import { ClanSticker } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform } from 'react-native';
import Sound from 'react-native-sound';
import { SoundItem } from '../SoundItem';

type SoundListProps = {
	soundList: ClanSticker[];
	ListHeaderComponent: React.ComponentType<any>;
};

const SoundItemMemo = memo(SoundItem);

const ITEM_HEIGHT = size.s_60;

export const SoundList = ({ soundList, ListHeaderComponent }: SoundListProps) => {
	const row = useRef<{ [key: string]: { close: () => void } }>({}).current;
	const [currentSoundId, setCurrentSoundId] = useState<string | null>(null);
	const currentSoundRef = useRef<Sound | null>(null);
	let prevOpenedRow: { close: () => void };

	useEffect(() => {
		return () => {
			stopCurrentSound();
		};
	}, []);

	const stopCurrentSound = useCallback(() => {
		if (currentSoundRef.current) {
			currentSoundRef.current.stop(() => {
				currentSoundRef.current?.release();
				currentSoundRef.current = null;
			});
		}
	}, []);

	const onPlaySound = useCallback(
		(item: ClanSticker) => {
			if (item?.id === currentSoundId) {
				stopCurrentSound();
				setCurrentSoundId(null);
				return;
			}

			stopCurrentSound();

			const sound = new Sound(item.source, Platform.OS === 'android' ? Sound.MAIN_BUNDLE : null, (error) => {
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
		[currentSoundId, stopCurrentSound]
	);

	const closeRow = useCallback(
		(id: string) => {
			if (prevOpenedRow && prevOpenedRow !== row[id]) {
				prevOpenedRow.close();
			}
			prevOpenedRow = row[id];
		},
		[row]
	);

	const handleSwipe = useCallback(
		(item: ClanSticker) => {
			closeRow(item.id);
		},
		[closeRow]
	);

	const renderItem = useCallback(
		({ item }: { item: ClanSticker }) => (
			<SoundItemMemo
				item={item}
				ref={(ref) => {
					if (ref) {
						row[item.id] = ref;
					}
				}}
				onSwipeOpen={handleSwipe}
				onPressPlay={onPlaySound}
				isPlaying={currentSoundId === item?.id}
			/>
		),
		[currentSoundId, handleSwipe, onPlaySound, row]
	);

	const keyExtractor = useCallback((item: ClanSticker) => `sound_sticker_${item?.clanId}_${item?.id}`, []);

	const getItemLayout = useCallback(
		(_: any, index: number) => ({
			length: ITEM_HEIGHT,
			offset: ITEM_HEIGHT * index,
			index
		}),
		[]
	);

	return (
		<FlatList
			data={soundList}
			extraData={currentSoundId}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListHeaderComponent={ListHeaderComponent}
			getItemLayout={getItemLayout}
			removeClippedSubviews
			maxToRenderPerBatch={10}
			updateCellsBatchingPeriod={50}
			windowSize={5}
			initialNumToRender={10}
		/>
	);
};
