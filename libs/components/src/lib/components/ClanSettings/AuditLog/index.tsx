import { selectActionAuditLog, selectUserAuditLog } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ActionLog, UserAuditLog } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import SearchActionAuditLogModal from '../../SearchActionAuditLog';
import SearchMembersAuditLogModal from '../../SearchMembersAuditLog';
import MainAuditLog from './AuditItem';

import React from 'react';

type AuditLogProps = {
	currentClanId: string;
};

const AuditLog = ({ currentClanId }: AuditLogProps) => {
	const { t } = useTranslation('auditLogSearch');
	const actionFilter = useSelector(selectActionAuditLog);
	const userFilter = useSelector(selectUserAuditLog);
	const [isShowSearchActionModal, setIsShowSearchActionModal] = useState(false);
	const [isShowSearchMemberModal, setIsShowSearchMemberModal] = useState(false);
	const actionModalRef = useRef<HTMLDivElement | null>(null);
	const memberModalRef = useRef<HTMLDivElement | null>(null);
	const [pageSize, setPageSize] = useState(10);
	const [currentPage, setCurrentPage] = useState(1);

	const getTranslatedActionName = (actionKey: ActionLog | string): string => {
		if (!actionKey || actionKey === ActionLog.ALL_ACTION_AUDIT) {
			return t('actions.allActions');
		}

		const actionMap: { [key in ActionLog]: string } = {
			[ActionLog.ALL_ACTION_AUDIT]: t('actions.allActions'),
			[ActionLog.UPDATE_CLAN_ACTION_AUDIT]: t('actions.updateClan'),
			[ActionLog.CREATE_CHANNEL_ACTION_AUDIT]: t('actions.createChannel'),
			[ActionLog.UPDATE_CHANNEL_ACTION_AUDIT]: t('actions.updateChannel'),
			[ActionLog.UPDATE_CHANNEL_PRIVATE_ACTION_AUDIT]: t('actions.updateChannelPrivate'),
			[ActionLog.DELETE_CHANNE_ACTION_AUDIT]: t('actions.deleteChannel'),
			[ActionLog.CREATE_CHANNEL_PERMISSION_ACTION_AUDIT]: t('actions.createChannelPermission'),
			[ActionLog.UPDATE_CHANNEL_PERMISSION_ACTION_AUDIT]: t('actions.updateChannelPermission'),
			[ActionLog.DELETE_CHANNEL_PERMISSION_ACTION_AUDIT]: t('actions.deleteChannelPermission'),
			[ActionLog.KICK_MEMBER_ACTION_AUDIT]: t('actions.kickMember'),
			[ActionLog.PRUNE_MEMBER_ACTION_AUDIT]: t('actions.pruneMember'),
			[ActionLog.BAN_MEMBER_ACTION_AUDIT]: t('actions.banMember'),
			[ActionLog.UNBAN_MEMBER_ACTION_AUDIT]: t('actions.unbanMember'),
			[ActionLog.UPDATE_MEMBER_ACTION_AUDIT]: t('actions.updateMember'),
			[ActionLog.UPDATE_ROLES_MEMBER_ACTION_AUDIT]: t('actions.updateRolesMember'),
			[ActionLog.MOVE_MEMBER_ACTION_AUDIT]: t('actions.moveMember'),
			[ActionLog.DISCONNECT_MEMBER_ACTION_AUDIT]: t('actions.disconnectMember'),
			[ActionLog.ADD_BOT_ACTION_AUDIT]: t('actions.addBot'),
			[ActionLog.CREATE_THREAD_ACTION_AUDIT]: t('actions.createThread'),
			[ActionLog.UPDATE_THREAD_ACTION_AUDIT]: t('actions.updateThread'),
			[ActionLog.DELETE_THREAD_ACTION_AUDIT]: t('actions.deleteThread'),
			[ActionLog.CREATE_ROLE_ACTION_AUDIT]: t('actions.createRole'),
			[ActionLog.UPDATE_ROLE_ACTION_AUDIT]: t('actions.updateRole'),
			[ActionLog.DELETE_ROLE_ACTION_AUDIT]: t('actions.deleteRole'),
			[ActionLog.CREATE_WEBHOOK_ACTION_AUDIT]: t('actions.createWebhook'),
			[ActionLog.UPDATE_WEBHOOK_ACTION_AUDIT]: t('actions.updateWebhook'),
			[ActionLog.DELETE_WEBHOOK_ACTION_AUDIT]: t('actions.deleteWebhook'),
			[ActionLog.CREATE_EMOJI_ACTION_AUDIT]: t('actions.createEmoji'),
			[ActionLog.UPDATE_EMOJI_ACTION_AUDIT]: t('actions.updateEmoji'),
			[ActionLog.DELETE_EMOJI_ACTION_AUDIT]: t('actions.deleteEmoji'),
			[ActionLog.CREATE_STICKER_ACTION_AUDIT]: t('actions.createSticker'),
			[ActionLog.UPDATE_STICKER_ACTION_AUDIT]: t('actions.updateSticker'),
			[ActionLog.DELETE_STICKER_ACTION_AUDIT]: t('actions.deleteSticker'),
			[ActionLog.CREATE_EVENT_ACTION_AUDIT]: t('actions.createEvent'),
			[ActionLog.UPDATE_EVENT_ACTION_AUDIT]: t('actions.updateEvent'),
			[ActionLog.DELETE_EVENT_ACTION_AUDIT]: t('actions.deleteEvent'),
			[ActionLog.CREATE_CANVAS_ACTION_AUDIT]: t('actions.createCanvas'),
			[ActionLog.UPDATE_CANVAS_ACTION_AUDIT]: t('actions.updateCanvas'),
			[ActionLog.DELETE_CANVAS_ACTION_AUDIT]: t('actions.deleteCanvas'),
			[ActionLog.CREATE_CATEGORY_ACTION_AUDIT]: t('actions.createCategory'),
			[ActionLog.UPDATE_CATEGORY_ACTION_AUDIT]: t('actions.updateCategory'),
			[ActionLog.DELETE_CATEGORY_ACTION_AUDIT]: t('actions.deleteCategory'),
			[ActionLog.ADD_MEMBER_CHANNEL_ACTION_AUDIT]: t('actions.addMemberChannel'),
			[ActionLog.REMOVE_MEMBER_CHANNEL_ACTION_AUDIT]: t('actions.removeMemberChannel'),
			[ActionLog.ADD_ROLE_CHANNEL_ACTION_AUDIT]: t('actions.addRoleChannel'),
			[ActionLog.REMOVE_ROLE_CHANNEL_ACTION_AUDIT]: t('actions.removeRoleChannel'),
			[ActionLog.ADD_MEMBER_THREAD_ACTION_AUDIT]: t('actions.addMemberThread'),
			[ActionLog.REMOVE_MEMBER_THREAD_ACTION_AUDIT]: t('actions.removeMemberThread'),
			[ActionLog.ADD_ROLE_THREAD_ACTION_AUDIT]: t('actions.addRoleThread'),
			[ActionLog.REMOVE_ROLE_THREAD_ACTION_AUDIT]: t('actions.removeRoleThread')
		};

		return actionMap[actionKey as ActionLog] || actionKey;
	};

	const formatDate = (date: Date) => {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	};

	const today = new Date();
	const maxDate = today.toISOString().split('T')[0];
	const [selectedDate, setSelectedDate] = useState<string>(formatDate(today));

	const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const formattedDate = formatDate(new Date(event.target.value));
		setSelectedDate(formattedDate);
	};

	const handleSearchActionClick = useCallback(() => {
		setIsShowSearchActionModal((prev) => !prev);
		if (isShowSearchMemberModal) setIsShowSearchMemberModal(false);
	}, [isShowSearchMemberModal]);

	const handleSearchMemberClick = useCallback(() => {
		setIsShowSearchMemberModal((prev) => !prev);
		if (isShowSearchActionModal) setIsShowSearchActionModal(false);
	}, [isShowSearchActionModal]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (actionModalRef.current && !actionModalRef.current.contains(event.target as Node)) {
				setIsShowSearchActionModal(false);
			}
			if (memberModalRef.current && !memberModalRef.current.contains(event.target as Node)) {
				setIsShowSearchMemberModal(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const closeModal = useCallback(() => {
		setIsShowSearchActionModal(false);
		setIsShowSearchMemberModal(false);
	}, []);

	return (
		<div className=" overflow-hidden ">
			<div className="text-xl font-semibold mb-5 text-theme-primary-active sbm:mt-[60px] mt-[10px]">
				<h2 className="text-xl text-theme-primary-active font-semibold flex">
					<div>{t('title')}</div>
				</h2>
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
					<div className="relative">
						<div onClick={handleSearchMemberClick} className="flex items-center gap-3 w-full text-[13px] line-clamp-1 break-all">
							<div className="max-sm:hidden">{t('filterByUser')}</div>
							<div className="flex items-center gap-1 cursor-pointer bg-input-theme border border-theme-primary rounded-lg px-3 py-2 sm:px-0 sm:py-0 sm:bg-transparent sm:border-0">
								<div className="sm:hidden text-sm font-medium">{t('filterByUser')}:</div>
								<div className="one-line">
									{userFilter && userFilter.username !== UserAuditLog.ALL_USER_AUDIT ? userFilter.username : t('all')}
								</div>
								<Icons.ArrowDown />
							</div>
						</div>
						{isShowSearchMemberModal && (
							<div ref={memberModalRef}>
								<SearchMembersAuditLogModal
									currentClanId={currentClanId}
									actionFilter={actionFilter}
									userFilter={userFilter}
									closeModal={closeModal}
									pageSize={pageSize}
									currentPage={currentPage}
									selectedDate={selectedDate}
								/>
							</div>
						)}
					</div>
					<div className="relative">
						<div onClick={handleSearchActionClick} className="flex items-center gap-3 w-full text-[13px] line-clamp-1 break-all">
							<div className="max-sm:hidden">{t('filterByAction')}</div>
							<div className="flex items-center gap-1 cursor-pointer bg-input-theme border border-theme-primary rounded-lg px-3 py-2 sm:px-0 sm:py-0 sm:bg-transparent sm:border-0">
								<div className="sm:hidden text-sm font-medium">{t('filterByAction')}:</div>
								<div className="one-line">{getTranslatedActionName(actionFilter)}</div>
								<Icons.ArrowDown />
							</div>
						</div>
						{isShowSearchActionModal && (
							<div ref={actionModalRef}>
								<SearchActionAuditLogModal
									key={actionFilter}
									currentClanId={currentClanId}
									actionFilter={actionFilter}
									closeModal={closeModal}
									pageSize={pageSize}
									currentPage={currentPage}
									selectedDate={selectedDate}
								/>
							</div>
						)}
					</div>

					<div className="relative">
						<input
							type="date"
							value={selectedDate.split('-').reverse().join('-')}
							onChange={handleDateChange}
							max={maxDate}
							className="w-full sm:w-auto bg-input-theme focus:outline-none focus:ring-0 border-theme-primary rounded-lg p-2 sm:p-2 transition ease-in-out duration-200"
						/>
					</div>
				</div>
			</div>
			<div className="border-b-theme-primary my-[32px]" />

			<div className="overflow-y-auto max-h-[calc(100vh-160px)] mt-4 thread-scroll">
				<MainAuditLog
					pageSize={pageSize}
					setPageSize={setPageSize}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					selectedDate={selectedDate}
				/>
			</div>
		</div>
	);
};

export default AuditLog;
