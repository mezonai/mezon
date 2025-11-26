import { useTheme } from '@mezon/mobile-ui';
import type { AttachmentEntity } from '@mezon/store-mobile';
import { selectAllListDocumentByChannel, selectAttachmentsLoadingStatus, selectCurrentLanguage, useAppSelector } from '@mezon/store-mobile';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { formatDateHeader, groupByYearDay, parseAttachmentLikeDate } from '../../utils/groupDataHelper';
import { normalizeString } from '../../utils/helpers';
import { EmptySearchPage } from '../EmptySearchPage';
import ChannelFileItem from './ChannelFileItem';
import ChannelFileSearch from './ChannelFileSearch';
import { style } from './styles';

interface IChannelFilesProps {
	currentChannelId: string;
	isDM: boolean;
}

const ChannelFiles = memo(({ currentChannelId, isDM }: IChannelFilesProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [searchText, setSearchText] = useState('');
	const allAttachments = useAppSelector((state) => selectAllListDocumentByChannel(state, (currentChannelId ?? '') as string));
	const loadingStatus = useAppSelector(selectAttachmentsLoadingStatus);

	const filteredAttachments = useMemo(() => {
		return allAttachments.filter((attachment) => normalizeString(attachment?.filename).includes(normalizeString(searchText)));
	}, [allAttachments, searchText]);

	type SectionByDay = {
		titleDay: string;
		year: string;
		data: AttachmentEntity[];
		key: string;
		isFirstOfYear?: boolean;
	};

	const parseAttachmentDate = useCallback((att: AttachmentEntity): Date => parseAttachmentLikeDate(att), []);

	const currentLanguage = useAppSelector((state) => selectCurrentLanguage(state as any));

	const sections = useMemo<SectionByDay[]>(() => {
		if (!filteredAttachments || filteredAttachments.length === 0) return [];
		const groups = groupByYearDay<AttachmentEntity>(filteredAttachments, parseAttachmentDate);
		return groups.map((g) => {
			const lang = currentLanguage === 'en' ? 'en' : 'vi';
			const title = formatDateHeader(new Date(g.dayTs), lang);
			return {
				key: `${g.year}-${g.dayTs}`,
				year: g.year,
				titleDay: title,
				data: g.items,
				isFirstOfYear: g.isFirstOfYear
			};
		});
	}, [filteredAttachments, parseAttachmentDate, currentLanguage]);

	const renderItem = ({ item }: { item: AttachmentEntity }) => {
		return <ChannelFileItem file={item} isDM={isDM} />;
	};

	const handleSearchChange = (text: string) => {
		setSearchText(text);
	};

	return (
		<View style={styles.rootContainer}>
			<ChannelFileSearch onSearchTextChange={handleSearchChange} />

			<View style={styles.container}>
				{loadingStatus === 'loading' ? (
					<ActivityIndicator size="large" color={themeValue.text} />
				) : loadingStatus === 'error' || !sections?.length ? (
					<EmptySearchPage />
				) : (
					<SectionList
						sections={sections}
						renderItem={renderItem}
						keyExtractor={(item, index) => `attachment_document_${index}_${item?.id}`}
						renderSectionHeader={({ section }) => (
							<View style={styles.sectionHeader}>
								<LinearGradient
									start={{ x: 1, y: 0 }}
									end={{ x: 0, y: 0 }}
									colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
									style={[StyleSheet.absoluteFillObject]}
								/>
								{section.isFirstOfYear && <Text style={styles.sectionYearHeaderTitle}>{section.year}</Text>}
								<Text style={styles.sectionDayHeaderTitle}>{section.titleDay}</Text>
							</View>
						)}
						contentContainerStyle={styles.listContent}
						showsVerticalScrollIndicator={false}
						removeClippedSubviews={true}
						stickySectionHeadersEnabled
						initialNumToRender={24}
						maxToRenderPerBatch={12}
						updateCellsBatchingPeriod={12}
						windowSize={30}
					/>
				)}
			</View>
		</View>
	);
});

export default ChannelFiles;
