import { useGifs, useGifsStickersEmoji } from '@mezon/core';
import { baseColor } from '@mezon/mobile-ui';
import { Text, TouchableOpacity, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import FastImage from 'react-native-fast-image';
import styles from './styles';

interface GifCategoryProps {
	loading?: boolean;
	data: any;
}
export default function GifCategory({ loading, data }: GifCategoryProps) {
	const { fetchGifsDataSearch } = useGifs();
	const { setValueInputSearch } = useGifsStickersEmoji();

	function handlePressCategory(query: string) {
		fetchGifsDataSearch(query);
		setValueInputSearch(query);
	}

	if (loading) {
		return (
			<View style={styles.containerLoading}>
				<Flow color={baseColor.purple} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{!!data?.length &&
				data?.map?.((item, index) => (
					<TouchableOpacity onPress={() => handlePressCategory(item.searchterm)} style={styles.content} key={index.toString()}>
						<FastImage source={{ uri: item.image }} style={styles.fastImage} />
						<View style={styles.textWrapper}>
							<Text style={styles.textTitle}>{item.name}</Text>
						</View>
					</TouchableOpacity>
				))}
		</View>
	);
}
