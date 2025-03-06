import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, selectUpdateToken } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Grid } from 'react-native-animated-spinkit';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import RNQRGenerator from 'rn-qr-generator';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { style } from './styles';

export const MyQRCode = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userProfile = useSelector(selectAllAccount);
	const [urlQRCode, setUrlQRCode] = useState<string>('');
	const isTabletLandscape = useTabletLandscape();

	const tokenInWallet = useMemo(() => {
		return userProfile?.wallet ? safeJSONParse(userProfile?.wallet || '{}')?.value : 0;
	}, [userProfile?.wallet]);
	const getTokenSocket = useSelector(selectUpdateToken(userProfile?.user?.id ?? ''));

	const genQRCode = useCallback(async () => {
		const data = {
			receiver_name: userProfile?.user?.username,
			receiver_id: userProfile?.user?.id
		};
		const res = await RNQRGenerator.generate({
			value: JSON.stringify(data)?.toString(),
			height: Number(size.s_100 * 2.5),
			width: Number(size.s_100 * 2.5),
			correctionLevel: 'L'
		});

		setUrlQRCode(res?.uri);
	}, [userProfile?.user?.id, userProfile?.user?.username]);

	useEffect(() => {
		genQRCode();
	}, [genQRCode]);

	return (
		<LinearGradient start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} colors={[themeValue.primary, themeValue.secondaryLight]} style={styles.card}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					paddingBottom: size.s_14,
					gap: size.s_14,
					borderBottomColor: themeValue.border,
					borderBottomWidth: 1
				}}
			>
				<FastImage
					source={{
						uri: createImgproxyUrl(userProfile?.user?.avatar_url ?? '', { width: 200, height: 200, resizeType: 'fit' })
					}}
					style={styles.avatar}
				/>
				<View>
					<Text style={styles.nameProfile}>{userProfile?.user?.display_name || userProfile?.user?.username}</Text>
					<Text style={styles.tokenProfile}>Balance: {Number(tokenInWallet) + Number(getTokenSocket)}</Text>
				</View>
			</View>
			{urlQRCode ? (
				isTabletLandscape ? (
					<View
						style={{
							height: size.s_100 * 3.6,
							width: size.s_100 * 3.6,
							backgroundColor: 'white',
							alignSelf: 'center',
							justifyContent: 'center',
							marginVertical: size.s_40
						}}
					>
						<FastImage source={{ uri: urlQRCode }} style={styles.imageQR} />
					</View>
				) : (
					<FastImage source={{ uri: urlQRCode }} style={styles.imageQR} />
				)
			) : (
				<View style={{ height: size.s_100 * 2.5, alignItems: 'center', justifyContent: 'center' }}>
					<Grid color={themeValue.text} size={size.s_50} />
				</View>
			)}
			<View
				style={{
					height: size.s_50
				}}
			/>
		</LinearGradient>
	);
};
