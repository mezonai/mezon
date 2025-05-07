import { size, useTheme } from '@mezon/mobile-ui';
import { IMessageAnimation } from '@mezon/utils';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, View } from 'react-native';
import SpriteAnimation from './AnimationSprite';
import { style } from './styles';

type EmbedAnimationProps = {
	animationOptions: IMessageAnimation;
	isVeltical?: boolean;
};

const screenWith = Dimensions?.get('window').width;

const extractFrames = (data, isVeltical = false) => {
	if (!data?.frames) return [];

	const framesArray = Object.entries(data.frames).map(([key, frameData]) => {
		const { x, y, w, h } = (frameData as { frame: { x: number; y: number; w: number; h: number } }).frame;
		return { name: key, x, y, w, h };
	});

	if (isVeltical) {
		framesArray.sort((a, b) => {
			if (a.y !== b.y) return a.y - b.y;
			return a.x - b.x;
		});
	} else {
		framesArray.sort((a, b) => {
			if (a.x !== b.x) return a.x - b.x;
			return a.y - b.y;
		});
	}

	return framesArray;
};

export const EmbedAnimation = ({ animationOptions, isVeltical }: EmbedAnimationProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [frames, setFrames] = useState(null);
	const [frameWidth, setFrameWidth] = useState(0);
	const [frameHeight, setFrameHeight] = useState(0);
	const [spriteWidth, setSpriteWidth] = useState(0);
	const [spriteHeight, setSpriteHeight] = useState(0);
	const duration = 500;

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(animationOptions.url_position);
				const data = await response.json();

				const frameArray = extractFrames(data, isVeltical);
				if (frameArray) {
					setFrames(frameArray);
					setFrameHeight(frameArray?.[0]?.h || 0);
					setFrameWidth(frameArray?.[0]?.w || 0);
					setSpriteWidth(data?.meta?.size?.w || 0);
					setSpriteHeight(data?.meta?.size?.h || 0);
				}
			} catch (error) {
				console.error('Error fetching JSON data:', error);
			}
		};
		fetchData();
	}, []);

	const animationScale = useMemo(() => {
		if (isVeltical) return 1;
		if (animationOptions?.pool?.length) {
			if (animationOptions?.pool?.length * frameWidth >= screenWith - size.s_100) {
				return (screenWith - size.s_100) / screenWith;
			}
		}
		return 1;
	}, [animationOptions?.pool?.length, frameWidth, isVeltical]);

	if (!frames) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={themeValue.text} />
			</View>
		);
	}

	return (
		<View style={[styles.pool, { transform: [{ scale: animationScale }] }]}>
			{animationOptions?.pool?.length &&
				animationOptions?.pool?.map((item, index) => {
					return (
						<SpriteAnimation
							key={`animation_${index}`}
							spriteUrl={animationOptions?.url_image}
							frameWidth={frameWidth}
							frameHeight={frameHeight}
							frames={frames}
							duration={duration}
							finalFrame={item?.at?.(item?.length - 1 || 0)}
							repeat={animationOptions?.repeat + index}
							isActive={animationOptions?.isResult}
							spriteHeight={spriteHeight}
							spriteWidth={spriteWidth}
						/>
					);
				})}
		</View>
	);
};
