import { useTheme } from '@mezon/mobile-ui';
import { sleep } from '@mezon/utils';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import ConversationCard from './ConversationCard';
import { style } from './styles';

export interface IMezonSlideOptionsData {
	element: ReactNode;
	value: string | number;
	title: string;
}

interface IMezonSlideOption {
	data: IMezonSlideOptionsData[];
	onChange?: (value: number | string) => void;
	height?: number;
	width?: number;
	initialIndex: number;
}

export default function MezonSlideOption({ data, onChange, height = 90, width = 65, initialIndex }: IMezonSlideOption) {
	const [padding, setPadding] = useState(0);
	const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
	const [title, setTitle] = useState<string>(data?.[initialIndex >= 0 ? initialIndex : 0].title);
	const styles = style(useTheme().themeValue);
	const ref = useRef<ScrollView>(null);
	const { t } = useTranslation(['appThemeSetting']);

	const handleLayout = (event) => {
		const { x } = event.nativeEvent.layout;
		setPadding(x);
	};

	const handleScroll = (event) => {
		const { x } = event.nativeEvent.contentOffset;
		const _index = Math.floor(x / 60);

		if (index != _index) {
			const finalIndex = _index >= 0 ? _index : 0;
			setIndex(finalIndex);
			if (data?.[finalIndex]?.title) {
				setTitle(data[finalIndex].title);
				onChange && onChange(data[finalIndex].value);
			}
		}
	};

	const scrollToInitialIndex = useCallback(async () => {
		await sleep(300);
		const finalIndex = initialIndex >= 0 ? initialIndex : 0;
		ref?.current?.scrollTo({
			x: finalIndex * width,
			animated: false
		});
	}, [initialIndex, width]);

	useEffect(() => {
		scrollToInitialIndex();
	}, [initialIndex, scrollToInitialIndex]);

	function handlePressItem(index: number) {
		ref?.current?.scrollTo({
			x: index * width,
			animated: false
		});
	}

	return (
		<View>
			<ConversationCard />
			<View>
				<Text style={styles.title}>{title}</Text>
				<View style={{ position: 'relative' }}>
					<View style={[styles.boxSelect]}>
						<View style={[styles.boxBorder, { height, width }]} onLayout={handleLayout}></View>
					</View>

					<ScrollView
						ref={ref}
						decelerationRate={'fast'}
						snapToAlignment={'start'}
						snapToInterval={width}
						horizontal={true}
						showsHorizontalScrollIndicator={false}
						style={styles.selectListWrapper}
						scrollEventThrottle={50}
						onScroll={handleScroll}
						contentContainerStyle={[
							{
								paddingLeft: padding + 5,
								paddingRight: padding + 5
							},
							styles.selectList
						]}
					>
						{data.map((item, index) => (
							<View key={index.toString()}>
								<Pressable onPress={() => handlePressItem(index)}>{item.element}</Pressable>
							</View>
						))}
					</ScrollView>
				</View>
			</View>
			<Text style={styles.desc}>{t('desc')}</Text>
		</View>
	);
}
