import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { memo, useEffect, useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import Sound from 'react-native-sound';
import MezonIconCDN from '../../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../constants/icon_cdn';
import { style } from './styles';

interface IRenderAudioItemProps {
	audioURL: string;
}

const RenderAudioItem = memo(({ audioURL }: IRenderAudioItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const soundRef = useRef<Sound | null>(null);

	useEffect(() => {
		return () => {
			soundRef.current?.release();
			soundRef.current = null;
		};
	}, [audioURL]);

	const playSound = () => {
		setIsPlaying(true);

		if (soundRef.current) {
			soundRef.current?.play((success) => {
				if (success) {
					setIsPlaying(false);
				}
			});
			return;
		}

		const newSound = new Sound(audioURL, Sound.MAIN_BUNDLE, (error) => {
			if (error) {
				console.error('Failed to load sound:', error);
				setIsPlaying(false);
				return;
			}
			soundRef.current = newSound;
			newSound.play((success) => {
				if (success) {
					setIsPlaying(false);
					newSound.setCurrentTime(0);
				}
			});
		});
	};

	const pauseSound = () => {
		if (soundRef.current) {
			setIsPlaying(false);
			soundRef.current.pause();
		}
	};

	if (!audioURL) return null;

	return (
		<TouchableOpacity onPress={isPlaying ? pauseSound : playSound} activeOpacity={0.6} style={styles.container}>
			<MezonIconCDN
				icon={isPlaying ? IconCDN.pauseIcon : IconCDN.playIcon}
				width={size.s_16}
				height={size.s_16}
				color={baseColor.bgDeepLavender}
			/>
		</TouchableOpacity>
	);
});

export default RenderAudioItem;
