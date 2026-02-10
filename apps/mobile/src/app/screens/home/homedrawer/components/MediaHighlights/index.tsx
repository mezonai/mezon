import { useTheme } from '@mezon/mobile-ui';
import {
	channelMediaActions,
	selectChannelMediaByChannelId,
	selectChannelMediaLoadingStatus,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import type { ApiChannelEvent } from 'mezon-js/dist/api';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { styles as createStyles } from './styles';

interface MediaHighlightsProps {
	clanId: string;
	channelId: string;
}

const MediaHighlights: React.FC<MediaHighlightsProps> = ({ clanId, channelId }) => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();

	const events = useAppSelector((state) => selectChannelMediaByChannelId(state, channelId));
	const loadingStatus = useAppSelector(selectChannelMediaLoadingStatus);

	useEffect(() => {
		if (clanId && channelId) {
			dispatch(
				channelMediaActions.fetchChannelMedia({
					clan_id: clanId,
					channel_id: channelId,
					year: new Date().getFullYear(),
					limit: 10
				})
			);
		}
	}, [dispatch, clanId, channelId]);

	const getEventThumbnail = useCallback((event: ApiChannelEvent): string | undefined => {
		const attachment = event.attachments?.[0];
		return attachment?.thumbnail || attachment?.file_url;
	}, []);

	const isVideoEvent = useCallback((event: ApiChannelEvent): boolean => {
		const fileType = event.attachments?.[0]?.file_type || '';
		return fileType.startsWith('video/');
	}, []);

	const mainEvent = useMemo(() => events[0], [events]);
	const sideEvents = useMemo(() => events.slice(1, 3), [events]);

	if (loadingStatus === 'loading' && events.length === 0) {
		return (
			<View style={styles.container}>
				<ActivityIndicator />
			</View>
		);
	}

	const onSeeAllPress = () => {
		navigation.navigate(APP_SCREEN.MEDIA_HIGHLIGHTS_TIMELINE, {
			channelId,
			clanId
		});
	};

	if (!events.length) {
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Icon name="play-box-multiple" size={20} color={themeValue.textStrong} />
					<Text style={styles.headerTitle}>MEDIA & HIGHLIGHTS</Text>
				</View>
				<TouchableOpacity onPress={onSeeAllPress}>
					<Icon name="chevron-right" size={24} color={themeValue.textStrong} />
				</TouchableOpacity>
			</View>

			{/* Media Grid */}
			<View style={styles.mediaGrid}>
				{/* Main Media */}
				{mainEvent && (
					<TouchableOpacity style={styles.mainMedia} onPress={onSeeAllPress} activeOpacity={0.8}>
						{getEventThumbnail(mainEvent) ? (
							<Image source={{ uri: getEventThumbnail(mainEvent) }} style={styles.mainMediaImage} resizeMode="cover" />
						) : null}
						<View style={styles.latestBadge}>
							<Text style={styles.latestBadgeText}>MỚI NHẤT</Text>
						</View>
						{mainEvent.title ? (
							<View style={styles.mainMediaTitleContainer}>
								<Text style={styles.mainMediaTitle}>{mainEvent.title}</Text>
							</View>
						) : null}
					</TouchableOpacity>
				)}

				{/* Side Media */}
				<View style={styles.sideMedia}>
					{sideEvents.map((event, index) => (
						<TouchableOpacity
							key={event.id}
							style={[styles.sideMediaItem, index > 0 && styles.sideMediaItemSpacing]}
							onPress={onSeeAllPress}
							activeOpacity={0.8}
						>
							{getEventThumbnail(event) ? (
								<Image source={{ uri: getEventThumbnail(event) }} style={styles.sideMediaImage} resizeMode="cover" />
							) : null}
							{isVideoEvent(event) && (
								<View style={styles.playIconContainer}>
									<Icon name="play-circle" size={32} color="white" />
								</View>
							)}
						</TouchableOpacity>
					))}
				</View>
			</View>
		</View>
	);
};

export default MediaHighlights;
