import { OfflineStatus, OnlineStatus } from '../Icons';

export type MemberProfileProps = {
	avatar: string;
	name: string;
	status?: boolean;
	isHideStatus?: boolean;
	isHideIconStatus?: boolean;
	numberCharacterCollapse?: number;
	textColor?: string;
	isHideUserName?: boolean;
	classParent?: string;
};

function MemberProfile({
	avatar,
	name,
	status,
	isHideStatus,
	isHideIconStatus,
	numberCharacterCollapse = 6,
	textColor = 'contentSecondary',
	isHideUserName,
	classParent = '',
}: MemberProfileProps) {
	return (
		<div className={`relative gap-[5px] flex items-center cursor-pointer overflow-hidden rounded ${classParent}`}>
			<a className="mr-[2px] relative inline-flex items-center justify-start w-10 h-10 text-lg text-white rounded-full">
				{avatar ? (
					<img src={avatar} className="w-[38px] h-[38px] min-w-[38px] rounded-full object-cover" />
				) : (
					<div className="w-[38px] h-[38px] bg-bgDisable rounded-full flex justify-center items-center text-contentSecondary text-[16px]">
						{name.charAt(0).toUpperCase()}
					</div>
				)}
				{!isHideIconStatus && avatar !== '/assets/images/avatar-group.png' ? (
					<span
						className={`absolute bottom-[-1px] right-[-1px] inline-flex items-center justify-center gap-1 p-[3px] text-sm text-white bg-[#111] rounded-full`}
					>
						{status ? <OnlineStatus /> : <OfflineStatus />}
					</span>
				) : (
					<></>
				)}
			</a>
			<div className="flex flex-col items-start">
				<div className="absolute top-6 group-hover:-translate-y-4 transition-all duration-300 flex flex-col items-start">
					{!isHideStatus && (
						<>
							<span className={`text-[11px] text-${textColor}`}>{!status ? 'Offline' : 'Online'}</span>
							<p className="text-[11px] text-contentSecondary">{name}</p>
						</>
					)}
				</div>
				{!isHideUserName && (
					<p
						className={`text-[15px] ${classParent == 'bg-transparent' ? '' : 'relative top-[-7px] bg-bgSurface'} nameMemberProfile`}
						title={name && name.length > numberCharacterCollapse ? name : undefined}
					>
						{name && name.length > numberCharacterCollapse ? `${name.substring(0, numberCharacterCollapse)}...` : name}
					</p>
				)}
			</div>
		</div>
	);
}

export default MemberProfile;
