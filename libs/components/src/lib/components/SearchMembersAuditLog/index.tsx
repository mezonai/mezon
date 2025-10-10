import {
	auditLogFilterActions,
	auditLogList,
	selectAllUserClans,
	selectMemberClanByUserId,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IUserAuditLog, UsersClanEntity } from '@mezon/utils';
import { createImgproxyUrl, getAvatarForPrioritize } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../AvatarImage/AvatarImage';

type AvatarUserProps = {
	user: UsersClanEntity;
};

const AvatarUser = ({ user }: AvatarUserProps) => {
	const userClan = useAppSelector((state) => selectMemberClanByUserId(state, user?.id ?? ''));
	const username = userClan?.user?.username;
	const avatar = getAvatarForPrioritize(userClan?.clan_avatar, userClan?.user?.avatar_url);
	return (
		<div className="w-6 h-6 rounded-full">
			<div className="w-6 h-6">
				{userClan ? (
					<AvatarImage
						alt={username || ''}
						username={username}
						className="min-w-6 min-h-6 max-w-6 max-h-6"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
					/>
				) : (
					<Icons.AvatarUser />
				)}
			</div>
		</div>
	);
};

interface Users {
	name: string;
	icon: React.ReactNode;
	userId: string;
}

type SearchMemberAuditLogProps = {
	currentClanId: string;
	actionFilter: string;
	userFilter?: IUserAuditLog | null;
	closeModal: () => void;
	pageSize: number;
	currentPage: number;
	selectedDate: string;
};

const SearchMemberAuditLogModal = ({
	currentClanId,
	actionFilter,
	userFilter,
	closeModal,
	pageSize,
	currentPage,
	selectedDate
}: SearchMemberAuditLogProps) => {
	const { t } = useTranslation('search');
	const dispatch = useAppDispatch();
	const appearanceTheme = useSelector(selectTheme);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedUser, setSelectedUser] = useState<string>(userFilter?.userId || '');
	const usersClan = useSelector(selectAllUserClans);

	const users: Users[] = [
		{ name: t('allUsers'), icon: <Icons.MemberList isWhite={true} />, userId: '' },
		...usersClan.map((item: UsersClanEntity) => ({
			name: item?.user?.display_name || '',
			icon: <AvatarUser user={item} />,
			userId: item?.user?.id || ''
		}))
	];

	const handleMemberClick = (user: Users) => {
		setSelectedUser(user?.userId);
		dispatch(
			auditLogFilterActions.setUser({
				userId: user.userId || '',
				username: user.name || ''
			})
		);

		if (currentClanId) {
			const body = {
				actionLog: actionFilter ? actionFilter : '',
				userId: user?.userId ?? '',
				clanId: currentClanId ?? '',
				date_log: selectedDate
			};
			dispatch(auditLogList(body));
		}
		closeModal();
	};

	const handleClearSearch = () => setSearchTerm('');

	return (
		<div className="absolute border sm:left-0 max-sm:right-0 max-sm:left-[unset] top-8 pb-3 rounded border-solid border-theme-primary bg-theme-setting-nav z-[9999] shadow w-72">
			<div className="bg-theme-setting-primary rounded-lg w-full max-w-xs">
				<div className="relative m-2">
					<input
						type="text"
						placeholder={t('searchMembers')}
						className={`w-full p-2 pr-10 bg-theme-input text-theme-primary-active rounded focus:outline-none ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<span className="absolute right-3 top-3 text-gray-400  cursor-pointer" onClick={searchTerm ? handleClearSearch : undefined}>
						{searchTerm ? <Icons.Close defaultSize="size-4" /> : <Icons.Search className="w-4 h-4 text-theme-primary" />}
					</span>
				</div>

				<div className={`h-64 ml-2 pr-1 overflow-y-scroll ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}>
					{users.filter((user) => user?.name?.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
						users
							.filter((user) => user?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
							.map((user, index) => (
								<div
									key={index}
									className={`flex items-center px-2 py-[10px] mb-1 text-theme-primary font-medium rounded cursor-pointer transition-colors bg-item-theme-hover ${
										selectedUser === user?.userId ? 'bg-[#5865F2] text-white hover:text-buttonProfile' : ''
									}`}
									onClick={() => handleMemberClick(user)}
								>
									<span className="">{user?.icon}</span>
									<span className="ml-3">{user?.name}</span>
									{selectedUser === user?.userId && (
										<span className="ml-auto ">
											<Icons.CheckMarkFilter defaultSize="w-5 h-5" defaultFill="text-white" />
										</span>
									)}
								</div>
							))
					) : (
						<div className="w-full h-full text-center text-gray-400 flex flex-col justify-center items-center">
							<div className="text-theme-primary font-medium text-xl">{t('noResults.title')}</div>
							<div>{t('noResults.description')}</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SearchMemberAuditLogModal;
