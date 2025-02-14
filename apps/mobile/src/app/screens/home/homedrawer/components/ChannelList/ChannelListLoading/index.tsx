import { RootState } from '@mezon/store-mobile';
import React, { memo } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import ChannelListSkeleton from '../../../../../../components/Skeletons/ChannelListSkeleton';

interface IProps {
	isNonChannel: boolean;
}

const ChannelListLoading = ({ isNonChannel }: IProps) => {
	const isLoading = useSelector((state: RootState) => state?.channels?.loadingStatus);

	if (isLoading === 'loading' && !isNonChannel) return <ChannelListSkeleton numberSkeleton={5} />;

	return <View />;
};

export default memo(ChannelListLoading);
