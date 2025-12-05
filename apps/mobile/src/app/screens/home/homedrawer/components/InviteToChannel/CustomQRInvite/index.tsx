import { size } from '@mezon/mobile-ui';
import { forwardRef, memo, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import ViewShot from 'react-native-view-shot';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from './styles';

interface CustomQRInviteProps {
	qrCodeUri: string;
	clanLogo: string;
	clanName: string;
}

export interface CustomQRInviteRef {
	capture: () => Promise<string | null>;
}

const CustomQRInvite = forwardRef<CustomQRInviteRef, CustomQRInviteProps>(({ qrCodeUri, clanLogo, clanName }, ref) => {
	const viewShotRef = useRef<ViewShot>(null);
	const styles = style();

	useImperativeHandle(
		ref,
		() => ({
			capture: async () => {
				try {
					const uri = await viewShotRef.current?.capture();
					return uri ?? null;
				} catch (error) {
					console.error('Error capturing QR code:', error);
					return null;
				}
			}
		}),
		[]
	);

	return (
		<ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.container}>
			<View style={styles.header}>
				<MezonIconCDN icon={IconCDN.logoMezon} width={size.s_28} height={size.s_28} useOriginalColor />
				<Text style={styles.headerText}>Mezon</Text>
			</View>

			<View style={styles.qrWrapper}>
				<FastImage source={{ uri: qrCodeUri }} style={styles.qrCode} resizeMode={FastImage.resizeMode.contain} />
				<View style={styles.logoOverlay}>
					{clanLogo ? (
						<FastImage source={{ uri: clanLogo }} style={styles.clanLogo} resizeMode={FastImage.resizeMode.cover} />
					) : (
						<View style={styles.clanLogoFallback}>
							<Text style={styles.fallbackText}>{clanName?.charAt(0)?.toUpperCase() || ''}</Text>
						</View>
					)}
				</View>
			</View>

			<View style={styles.divider} />
			<Text style={styles.footer}>Powered by Mezon</Text>
		</ViewShot>
	);
});

export default memo(CustomQRInvite);
