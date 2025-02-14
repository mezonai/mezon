import { size } from '@mezon/mobile-ui';
import { selectAllClans } from '@mezon/store';
import { RootState } from '@mezon/store-mobile';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Images from '../../../../../assets/Images';
import CreateClanModal from '../components/CreateClanModal';
import JoinClanModal from '../components/JoinClanModal';
import { styles } from './UserEmptyClan.styles';

const UserEmptyClan = () => {
	const clans = useSelector(selectAllClans);
	const clansLoadingStatus = useSelector((state: RootState) => state?.clans?.loadingStatus);
	const [isVisibleCreateClanModal, setIsVisibleCreateClanModal] = useState<boolean>(false);
	const [isVisibleJoinClanModal, setIsVisibleJoinClanModal] = useState<boolean>(false);
	const { t } = useTranslation('userEmptyClan');

	if (clansLoadingStatus === 'loaded' && !clans?.length) {
		return (
			<View style={styles.wrapper}>
				<Text style={styles.headerText}>{t('emptyClans.clans')}</Text>
				<Image style={styles.imageBg} source={Images.CHAT_PANA} />
				<View>
					<Text style={styles.title}>{t('emptyClans.readyChat')}</Text>
					<Text style={styles.description}>{t('emptyClans.buildYourCommunity')}</Text>
				</View>
				<View
					style={{
						marginTop: size.s_20
					}}
				>
					<TouchableOpacity onPress={() => setIsVisibleJoinClanModal(!isVisibleJoinClanModal)} style={styles.joinClan}>
						<Text style={styles.textJoinClan}>{t('emptyClans.joinClan')}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setIsVisibleCreateClanModal(!isVisibleCreateClanModal)} style={styles.createClan}>
						<Text style={styles.textCreateClan}>{t('emptyClans.createClan')}</Text>
					</TouchableOpacity>
				</View>
				<CreateClanModal visible={isVisibleCreateClanModal} setVisible={(value) => setIsVisibleCreateClanModal(value)} />
				<JoinClanModal visible={isVisibleJoinClanModal} setVisible={(value) => setIsVisibleJoinClanModal(value)} />
			</View>
		);
	}

	return null;
};

export default UserEmptyClan;
