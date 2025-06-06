import { DirectEntity, ISendTokenDetailType, selectAllDirectMessages, selectAllUserClans } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, formatNumber } from '@mezon/utils';
import { Label, Modal } from 'flowbite-react';
import { ChannelType } from 'mezon-js';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage, useVirtualizer } from '../../../components';

type ModalSendTokenProps = {
	openModal: boolean;
	onClose?: () => void;
	token: number;
	setToken: (token: number) => void;
	setSelectedUserId: (id: string) => void;
	handleSaveSendToken: (id: string, username?: string, avatar?: string, display_name?: string) => void;
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

const ModalSendToken = ({
	openModal,
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
	const usersClan = useSelector(selectAllUserClans);
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const listDM = dmGroupChatList.filter((groupChat) => groupChat.type === ChannelType.CHANNEL_TYPE_DM);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [tokenNumber, setTokenNumber] = useState('');
	const [noteSendToken, setNoteSendToken] = useState('');

	useEffect(() => {
		if (!openModal) {
			setSearchTerm('');
			setToken(0);
		}
		if (openModal) {
			setSearchTerm('');
			setSelectedUserId('');
		}
	}, [openModal]);

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
	};

	const mergeUniqueUsers = (usersClan: any[], directMessages: any[]) => {
		const userMap = new Map();

		usersClan.forEach((itemUserClan) => {
			const userId = itemUserClan?.id ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: itemUserClan?.user?.username ?? '',
					avatar_url: itemUserClan?.user?.avatar_url ?? ''
				});
			}
		});

		directMessages.forEach((itemDM: DirectEntity) => {
			const userId = itemDM?.user_id?.[0] ?? '';
			if (userId && !userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: itemDM?.usernames?.[0] ?? '',
					avatar_url: itemDM?.channel_avatar?.[0] ?? ''
				});
			}
		});

		return Array.from(userMap.values());
	};

	const mergedUsers = mergeUniqueUsers(usersClan, listDM);

	const filteredUsers = mergedUsers.filter((user: any) => user.username?.toLowerCase().includes(searchTerm.toLowerCase()) && user.id !== userId);

	const rowVirtualizer = useVirtualizer({
		count: filteredUsers?.length,
		getScrollElement: () => dropdownRef.current,
		estimateSize: () => 48,
		overscan: 5
	});

	useEffect(() => {
		const user = filteredUsers.find((user) => user.id === selectedUserId);
		if (user) handleSelectUser(user.id, user.username);
		setTokenNumber(formatNumber(Number(token), 'vi-VN'));
		setNoteSendToken(note);
	}, [token, selectedUserId, note]);

	const handleSendToken = () => {
		const userData = mergedUsers.find((user) => user.id === selectedUserId);
		if (!userData) return;
		handleSaveSendToken(userData.id, userData.username, userData.avatar_url, userData.display_name);
	};

	const selectedUser = mergedUsers.find((user) => user.id === selectedUserId);

	return (
		<Modal className="bg-bgModalDark" theme={{ content: { base: 'w-[480px]' } }} show={openModal} dismissible={true} onClose={onClose}>
			<div className="dark:bg-bgPrimary bg-bgLightMode rounded-xl overflow-hidden">
				<div className="flex items-center justify-between p-6 border-b dark:border-gray-700 border-gray-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full dark:bg-blue-600 bg-blue-500 flex items-center justify-center">
							<Icons.DollarIcon isWhite className="w-5 h-5" />
						</div>
						<div>
							<h1 className="dark:text-white text-gray-900 text-lg font-semibold">Send Tokens</h1>
							<p className="dark:text-gray-400 text-gray-500 text-sm">Transfer tokens to another user</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="dark:text-gray-400 text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
					>
						<Icons.Close className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div className="space-y-3">
						<Label value="To" className="dark:text-gray-300 text-gray-700 text-sm font-medium flex items-center gap-2">
							<Icons.UserIcon className="w-4 h-4" />
							Recipient
						</Label>
						<div className="relative">
							<input
								type="text"
								placeholder="Search users..."
								className="w-full h-12 px-4 pr-10 dark:bg-gray-800 bg-gray-50 dark:text-white text-gray-900 border dark:border-gray-600 border-gray-300 rounded-xl outline-none focus:ring-2 dark:focus:ring-blue-500 focus:ring-blue-400 transition-all placeholder:dark:text-gray-500 placeholder:text-gray-400"
								value={searchTerm}
								onClick={() => setIsDropdownOpen(true)}
								onChange={handleChangeSearchTerm}
								disabled={sendTokenInputsState.isUserSelectionDisabled}
							/>
							{isDropdownOpen && (
								<div
									className="absolute z-20 w-full mt-2 dark:bg-gray-800 bg-white border dark:border-gray-600 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto thread-scroll "
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
															className="flex items-center gap-3 p-3 hover:dark:bg-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
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
															<span className="dark:text-white text-gray-900 font-medium">{user.username}</span>
														</div>
													</div>
												);
											})}
										{filteredUsers.length === 0 && (
											<div className="p-4 text-center dark:text-gray-400 text-gray-500">No users found</div>
										)}
									</div>
								</div>
							)}
							{userSearchError && <p className="text-red-500 text-sm mt-2">{userSearchError}</p>}
						</div>
					</div>

					<div className="space-y-3">
						<Label value="Amount" className="dark:text-gray-300 text-gray-700 text-sm font-medium flex items-center gap-2">
							<Icons.DollarIcon className="w-4 h-4" />
							Amount
						</Label>
						<div className="relative">
							<input
								type="text"
								value={tokenNumber}
								className="w-full h-12 px-4 dark:bg-gray-800 bg-gray-50 dark:text-white text-gray-900 border dark:border-gray-600 border-gray-300 rounded-xl outline-none focus:ring-2 dark:focus:ring-blue-500 focus:ring-blue-400 transition-all text-lg font-medium"
								placeholder="0"
								onChange={handleChangeSendToken}
								disabled={sendTokenInputsState.isSendTokenInputDisabled}
							/>
							<span className="absolute right-4 top-1/2 transform -translate-y-1/2 dark:text-gray-400 text-gray-500 font-medium">
								VND
							</span>
						</div>
						{error && <p className="text-red-500 text-sm">{error}</p>}
					</div>

					<div className="space-y-3">
						<Label value="Note" className="dark:text-gray-300 text-gray-700 text-sm font-medium flex items-center gap-2">
							<Icons.ThreadIcon className="w-4 h-4" />
							Note (Optional)
						</Label>
						<input
							type="text"
							defaultValue={noteSendToken}
							className="w-full h-12 px-4 dark:bg-gray-800 bg-gray-50 dark:text-white text-gray-900 border dark:border-gray-600 border-gray-300 rounded-xl outline-none focus:ring-2 dark:focus:ring-blue-500 focus:ring-blue-400 transition-all placeholder:dark:text-gray-500 placeholder:text-gray-400"
							placeholder="Add a note..."
							onChange={handleChangeNote}
						/>
					</div>


				</div>

				<div className="p-6 border-t dark:border-gray-700 border-gray-200 flex gap-3">
					<button
						className="flex-1 h-12 px-4 rounded-xl border dark:border-gray-600 border-gray-300 dark:text-gray-300 text-gray-700 font-medium hover:dark:bg-gray-800 hover:bg-gray-50 transition-all"
						type="button"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						className="flex-1 h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center justify-center gap-2"
						type="button"
						onClick={handleSendToken}
						disabled={isButtonDisabled || !selectedUserId || token <= 0}
					>
						<Icons.DollarIcon isWhite className="w-4 h-4" />
						Send Tokens
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default ModalSendToken;
