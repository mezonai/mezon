import { useTheme } from '@mezon/mobile-ui';
import { referencesActions, useAppDispatch } from '@mezon/store-mobile';
import { isFacebookLink, isTikTokLink, isYouTubeLink, processText, type IMarkdownOnMessage } from '@mezon/utils';
import debounce from 'lodash/debounce';
import { safeJSONParse } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ImageNative from '../../../../..//components/ImageNative';
import { IconCDN } from '../../../../..//constants/icon_cdn';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { NativeHttpClient } from '../../../../../utils/NativeHttpClient';
import { isGoogleMapLink } from '../../../../../utils/helpers';
import { style } from './styles';

type RenderOgpPreviewProps = {
	contentText?: string;
};

export type OgpElemnent = {
	title: string;
	description?: string;
	image?: string;
};

const MEZONAI_PATTERN = /^https:\/\/mezon\.ai\/(chat|invite)(\/|$)/i;

const OgpPreview = ({ contentText }: RenderOgpPreviewProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const [ogpItem, setOgpItem] = useState<OgpElemnent>();
	const ogpLinkRef = useRef<string>('');
	const dispatch = useAppDispatch();

	const { links: linkInContent } = processText(contentText || '');

	const fetchOgp = useCallback(async (links: IMarkdownOnMessage[], text: string) => {
		const getOGPFromLinks = async (markdowns: IMarkdownOnMessage[], contentText: string) => {
			try {
				for (const markdown of markdowns) {
					const link = contentText?.slice(markdown.s, markdown.e);
					if (
						!MEZONAI_PATTERN.test(link) &&
						!isYouTubeLink(link) &&
						!isTikTokLink(link) &&
						!isFacebookLink(link) &&
						!isGoogleMapLink(link)
					) {
						const datafetch = await NativeHttpClient.post(
							`${process.env.NX_OGP_URL}`,
							JSON.stringify({
								url: link
							}),
							{ 'Content-Type': 'application/json' }
						);
						const jsonData = safeJSONParse(datafetch?.body);
						if (jsonData?.title && jsonData?.image) {
							const data = { data: jsonData, index: markdown.s };
							return data;
						}
					}
				}
			} catch (e) {
				console.error('log  => getOGPFromLinks error', e);
			}

			return null;
		};

		if (!links?.length) {
			setOgpItem(undefined);
			referencesActions.setOgpData(null);
			ogpLinkRef.current = '';
			return;
		}
		if (text?.includes(ogpLinkRef.current) && ogpLinkRef.current) {
			return;
		}
		if (links?.length) {
			const dataOgp = await getOGPFromLinks(links, text || '');
			setOgpItem(dataOgp?.data);
			if (dataOgp?.data?.title && dataOgp?.data?.image && dataOgp?.data?.description) {
				dispatch(
					referencesActions.setOgpData({
						url: dataOgp?.data?.key,
						image: dataOgp?.data?.image || '',
						title: dataOgp?.data?.title || '',
						description: dataOgp?.data?.description || '',
						type: dataOgp?.data?.type || '',
						index: 0,
						channel_id: ''
					})
				);
			}

			ogpLinkRef.current = dataOgp?.data?.key;
		}
	}, []);

	const debouncedFetchOgp = useMemo(() => debounce(fetchOgp, 300), [fetchOgp]);

	const clearOgpData = () => {
		setOgpItem(undefined);
		dispatch(referencesActions.setOgpData(null));
	};

	useEffect(() => {
		debouncedFetchOgp(linkInContent, contentText || '');

		return () => {
			debouncedFetchOgp.cancel();
		};
	}, [contentText, linkInContent, debouncedFetchOgp]);

	useEffect(() => {
		ogpLinkRef.current = '';
		return () => {
			ogpLinkRef.current = '';
			dispatch(referencesActions.setOgpData(null));
		};
	}, []);

	if (!ogpItem) return null;

	return (
		<View style={styles.container}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.secondary, themeValue.secondaryLight]}
				style={[StyleSheet.absoluteFill]}
			/>
			{!!ogpItem?.image && <ImageNative url={ogpItem.image} style={styles.image} resizeMode="cover" />}
			<View style={{ flexShrink: 1 }}>
				<TouchableOpacity>
					<Text style={styles.title} numberOfLines={1}>
						{ogpItem?.title}
					</Text>
				</TouchableOpacity>
				<Text style={styles.description} numberOfLines={2}>
					{ogpItem?.description}
				</Text>
			</View>
			<TouchableOpacity onPress={clearOgpData}>
				<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.text} />
			</TouchableOpacity>
		</View>
	);
};

export default OgpPreview;
