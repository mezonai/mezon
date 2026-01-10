import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { ClanGroup } from '../ClanGroup';
import { style } from './styles';

interface GroupPreviewProps {
	targetItem: any;
	dragItem: any;
	clans: any[];
}

const CLAN = 'clan';
const GROUP = 'group';

export const ClanGroupPreview = memo(({ targetItem, dragItem, clans }: GroupPreviewProps) => {
	const styles = style();

	const previewGroupData = useMemo(() => {
		if (dragItem?.type === CLAN) {
			if (targetItem?.type === GROUP) {
				const existingClanIds = targetItem?.group?.clanIds || [];

				return {
					...targetItem.group,
					clanIds: [...existingClanIds, dragItem?.clan?.clanId]
				};
			} else if (targetItem?.type === CLAN) {
				const dragClanId = dragItem?.clan?.clanId;
				const targetClanId = targetItem?.clan?.clanId;
				return {
					id: `preview-group-${targetClanId}-${dragClanId}`,
					clanIds: [targetClanId, dragClanId],
					isExpanded: false
				};
			}
		}

		return null;
	}, [targetItem, dragItem]);

	if (!previewGroupData) {
		return null;
	}

	return (
		<View style={styles.previewGroupContainer}>
			<ClanGroup group={previewGroupData} onClanPress={undefined} clans={clans} drag={undefined} isActive={false} />
		</View>
	);
});
