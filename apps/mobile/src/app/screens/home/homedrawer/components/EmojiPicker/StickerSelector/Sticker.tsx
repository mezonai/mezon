import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentClan, useAppSelector } from '@mezon/store';
import { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import RenderAudioItem from './SoundStickerItem';
import { style } from './styles';

interface ISticker {
	stickerList: any[];
	categoryName: string;
	onClickSticker: (sticker: any) => void;
	isAudio?: boolean;
}

export default memo(function Sticker({ stickerList, categoryName, onClickSticker, isAudio }: ISticker) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const stickersListByCategoryName = stickerList.filter((sticker) => sticker.type === categoryName);
	const currentClan = useAppSelector(selectCurrentClan);

	return (
		<View style={styles.session} key={`${categoryName}_stickers-parent`}>
			<Text style={styles.sessionTitle}>{categoryName !== 'custom' ? categoryName : currentClan?.clan_name}</Text>
			<View style={styles.sessionContent}>
				{stickersListByCategoryName.length > 0 &&
					stickersListByCategoryName.map((sticker, index) => (
						<TouchableOpacity
							key={`${index}_sticker`}
							onPress={() => onClickSticker(sticker)}
							style={isAudio ? styles.audioContent : styles.content}
						>
							{isAudio ? (
								<>
									<RenderAudioItem audioURL={sticker?.url} />
									<Text style={styles.soundName} numberOfLines={1}>
										{sticker?.name}
									</Text>
								</>
							) : (
								<FastImage
									source={{
										uri: sticker.url,
										cache: FastImage.cacheControl.immutable,
										priority: FastImage.priority.high
									}}
									style={{ height: '100%', width: '100%' }}
								/>
							)}
						</TouchableOpacity>
					))}
			</View>
		</View>
	);
});
