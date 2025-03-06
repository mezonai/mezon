import { ApiMessageAttachment } from 'mezon-js/api.gen';
import React from 'react';
import { StyleSheet } from 'react-native';
import { RenderItemInfo } from 'react-native-awesome-gallery';
import ImageNative from '../ImageNative';

export const ItemImageModal = React.memo(({ item, setImageDimensions }: RenderItemInfo<ApiMessageAttachment>) => {
	return <ImageNative url={item?.url} style={StyleSheet.absoluteFillObject} resizeMode="contain" />;
});
