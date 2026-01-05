import { STORAGE_AGE_RESTRICTED_CHANNEL_IDS, load } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectAllAccount, selectCurrentChannel } from '@mezon/store-mobile';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import AgeRestricted from './AgeRestricted';
import AgeRestrictedForm from './AgeRestrictedForm';
import { style } from './styles';

const AgeRestrictedModal = () => {
	const [isShowAgeRestricted, setIsShowAgeRestricted] = useState(false);
	const currentChannel = useSelector(selectCurrentChannel);
	const userProfile = useSelector(selectAllAccount);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	useEffect(() => {
		const savedChannelIds = load(STORAGE_AGE_RESTRICTED_CHANNEL_IDS) || [];
		if (!savedChannelIds?.includes(currentChannel?.channelId) && (currentChannel as ChannelsEntity)?.age_restricted === 1) {
			setIsShowAgeRestricted(true);
		} else {
			setIsShowAgeRestricted(false);
		}
	}, [currentChannel]);

	const closeBackdrop = () => {
		setIsShowAgeRestricted(false);
	};
	if (!isShowAgeRestricted) return <View></View>;

	return (
		<View style={styles.modalOverlay}>
			{userProfile?.user?.dob === '0001-01-01T00:00:00Z' ? (
				<AgeRestrictedForm onClose={closeBackdrop} />
			) : (
				<AgeRestricted onClose={closeBackdrop} />
			)}
		</View>
	);
};

export default React.memo(AgeRestrictedModal);
