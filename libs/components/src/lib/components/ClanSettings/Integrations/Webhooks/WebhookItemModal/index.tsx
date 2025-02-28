import {
	ChannelsEntity,
	selectAllChannels,
	selectChannelById,
	selectCurrentClanId,
	selectMemberClanByUserId,
	selectTheme,
	settingClanStickerActions,
	updateWebhookBySpecificId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { ChannelIsNotThread, IChannel } from '@mezon/utils';
import { Dropdown } from 'flowbite-react';
import { ApiMessageAttachment, ApiWebhook, MezonUpdateWebhookByIdBody } from 'mezon-js/api.gen';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalSaveChanges from '../../../ClanSettingOverview/ModalSaveChanges';
import DeleteWebhookPopup from './DeleteWebhookPopup';

interface IWebhookItemModalProps {
	webhookItem: ApiWebhook;
	currentChannel?: IChannel;
	isClanSetting?: boolean;
}

const convertDate = (isoDateString: string): string => {
	const date = new Date(isoDateString);
	const options: Intl.DateTimeFormatOptions = {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	};
	return date.toLocaleDateString('en-GB', options);
};

const WebhookItemModal = ({ webhookItem, currentChannel, isClanSetting }: IWebhookItemModalProps) => {
	const [isExpand, setIsExpand] = useState(false);
	const webhookOwner = useSelector(selectMemberClanByUserId(webhookItem.creator_id as string));
	return (
		<div className="dark:bg-[#2b2d31] bg-bgLightMode p-[20px] border dark:border-black rounded-md mb-[20px]">
			<div className="flex gap-[20px] items-center">
				<img src={webhookItem.avatar} alt="Webhook avatar" className="aspect-square w-[50px] rounded-full" />
				<div className="flex w-full justify-between items-center dark:text-textDarkTheme text-textLightTheme">
					<div className="">
						<div>{webhookItem.webhook_name}</div>
						<div className="flex gap-1 items-center">
							<Icons.ClockIcon className="dark:text-[#b5bac1] text-textLightTheme" />
							<div className="dark:text-[#b5bac1] text-textLightTheme text-[13px]">
								Created on {convertDate(webhookItem.create_time || '')} by {webhookOwner?.user?.username}
							</div>
						</div>
					</div>
					<div
						onClick={() => setIsExpand(!isExpand)}
						className={`cursor-pointer transition duration-100 ease-in-out ${isExpand ? '' : '-rotate-90'}`}
					>
						<Icons.ArrowDown defaultSize="h-[30px] w-[30px] dark:text-[#b5bac1] text-black" />
					</div>
				</div>
			</div>
			{isExpand && <ExpendedWebhookModal isClanSetting={isClanSetting} currentChannel={currentChannel} webhookItem={webhookItem} />}
		</div>
	);
};

interface IExpendedWebhookModal {
	webhookItem: ApiWebhook;
	currentChannel?: IChannel;
	isClanSetting?: boolean;
}

interface IDataForUpdate {
	channelIdForUpdate: string | undefined;
	webhookNameInput: string | undefined;
	webhookAvatarUrl: string | undefined;
}

const ExpendedWebhookModal = ({ webhookItem, currentChannel, isClanSetting }: IExpendedWebhookModal) => {
	const dispatch = useAppDispatch();
	const [isShowPopup, setIsShowPopup] = useState(false);
	const openShowPopup = () => {
		dispatch(settingClanStickerActions.openModalInChild());
		setIsShowPopup(true);
	};

	const handleCloseDeletePopup = useCallback(() => {
		setIsShowPopup(false);
		modalRef?.current?.focus();
		dispatch(settingClanStickerActions.closeModalInChild());
	}, []);

	const handleCopyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
	};
	const { sessionRef, clientRef } = useMezon();
	const currentClanId = useSelector(selectCurrentClanId);
	const avatarRef = useRef<HTMLInputElement>(null);

	const webhookChannel = useAppSelector((state) => selectChannelById(state, webhookItem.channel_id ?? '')) || {};

	const [dropdownValue, setDropdownValue] = useState(webhookChannel.channel_label);

	const [dataForUpdate, setDataForUpdate] = useState<IDataForUpdate>({
		channelIdForUpdate: webhookItem.channel_id,
		webhookAvatarUrl: webhookItem.avatar,
		webhookNameInput: webhookItem.webhook_name
	});

	useEffect(() => {
		setDataForUpdate({
			channelIdForUpdate: webhookItem.channel_id,
			webhookAvatarUrl: webhookItem.avatar,
			webhookNameInput: webhookItem.webhook_name
		});
		setDropdownValue(webhookChannel.channel_label);
	}, [webhookItem.channel_id]);

	const [hasChange, setHasChange] = useState<boolean>(false);

	useEffect(() => {
		const computeHasChanges =
			dataForUpdate.webhookNameInput !== webhookItem.webhook_name ||
			dataForUpdate.webhookAvatarUrl !== webhookItem.avatar ||
			dataForUpdate.channelIdForUpdate !== webhookItem.channel_id;
		setHasChange(computeHasChanges);
	}, [dataForUpdate.webhookNameInput, dataForUpdate.webhookAvatarUrl, dataForUpdate.channelIdForUpdate]);

	const handleChooseFile = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const client = clientRef.current;
			const session = sessionRef.current;
			if (!client || !session) {
				throw new Error('Client or file is not initialized');
			}
			handleUploadFile(client, session, currentClanId || '', currentChannel?.channel_id || '', e.target.files[0].name, e.target.files[0]).then(
				(attachment: ApiMessageAttachment) => {
					setDataForUpdate({
						...dataForUpdate,
						webhookAvatarUrl: attachment.url
					});
				}
			);
		}
	};
	const clanId = useSelector(selectCurrentClanId) as string;
	const handleEditWebhook = async () => {
		const request: MezonUpdateWebhookByIdBody = {
			avatar: dataForUpdate.webhookAvatarUrl,
			channel_id_update: dataForUpdate.channelIdForUpdate,
			webhook_name: dataForUpdate.webhookNameInput,
			channel_id: currentChannel?.channel_id,
			clan_id: clanId
		};
		await dispatch(
			updateWebhookBySpecificId({
				request: request,
				webhookId: webhookItem.id,
				channelId: currentChannel?.channel_id || '',
				clanId: clanId,
				isClanSetting: isClanSetting
			})
		);
		setHasChange(false);
	};

	const handleResetChange = () => {
		setDataForUpdate({
			channelIdForUpdate: webhookItem.channel_id,
			webhookAvatarUrl: webhookItem.avatar,
			webhookNameInput: webhookItem.webhook_name
		});
		setDropdownValue(webhookChannel.channel_label);
		setHasChange(false);
	};

	const modalRef = useRef<HTMLDivElement>(null);

	return (
		<>
			<div ref={modalRef} tabIndex={-1} className="pt-[20px] mt-[12px] border-t dark:border-[#3b3d44]">
				<div className="flex gap-2">
					<div className="w-3/12 dark:text-[#b5bac1] text-textLightTheme">
						<input onChange={handleChooseFile} ref={avatarRef} type="file" hidden />
						<div className="relative w-fit">
							<div
								onClick={() => avatarRef.current?.click()}
								className="absolute right-0 top-0 p-[5px] bg-[#ffffff] rounded-full z-10 shadow-xl border cursor-pointer"
							>
								<Icons.SelectFileIcon />
							</div>
							<img
								src={dataForUpdate.webhookAvatarUrl}
								alt="Webhook avatar"
								className="aspect-square w-[100px] rounded-full hover:grayscale-[50%] cursor-pointer"
								onClick={() => avatarRef.current?.click()}
							/>
						</div>
						<div className="text-[10px] mt-[10px] text-center">
							Minimum Size: <b>128x128</b>
						</div>
					</div>
					<div className="w-9/12">
						<div className="flex gap-6 w-full">
							<div className="w-1/2">
								<div className="dark:text-[#b5bac1] text-textLightTheme text-[12px] mb-[10px]">
									<b>NAME</b>
								</div>
								<input
									onChange={(e) =>
										setDataForUpdate({
											...dataForUpdate,
											webhookNameInput: e.target.value
										})
									}
									type="text"
									value={dataForUpdate.webhookNameInput}
									className="w-full dark:text-[#b5bac1] text-textLightTheme dark:bg-[#1e1f22] bg-bgLightModeThird p-[10px] rounded-sm outline-none h-[50px]"
								/>
							</div>
							<div className="w-1/2 dark:text-[#b5bac1] text-textLightTheme">
								<div className="text-[12px] mb-[10px]">
									<b>CHANNEL</b>
								</div>
								<WebhookItemChannelDropdown
									webhookItem={webhookItem}
									setDataForUpdate={setDataForUpdate}
									hasChange={hasChange}
									dataForUpdate={dataForUpdate}
									dropdownValue={dropdownValue}
									setDropdownValue={setDropdownValue}
								/>
							</div>
						</div>
						<div className="max-sm:hidden block">
							<div className="border-t dark:border-[#3b3d44] my-[24px]" />
							<div className="flex items-center gap-[20px]">
								<div
									onClick={() => handleCopyUrl(webhookItem.url as string)}
									className="font-medium px-4 py-2 dark:bg-[#4e5058] bg-[#808084] dark:hover:bg-[#808084] hover:bg-[#4e5058] rounded-sm cursor-pointer"
								>
									Copy Webhook URL
								</div>
								<div onClick={openShowPopup} className="font-medium text-red-500 hover:underline cursor-pointer">
									Delete Webhook
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="max-sm:block hidden">
					<div className="border-t dark:border-[#3b3d44] my-[24px]" />
					<div className="flex items-center gap-[20px]">
						<div
							onClick={() => handleCopyUrl(webhookItem.url as string)}
							className="font-medium px-4 py-2 dark:bg-[#4e5058] bg-[#808084] dark:hover:bg-[#808084] hover:bg-[#4e5058] rounded-sm cursor-pointer"
						>
							Copy Webhook URL
						</div>
						<div onClick={openShowPopup} className="font-medium text-red-500 hover:underline cursor-pointer">
							Delete Webhook
						</div>
					</div>
				</div>
			</div>
			{hasChange && <ModalSaveChanges onSave={handleEditWebhook} onReset={handleResetChange} />}
			{isShowPopup && (
				<DeleteWebhookPopup
					currentChannel={currentChannel}
					webhookItem={webhookItem}
					closeShowPopup={handleCloseDeletePopup}
					isClanSetting={isClanSetting}
				/>
			)}
		</>
	);
};

interface IWebhookItemChannelDropdown {
	webhookItem: ApiWebhook;
	dataForUpdate: IDataForUpdate;
	setDataForUpdate: (dataForUpdate: IDataForUpdate) => void;
	hasChange: boolean;
	dropdownValue: string | undefined;
	setDropdownValue: (label: string | undefined) => void;
}

const WebhookItemChannelDropdown = ({
	webhookItem,
	setDataForUpdate,
	hasChange,
	dataForUpdate,
	dropdownValue,
	setDropdownValue
}: IWebhookItemChannelDropdown) => {
	const allChannel = useSelector(selectAllChannels);
	const [parentChannelsInClan, setParentChannelsInClan] = useState<ChannelsEntity[]>([]);
	useEffect(() => {
		const normalChannels = allChannel.filter((channel) => channel.parent_id === ChannelIsNotThread.TRUE);
		setParentChannelsInClan(normalChannels);
	}, [allChannel]);

	const appearanceTheme = useSelector(selectTheme);

	useEffect(() => {
		if (!hasChange) {
			setDataForUpdate({
				...dataForUpdate,
				channelIdForUpdate: webhookItem.channel_id
			});
		}
	}, [hasChange]);

	return (
		<Dropdown
			trigger="click"
			renderTrigger={() => (
				<div className="w-full h-[50px] rounded-md dark:bg-[#1e1f22] bg-bgLightModeThird flex flex-row px-3 justify-between items-center">
					<p className="truncate max-w-[90%]">{dropdownValue}</p>
					<div>
						<Icons.ArrowDownFill />
					</div>
				</div>
			)}
			label=""
			placement="bottom-end"
			className={`dark:bg-black bg-white border-none ml-[3px] py-[6px] px-[8px] max-h-[200px] overflow-y-scroll w-[200px] ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'} z-20`}
		>
			{parentChannelsInClan.map((channel) => {
				if (webhookItem.channel_id !== channel.channel_id) {
					return (
						<Dropdown.Item
							key={channel.channel_id}
							children={channel.channel_label ?? ''}
							className="truncate"
							onClick={() => {
								setDataForUpdate({
									...dataForUpdate,
									channelIdForUpdate: channel.channel_id
								});
								setDropdownValue(channel.channel_label);
							}}
						/>
					);
				}
			})}
		</Dropdown>
	);
};

export default WebhookItemModal;
