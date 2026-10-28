import { createImgproxyUrl } from '@mezon/utils';

type ItemProfileProps = {
	avatar?: string;
	username?: string;
	onClick?: () => void;
};

const ItemProfile = ({ avatar, username, onClick }: ItemProfileProps) => {
	return (
		<div className="flex items-center justify-between gap-2 rounded-sm text-theme-primary-hover bg-theme-hover px-2" onClick={onClick}>
			{avatar ? (
				<img
					src={createImgproxyUrl(avatar ?? '', { width: 100, height: 100, resizeType: 'fill-down' })}
					alt="avatar"
					className="w-6 h-6 rounded-full object-cover"
				/>
			) : (
				<div className="w-[30px] h-[30px] bg-bgDisable rounded-full flex justify-center items-center text-contentSecondary text-[16px]">
					{username && username.charAt(0).toUpperCase()}
				</div>
			)}
			<li className="text-[14px] text-theme-primary w-full py-[6px] cursor-pointer list-none ">{username}</li>
		</div>
	);
};

export default ItemProfile;
