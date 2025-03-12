import { Icons } from '@mezon/mobile-components';
import { baseColor, Colors, size, useTheme } from '@mezon/mobile-ui';
import { channelsActions, useAppDispatch } from '@mezon/store-mobile';
import { ApiUpdateChannelDescRequest } from 'mezon-js';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonInput from '../../../componentUI/MezonInput';
import style from '../MenuCustomDm.styles';

const CustomGroupDm = ({ dmGroupId, channelLabel }: { dmGroupId: string; channelLabel: string }) => {
	const [nameGroup, setNameGroup] = useState<string>(channelLabel || '');
	const nameGroupRef = useRef(nameGroup);
	const { t } = useTranslation(['menuCustomDM']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	useEffect(() => {
		nameGroupRef.current = nameGroup;
	}, [nameGroup]);

	useEffect(() => {
		return () => {
			handleSave(nameGroupRef?.current);
		};
	}, []);

	const handelChangeText = (text: string) => {
		setNameGroup(text);
	};
	const dispatch = useAppDispatch();

	const handleSave = async (nameGroup: string) => {
		if (nameGroup && channelLabel !== nameGroup) {
			const updateChannel: ApiUpdateChannelDescRequest = {
				channel_id: dmGroupId || '',
				channel_label: nameGroup || '',
				category_id: '0',
				app_url: ''
			};
			await dispatch(channelsActions.updateChannel(updateChannel));
		}
	};

	return (
		<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10 }}>
			<Text style={styles.headerCustomGroup}>{t('customiseGroup')}</Text>
			<View style={{ paddingVertical: size.s_20, alignItems: 'center' }}>
				<View
					style={{
						width: size.s_60,
						height: size.s_60,
						borderRadius: size.s_50,
						backgroundColor: Colors.orange,
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<Icons.GroupIcon color={baseColor.white} />
				</View>
			</View>
			<Text style={styles.labelInput}>{t('groupName')}</Text>
			<MezonInput value={nameGroup} onTextChange={handelChangeText} />
		</View>
	);
};

export default CustomGroupDm;
