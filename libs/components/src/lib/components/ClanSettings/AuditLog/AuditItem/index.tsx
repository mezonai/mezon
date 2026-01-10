import {
	auditLogList,
	selectActionAuditLog,
	selectAllAuditLogData,
	selectChannelById,
	selectCurrentClanId,
	selectMemberClanByUserId,
	selectUserAuditLog,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { convertTimeString, createImgproxyUrl, getAvatarForPrioritize } from '@mezon/utils';
import type { ApiAuditLog } from 'mezon-js/types';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';

interface MainAuditLogProps {
	pageSize: number;
	setPageSize: Dispatch<SetStateAction<number>>;
	currentPage: number;
	setCurrentPage: Dispatch<SetStateAction<number>>;
	selectedDate: string;
}

const MainAuditLog = ({ pageSize, setPageSize, currentPage, setCurrentPage, selectedDate }: MainAuditLogProps) => {
	const { t } = useTranslation('auditLog');
	const auditLogData = useSelector(selectAllAuditLogData);
	const currentClanId = useSelector(selectCurrentClanId);
	const auditLogFilterAction = useSelector(selectActionAuditLog);
	const auditLogFilterUser = useSelector(selectUserAuditLog);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (currentClanId) {
			const body = {
				noCache: true,
				actionLog: auditLogFilterAction ?? '',
				userId: auditLogFilterUser?.userId ?? '',
				clanId: currentClanId,
				dateLog: selectedDate
			};
			dispatch(auditLogList(body));
		}
	}, [selectedDate]);

	return (
		<div className="flex flex-col">
			{auditLogData && auditLogData.length > 0 ? (
				auditLogData.map((log) => <AuditLogItem key={log.id} logItem={log} />)
			) : (
				<div className="flex flex-col items-center justify-center text-center py-10 max-w-[440px] mx-auto">
					<div className="flex flex-col items-center justify-center text-center max-w-[300px]">
						<div className="text-lg font-semibold">{t('emptyAuditLog.noLogsYet')}</div>
						<p className=" mt-2">{t('emptyAuditLog.description')}</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default MainAuditLog;

type AuditLogItemProps = {
	logItem: ApiAuditLog;
};

const AuditLogItem = ({ logItem }: AuditLogItemProps) => {
	const auditLogTime = convertTimeString(logItem?.timeLog as string);
	const userAuditLogItem = useAppSelector((state) => selectMemberClanByUserId(state, logItem?.userId ?? ''));
	const username = userAuditLogItem?.user?.username;
	const avatar = getAvatarForPrioritize(userAuditLogItem?.clanAvatar, userAuditLogItem?.user?.avatarUrl);
	const channel = useAppSelector((state) => selectChannelById(state, logItem?.channelId || ''));

	return (
		<div className=" p-[10px] flex gap-3 items-center border  rounded-md  mb-4 text-theme-primary border-theme-primary bg-item-theme ">
			<div className="w-10 h-10 rounded-full">
				<div className="w-10 h-10">
					{userAuditLogItem ? (
						<AvatarImage
							alt={username || ''}
							username={username}
							className="min-w-10 min-h-10 max-w-10 max-h-10"
							srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
							src={avatar}
						/>
					) : (
						<Icons.AvatarUser />
					)}
				</div>
			</div>
			<div>
				<div className="">
					{logItem?.channelId !== '0' ? (
						<span>
							<span>{username}</span> <span className="lowercase">{logItem?.actionLog}</span> :{' '}
							<strong className="text-theme-primary-active font-medium"> {`${logItem?.entityName} (${logItem?.entityId})`}</strong> in{' '}
							{channel?.parentId !== '0' ? 'thread' : 'channel'}
							<strong className="text-theme-primary-active font-medium">{` ${logItem?.channelLabel} (${logItem?.channelId})`}</strong>
						</span>
					) : (
						<span>
							<span>{username}</span> <span className="lowercase">{logItem?.actionLog}</span> :{' '}
							<strong className="text-theme-primary-active font-medium">{`${logItem?.entityName} (${logItem?.entityId})`}</strong>
						</span>
					)}
				</div>
				<div className="text-sm text-theme-primary">{auditLogTime}</div>
			</div>
		</div>
	);
};
