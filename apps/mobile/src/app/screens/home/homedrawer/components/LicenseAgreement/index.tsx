import { STORAGE_AGREED_POLICY, load, save } from '@mezon/mobile-components';
import { setTimeout } from '@testing-library/react-native/build/helpers/timers';
import React, { useEffect, useState } from 'react';
import { Linking, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { styles } from './styles';

const LicenseAgreement = () => {
	const [isShowLicenseAgreement, setIsShowLicenseAgreement] = useState<boolean>(false);
	const isTabletLandscape = useTabletLandscape();

	const checkShowLicenseAgreement = async () => {
		const isAgreed = await load(STORAGE_AGREED_POLICY);

		setIsShowLicenseAgreement(Platform.OS === 'ios' && isAgreed?.toString() !== 'true');
	};

	useEffect(() => {
		const timeout = setTimeout(() => {
			checkShowLicenseAgreement();
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, []);

	const onClose = () => {
		setIsShowLicenseAgreement(false);
		save(STORAGE_AGREED_POLICY, 'true');
	};

	return (
		<Modal visible={isShowLicenseAgreement} transparent={true} supportedOrientations={['portrait', 'landscape']}>
			<View style={styles.wrapper}>
				<View style={[styles.sheetContainer, isTabletLandscape && styles.sheetContainerTablet]}>
					<View style={styles.headerModal}>
						<Text style={styles.headerText}>License Agreement</Text>
						<View style={styles.spacer}></View>
					</View>
					<ScrollView style={styles.content}>
						<Text style={styles.header}>1. License Grant and Restrictions</Text>
						<Text style={styles.text}>
							Subject to your compliance with this Agreement, Mezon grants you a limited, non-exclusive, non-transferable license to use
							the Mezon application. You may not:
						</Text>
						<Text style={styles.bulletPoint}>- Reverse engineer, decompile, or disassemble the app.</Text>
						<Text style={styles.bulletPoint}>- Modify or create derivative works based on the app.</Text>
						<Text style={styles.bulletPoint}>- Rent, lease, lend, sell, redistribute, or sublicense the app.</Text>

						<Text style={styles.header}>2. Termination</Text>
						<Text style={styles.text}>
							This license is effective until terminated by you or Mezon. Your rights under this license will terminate automatically
							without notice if you fail to comply with any terms of this Agreement. Upon termination, you shall cease all use of the
							app and destroy all copies, full or partial, of the app.
						</Text>

						<Text style={styles.header}>3. No Tolerance for Objectionable Content or Abusive Users</Text>
						<Text style={styles.text}>
							Mezon has a zero-tolerance policy for objectionable content or abusive users. Any user found to be engaging in such
							behavior will be banned from using the app and may be reported to the appropriate authorities.
						</Text>

						<Text style={styles.header}>4. No Warranty</Text>
						<Text style={styles.text}>
							You expressly acknowledge and agree that use of the app is at your sole risk and that the entire risk as to satisfactory
							quality, performance, accuracy, and effort is with you. To the maximum extent permitted by applicable law, the app is
							provided "as is" and "as available," with all faults and without warranty of any kind.
						</Text>

						<Text style={styles.header}>5. Governing Law</Text>
						<Text style={styles.text}>
							This Agreement shall be governed by and construed in accordance with the laws of [Your Country], excluding its conflicts
							of law rules.
						</Text>

						<Text style={styles.header}>6. Contact Information</Text>
						<TouchableOpacity onPress={() => Linking.openURL('https://mezon.ai')}>
							<Text style={styles.text}>
								If you have any questions about this Agreement, please contact us at <Text style={styles.link}>https://mezon.ai</Text>
							</Text>
						</TouchableOpacity>
					</ScrollView>

					<TouchableOpacity style={styles.btn} onPress={onClose}>
						<Text style={styles.btnText}>Yes, Agree</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

export default LicenseAgreement;
