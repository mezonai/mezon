import { baseColor, useTheme } from '@mezon/mobile-ui';
import { memo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { style } from './style';

interface IProps {
	tabActive: number;
	onChange?: (pageID: number) => void;
	tabList: {
		title: string;
		quantitySearch?: number;
	}[];
}

const AssetsHeader = memo(({ tabActive = 0, onChange, tabList = [] }: IProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={styles.headerTab}>
			<ScrollView showsHorizontalScrollIndicator={false} horizontal>
				{tabList?.map((tab, index) => (
					<Pressable key={index.toString()} onPress={(e) => onChange(index)} style={styles.itemTab}>
						<Text style={{ color: index === tabActive ? baseColor.blurple : themeValue.text }}>
							{tab.title} {tab?.quantitySearch ? `(${tab?.quantitySearch})` : ''}
						</Text>
						<View style={[styles.itemTabActive, { backgroundColor: index === tabActive ? baseColor.blurple : 'transparent' }]} />
					</Pressable>
				))}
			</ScrollView>
		</View>
	);
});

export default AssetsHeader;
