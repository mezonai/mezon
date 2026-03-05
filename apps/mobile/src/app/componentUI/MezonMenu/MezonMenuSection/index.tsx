import { useTheme } from '@mezon/mobile-ui';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import type { IMezonMenuItemProps } from '../MezonMenuItem';
import MezonMenuItem from '../MezonMenuItem';
import { style } from './styles';

export interface IMezonMenuSectionProps {
	title?: string;
	bottomDescription?: string;
	items: IMezonMenuItemProps[];
}

export default function MezonMenuSection({ title, items, bottomDescription }: IMezonMenuSectionProps) {
	const styles = style(useTheme().themeValue);
	const lastItemIndex = useMemo(() => items?.findLastIndex((item) => item?.isShow !== false) ?? -1, [items]);

	return (
		<View>
			{title && <Text style={styles.sectionTitle}>{title}</Text>}

			<View style={styles.section}>
				{items.map((item, index) => (
					<MezonMenuItem isLast={index === lastItemIndex} key={`item_${index}_${item?.title}`} {...item} />
				))}
			</View>

			{bottomDescription && <Text style={styles.sectionDescription}>{bottomDescription}</Text>}
		</View>
	);
}
