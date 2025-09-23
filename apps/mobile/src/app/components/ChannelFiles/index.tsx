import { useTheme } from '@mezon/mobile-ui';
import type { AttachmentEntity } from '@mezon/store-mobile';
import { selectAllListDocumentByChannel, selectCurrentLanguage, useAppSelector } from '@mezon/store-mobile';
import { memo, useCallback, useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { formatDateHeader, groupByYearDay, parseAttachmentLikeDate } from '../../utils/groupDataHelper';
import { normalizeString } from '../../utils/helpers';
import ChannelFileItem from './ChannelFileItem';
import ChannelFileSearch from './ChannelFileSearch';
import { style } from './styles';

const ChannelFiles = memo(({ currentChannelId }: { currentChannelId: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [searchText, setSearchText] = useState('');
	const allAttachments = useAppSelector((state) => selectAllListDocumentByChannel(state, (currentChannelId ?? '') as string));

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
		return <ChannelFileItem file={item} />;
	};

	const handleSearchChange = (text: string) => {
		setSearchText(text);
	};

	return (
		<View style={{ flex: 1 }}>
			<ChannelFileSearch onSearchTextChange={handleSearchChange} />

			<View style={styles.container}>
				<SectionList
					sections={sections}
					renderItem={renderItem}
					keyExtractor={(item, index) => `attachment_document_${index}_${item?.id}`}
					renderSectionHeader={({ section }) => (
						<View style={styles.sectionHeader}>
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
			</View>
		</View>
	);
});

export default ChannelFiles;
