import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@mezon/mobile-ui';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

export const RoleColorPicker = function RoleColorPicker({
	onPickColor,
	currentColor
}: {
	onPickColor: (color: string) => void;
	currentColor?: string;
}) {
	const [colorSelected, setColorSelected] = useState<string>(currentColor);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { dismiss } = useBottomSheetModal();
	const { t } = useTranslation('clanRoles');

	const colorArray = [
		'#1abc9c',
		'#2ecc71',
		'#3498db',
		'#9b59b6',
		'#e91e63',
		'#f1c40f',
		'#e67e22',
		'#e74c3c',
		'#95a5a6',
		'#607d8b',
		'#11806a',
		'#1f8b4c',
		'#206694',
		'#71368a',
		'#ad1457',
		'#c27c0e',
		'#e84300',
		'#992d22',
		'#979c9f',
		'#546e7a'
	];
	const handlePickColor = (color: string) => {
		setColorSelected(color);
	};

	const handleResetColor = () => {
		setColorSelected('');
	};

	const handleSaveColor = () => {
		onPickColor(colorSelected);
		dismiss();
	};
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerSpacer} />
				<Text style={styles.title}>{t('roleColorPicker.titleBS')}</Text>
				<TouchableOpacity
					onPress={handleSaveColor}
					style={[styles.headerRightBtn, colorSelected !== currentColor && styles.activeSaveButton]}
					disabled={colorSelected === currentColor}
				>
					<Text style={styles.textBtn}>{t('roleColorPicker.save')}</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.colorGrid}>
				{colorArray?.map((color) => (
					<Pressable onPress={() => handlePickColor(color)}>
						<View style={[styles.colorItem, { backgroundColor: color }]}>
							{!!colorSelected && colorSelected === color && <Text style={styles.checkedIcon}>✓</Text>}
						</View>
					</Pressable>
				))}
			</View>
			<View style={styles.footerContainer}>
				<TouchableOpacity onPress={handleResetColor} style={styles.footerBtn}>
					<Text style={styles.textBtn}>{t('roleColorPicker.reset')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default React.memo(RoleColorPicker);
