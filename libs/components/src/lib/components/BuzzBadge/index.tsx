import { ChannelStreamMode } from 'mezon-js';

type BuzzBadgeProps = {
	mode: ChannelStreamMode;
};

const BuzzBadge = ({ mode }: BuzzBadgeProps) => {
	const isPosDmOrGr = mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP;

	return (
		<div
			className={`bg-red-500 text-xs z-40 shadow-[0px_0px_10px_1px_#ff000040] ${
				isPosDmOrGr ? 'top-3.5 right-6 absolute' : 'relative'
			} text-white rounded-sm p-0.5 text-center font-medium`}
		>
			Buzz!!
		</div>
	);
};

export default BuzzBadge;
