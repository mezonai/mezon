import { ActionEmitEvent } from '@mezon/mobile-components';
import { sleep } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { RenderItemInfo } from 'react-native-awesome-gallery';
import FastImage from 'react-native-fast-image';
import Entypo from 'react-native-vector-icons/Entypo';
import { useVideoThumbnail } from '../../hooks/useVideoThumbnail';
import { RenderVideoDetail } from '../../screens/home/homedrawer/components/RenderVideoDetail';
import { isVideo } from '../../utils/helpers';
import { style } from './styles';

export const ItemImageModal = React.memo(
	({ item, setImageDimensions }: RenderItemInfo<ApiMessageAttachment>) => {
		const [dims, setDims] = useState(Dimensions.get('screen'));
		const [ready, setReady] = useState(true);
		const [isLoading, setIsLoading] = useState(false);
		const isVideoItem = isVideo(item?.url || '');
		const thumbnail = useVideoThumbnail(item?.url || '', item?.thumbnail, isVideoItem);
		const styles = style();

		useEffect(() => {
			const sub = Dimensions.addEventListener('change', async ({ screen }) => {
				setReady(false);
				setDims(screen);
				await sleep(100);
				setReady(true);
			});
			return () => sub.remove();
		}, [item?.url]);

		const onPlayVideo = () => {
			const data = {
				children: <RenderVideoDetail route={{ params: { videoURL: item?.url } }} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		};

		if (!ready) {
			return <View />;
		}

		if (isVideoItem) {
			return (
				<View style={{ width: dims.width, height: dims.height, justifyContent: 'center', alignItems: 'center' }}>
					<TouchableOpacity onPress={onPlayVideo} activeOpacity={0.9}>
						<FastImage source={{ uri: thumbnail || item?.url }} style={{ width: dims.width, height: dims.height }} resizeMode="contain" />
						<View style={styles.wrapperButtonPlay}>
							<View style={styles.buttonPlay}>
								<Entypo name="controller-play" size={30} color="#FFF" style={{ marginLeft: 4 }} />
							</View>
						</View>
					</TouchableOpacity>
				</View>
			);
		}

		return (
			<View style={styles.container}>
				<FastImage
					source={{ uri: item?.url }}
					style={[StyleSheet.absoluteFillObject, { width: dims.width, height: dims.height }]}
					resizeMode="contain"
					onLoadEnd={() => {
						setIsLoading(true);
					}}
					onLoad={(event) => {
						const { width = dims.width, height = dims.height } = event.nativeEvent;
						const widthResult = width < dims.width ? width : dims.width;
						const heightResult = height < dims.height ? height : dims.height;
						setImageDimensions({ width: widthResult, height: heightResult });
					}}
				/>
				{!isLoading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator color={'white'} size={'large'} />
					</View>
				)}
			</View>
		);
	},
	(prev, next) => prev.item?.url === next.item?.url
);
