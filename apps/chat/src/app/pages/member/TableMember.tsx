import type { IUsersClan } from '@mezon/utils';
import { getTimeDifferenceDate } from '@mezon/utils';
import React, { useMemo } from 'react';
import TableMemberHeader from './TableMemberHeader';
import TableMemberItem from './TableMemberItem';

interface ITableMemberProps {
	currentPage: number;
	pageSize: number;
	dataMember: IUsersClan[];
}

const TableMember: React.FC<ITableMemberProps> = ({ currentPage, pageSize, dataMember }) => {
	const displayUsersClan = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		const end = Math.min(start + pageSize, dataMember.length);
		return dataMember.slice(start, end);
	}, [currentPage, pageSize, dataMember]);

	return (
		<div className="flex flex-col gap-2 flex-1 min-h-[48px]">
			<TableMemberHeader />
			<div className="flex flex-col overflow-y-auto px-4 py-2 border-b-theme-primary">
				{displayUsersClan.map((user) => (
					<TableMemberItem
						key={user.id}
						username={user.user?.username ?? ''}
						avatar={user.clan_avatar || user.user?.avatar_url || ''}
						mezonJoinTime={getTimeDifferenceDate((user.user?.create_time_seconds || 0) * 1000 || '')}
						clanJoinTime={new Date(
							((user.user as { join_time_seconds?: number; join_time?: string })?.join_time_seconds ??
								(user.user?.join_time ? new Date(user.user.join_time).getTime() / 1000 : 0)) * 1000
						).toISOString()}
						userId={user.id}
						displayName={user.prioritizeName!}
					/>
				))}
			</div>
		</div>
	);
};

export default TableMember;
