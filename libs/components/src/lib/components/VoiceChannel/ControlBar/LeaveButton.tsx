import { Icons } from '@mezon/ui';
import { memo } from 'react';

interface LeaveButtonProps {
	onLeaveRoom: () => void;
}

export const LeaveButton = memo(({ onLeaveRoom }: LeaveButtonProps) => {
	return (
		<div
			id="btn-meet-leave"
			onClick={onLeaveRoom}
			className="w-14 aspect-square max-md:w-10 bg-[#da373c] hover:bg-[#a12829] cursor-pointer rounded-full flex justify-center items-center"
		>
			<Icons.EndCall className="w-6 aspect-square max-md:w-4" />
		</div>
	);
});
