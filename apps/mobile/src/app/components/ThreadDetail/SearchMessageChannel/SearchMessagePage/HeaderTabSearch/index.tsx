import { ITabList } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
interface IHeaderTabSearchProps {
	onPress: (index: number) => void;
	tabList: ITabList[];
	activeTab: number;
}
const HeaderTabSearch = ({ onPress, tabList, activeTab }: IHeaderTabSearchProps) => {
	const { themeValue } = useTheme();
	return (
		<View
			style={{
				flexDirection: 'row',
				justifyContent: 'flex-start',
				alignItems: 'center',
				borderBottomColor: '#5a5b5c30',
				borderBottomWidth: 1
			}}
		>
			{tabList?.map((tab: ITabList, index: number) => (
				<Pressable key={`tab_search_${index.toString()}`} onPress={() => onPress(tab?.index)} style={{ width: '33.33%' }}>
					<View
						style={{
							paddingBottom: size.s_10,
							paddingVertical: size.s_20,
							borderBottomColor: themeValue.bgViolet,
							borderBottomWidth: tab?.index === activeTab ? size.s_2 : 0,
							alignItems: 'center'
						}}
					>
						<Text
							style={{ color: tab?.index === activeTab ? baseColor.blurple : themeValue.text }}
							numberOfLines={1}
							ellipsizeMode="middle"
						>
							{tab.title} {tab?.quantitySearch ? `(${tab?.quantitySearch})` : ''}
						</Text>
					</View>
				</Pressable>
			))}
		</View>
	);
};

export default React.memo(HeaderTabSearch);
