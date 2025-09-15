import type { FriendsEntity, ISendTokenDetailType, UsersEntity } from '@mezon/store';
import { selectAllFriends, selectAllUsersByUser } from '@mezon/store';
import { ButtonLoading, Icons } from '@mezon/ui';
import { createImgproxyUrl, formatNumber } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage, ModalLayout, useVirtualizer } from '../../../components';

type ModalSendTokenProps = {
	onClose: () => void;
	token: number;
	setToken: (token: number) => void;
	setSelectedUserId: (id: string) => void;
	handleSaveSendToken: (id?: string, username?: string, avatar?: string, display_name?: string) => void;
	setNote: (note: string) => void;
	error: string | null;
	userSearchError: string | null;
	userId: string;
	selectedUserId: string;
	note: string;
	sendTokenInputsState: {
		isSendTokenInputDisabled: boolean;
		isUserSelectionDisabled: boolean;
	};
	infoSendToken?: ISendTokenDetailType | null;
	isButtonDisabled: boolean;
};

type User = {
	id: string;
	username: string;
	avatar_url: string;
	search_key?: string;
	display_name?: string;
	mmn_address?: string;
};
const ModalSendToken = ({
	onClose,
	token,
	setToken,
	setSelectedUserId,
	handleSaveSendToken,
	setNote,
	error,
	userSearchError,
	userId,
	selectedUserId,
	note,
	sendTokenInputsState,
	infoSendToken,
	isButtonDisabled
}: ModalSendTokenProps) => {
	const usersClan = useSelector(selectAllUsersByUser);
	const friends = useSelector(selectAllFriends);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [searchTerm, setSearchTerm] = useState(infoSendToken?.receiver_name || '');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [tokenNumber, setTokenNumber] = useState('');
	const [noteSendToken, setNoteSendToken] = useState(note || '');

	useEffect(() => {
		return () => {
			setSearchTerm('');
			setToken(0);
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [dropdownRef]);

	const handleChangeSearchTerm = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		setIsDropdownOpen(true);
		setSelectedUserId('');
	};

	const handleSelectUser = (id: string, name: string) => {
		setSearchTerm(name);
		setIsDropdownOpen(false);
		setSelectedUserId(id);
	};

	const handleChangeSendToken = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/[^0-9]/g, '');
		setTokenNumber(formatNumber(Number(value), 'vi-VN'));
		setToken(Number(value));
	};

	const handleChangeNote = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setNote(value);
		setNoteSendToken(value);
	};

	const mergeUniqueUsers = (usersClan: UsersEntity[], directMessages: FriendsEntity[]) => {
		const userMap: Map<string, User> = new Map();

		usersClan.forEach((itemUserClan) => {
			const userId = itemUserClan?.id ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: itemUserClan?.username ?? '',
					avatar_url: itemUserClan?.avatar_url ?? '',
					search_key: itemUserClan.list_nick_names?.join('./'),
					display_name: itemUserClan.display_name
				});
			}
		});

		directMessages.forEach((itemDM: FriendsEntity) => {
			const userId = itemDM?.user?.id ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: (itemDM?.user?.display_name || itemDM?.user?.username) ?? '',
					avatar_url: itemDM?.user?.avatar_url ?? '',
					display_name: (itemDM?.user?.display_name || itemDM?.user?.username) ?? ''
				});
			}
		});

		return Array.from(userMap.values());
	};

	const mergedUsers = mergeUniqueUsers(usersClan, friends);

	const filteredUsers = mergedUsers.filter(
		(user) =>
			(user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || user.search_key?.includes(searchTerm.toLowerCase())) &&
			user.id !== userId
	);

	const rowVirtualizer = useVirtualizer({
		count: filteredUsers?.length,
		getScrollElement: () => dropdownRef.current,
		estimateSize: () => 48,
		overscan: 5
	});

	useEffect(() => {
		const user = filteredUsers.find((user) => user.id === selectedUserId);
		if (user) {
			handleSelectUser(user.id, user.username);
			if (amountRef.current) {
				amountRef.current.focus();
			}
		}

		setTokenNumber(formatNumber(Number(token), 'vi-VN'));
	}, [token, selectedUserId]);

	const selectedUser = mergedUsers.find((user) => user.id === selectedUserId);

	const handleSendToken = () => {
		handleSaveSendToken(selectedUser?.id, selectedUser?.username, selectedUser?.avatar_url, selectedUser?.display_name);
	};

	const amountRef = useRef<HTMLInputElement | null>(null);

	return (
		<ModalLayout onClose={onClose}>
			<div className="bg-theme-chat rounded-xl overflow-hidden w-[480px]">
				<div className="flex items-center justify-between p-6 border-b dark:border-gray-700 border-gray-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full btn-primary text-theme-primary-hover flex items-center justify-center">
							<Icons.DollarIcon className="w-5 h-5" defaultFill="text-white" />
						</div>
						<div>
							<h1 className="text-theme-primary text-lg font-semibold">Send Tokens</h1>
							<p className="text-theme-secondary">Transfer tokens to another user</p>
						</div>
					</div>
					<button onClick={onClose} className="text-theme-primary text-theme-primary-hover transition-colors">
						<Icons.Close className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-6 border-t-theme-primary">
					<div className="space-y-3">
						<p className="text-theme-primary  text-sm font-medium flex items-center gap-2">To</p>
						<div className="relative">
							<input
								type="text"
								placeholder="Search users..."
								className="w-full h-12 px-4 pr-10 bg-input-theme border-theme-primary rounded-xl outline-none focus:ring-2  transition-all "
								value={searchTerm}
								onClick={() => setIsDropdownOpen(true)}
								onChange={handleChangeSearchTerm}
								disabled={sendTokenInputsState.isUserSelectionDisabled}
								autoFocus={!searchTerm}
							/>
							{isDropdownOpen && (
								<div
									className="absolute z-20 w-full mt-2 base-theme-color border-b-theme-primary rounded-xl shadow-lg max-h-48 overflow-y-auto thread-scroll text-theme-primary bg-theme-surface "
									ref={dropdownRef}
								>
									<div
										style={{
											height: `${rowVirtualizer.getTotalSize()}px`,
											width: '100%',
											position: 'relative'
										}}
									>
										{filteredUsers.length > 0 &&
											rowVirtualizer.getVirtualItems().map((virtualRow) => {
												const user = filteredUsers[virtualRow.index];

												return (
													<div
														key={virtualRow.index}
														style={{
															position: 'absolute',
															top: 0,
															left: 0,
															width: '100%',
															height: `${virtualRow.size}px`,
															transform: `translateY(${virtualRow.start}px)`
														}}
													>
														<div
															onClick={() => handleSelectUser(user.id, user.username)}
															className="flex items-center gap-3 p-3 bg-item-theme-hover cursor-pointer transition-colors"
														>
															<AvatarImage
																alt={user?.username ?? ''}
																username={user?.username ?? ''}
																srcImgProxy={createImgproxyUrl(user.avatar_url ?? '', {
																	width: 100,
																	height: 100,
																	resizeType: 'fit'
																})}
																src={user.avatar_url}
																className="w-8 h-8"
																classNameText="text-xs w-8 h-8"
															/>
															<span className=" font-medium">{user.username}</span>
														</div>
													</div>
												);
											})}
										{filteredUsers.length === 0 && <div className="p-4 text-center text-">No users found</div>}
									</div>
								</div>
							)}
							{userSearchError && <p className="text-red-500 text-sm mt-2">{userSearchError}</p>}
						</div>
					</div>

					<div className="space-y-3">
						<p className="text-theme-primary  text-sm font-medium flex items-center gap-2">Amount</p>
						<div className="relative">
							<input
								ref={amountRef}
								type="text"
								value={tokenNumber}
								className="w-full h-12 px-4 pr-10 bg-input-theme border-theme-primary rounded-xl outline-none focus:ring-2  transition-all "
								placeholder="0"
								onChange={handleChangeSendToken}
								disabled={sendTokenInputsState.isSendTokenInputDisabled}
							/>
							<span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-primary font-medium">VND</span>
						</div>
						{error && <p className="text-red-500 text-sm">{error}</p>}
					</div>

					<div className="space-y-3">
						<p className="text-theme-primary  text-sm font-medium flex items-center gap-2">Note (Optional)</p>
						<input
							type="text"
							defaultValue={noteSendToken}
							className="w-full h-12 px-4 pr-10 bg-input-theme border-theme-primary rounded-xl outline-none focus:ring-2  transition-all "
							placeholder="Add a note..."
							onChange={handleChangeNote}
						/>
					</div>
				</div>

				<div className="p-6 border-t-theme-primary flex gap-3">
					<button
						className="flex-1 h-12 px-4 rounded-xl text-theme-primary bg-item-theme-hover border-theme-primary font-medium  transition-all"
						type="button"
						onClick={onClose}
					>
						Cancel
					</button>
					<ButtonLoading
						className="flex-1 h-12 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 hover:text-white  text-white font-medium"
						onClick={handleSendToken}
						disabled={isButtonDisabled || !selectedUserId || token <= 0}
						label="Send Tokens"
					/>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalSendToken;
