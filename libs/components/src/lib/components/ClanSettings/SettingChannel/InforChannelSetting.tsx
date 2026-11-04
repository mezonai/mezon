import { selectChannelById, selectOneChannelInfor } from '@mezon/store';
import { MezonIcon, MzIcons20, MzIcons24 } from '@mezon/ui';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useSelector } from 'react-redux';
import { AvatarUserShort } from '.';

type ChannelSettingItemProps = {
	onClose: () => void;
	channelId: string;
};

const ChannelSettingInforItem = ({ onClose, channelId }: ChannelSettingItemProps) => {
	const channel = useSelector(selectChannelById(channelId));

	const channelSetting = useSelector(selectOneChannelInfor(channelId));
	return (
		<div className="fixed w-screen h-screen top-0 left-0 bg-slate-900 bg-opacity-80 z-50 flex items-center flex-row-reverse " onClick={onClose}>
			<div className="w-1/2 h-full bg-white animate-slide_in flex flex-col pt-5 px-5 gap-4" onClick={(e) => e.stopPropagation()}>
				<div className="flex w-full items-center gap-2 shadow-sm ">
					<p className="font-semibold text-xl">{channel?.channel_label || ''}</p>
					<div className="h-7 w-7 overflow-hidden flex items-center justify-center ">
						{channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ? (
							channel?.channel_private === ChannelStatusEnum.isPrivate ? (
								<MezonIcon icon={MzIcons24.mzChannelPrivate} className="dark:text-black text-[var(--mz-icon)]" />
							) : (
								<MezonIcon icon={MzIcons24.mzChannel} className="dark:text-black" />
							)
						) : channel?.channel_private === ChannelStatusEnum.isPrivate ? (
							<MezonIcon icon={MzIcons20.mzThreadPrivate} className="text-[var(--mz-icon)]" />
						) : (
							<MezonIcon icon={MzIcons20.mzThread} className="text-[var(--mz-icon)]" />
						)}
					</div>
				</div>

				<div className="flex w-full items-start shadow-sm flex-col justify-center gap-3">
					<p className="font-semibold text-lg">Member List</p>
					<div className="flex">
						{channel?.channel_private === ChannelStatusEnum.isPrivate ? (
							<div className="flex w-full flex-wrap gap-2">
								{channelSetting.user_ids?.map((userId) => <AvatarUserShort id={userId} />)}
							</div>
						) : (
							<p>(All Member In Clan)</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChannelSettingInforItem;
