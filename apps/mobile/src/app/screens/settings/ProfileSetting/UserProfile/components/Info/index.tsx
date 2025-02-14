import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';
import { IUserProfileValue } from '../../..';
import { MezonInput } from '../../../../../../componentUI';
import { style } from './styles';

interface IDetailInfoProps {
	value: IUserProfileValue;
	onChange: (value: Partial<IUserProfileValue>) => void;
}
export default function DetailInfo({ value, onChange }: IDetailInfoProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['profileSetting']);

	return (
		<View>
			<View style={styles.container}>
				<View style={styles.nameWrapper}>
					<Text style={styles.name}>{value?.displayName || value?.username}</Text>
					<Text style={styles.username}>{value?.username}</Text>
				</View>

				<MezonInput
					value={value?.displayName}
					onTextChange={(newValue) => onChange({ displayName: newValue })}
					placeHolder={value?.username}
					maxCharacter={32}
					label={t('fields.displayName.label')}
				/>

				<MezonInput
					value={value?.aboutMe}
					onTextChange={(newValue) => onChange({ aboutMe: newValue })}
					maxCharacter={128}
					textarea
					placeHolder=""
					label={t('fields.bio.label')}
				/>
			</View>
			{Platform.OS === 'ios' && <View style={{ height: size.s_50 * 2 }} />}
		</View>
	);
}
