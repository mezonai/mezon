import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { ChannelLableModal } from '../ChannelLabel';

interface ChannelStatusModalProps {
	channelNameProps: string;
	onChangeValue: (value: number) => void;
}

export const ChannelStatusModal: React.FC<ChannelStatusModalProps> = ({ channelNameProps, onChangeValue }) => {
	const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.checked ? 1 : 0;
		onChangeValue(value);
	};

	return (
		<div className="self-stretch flex-col justify-start items-start gap-2 mt-2 flex">
			<div className="self-stretch justify-start items-center gap-3 inline-flex">
				<div className="grow shrink basis-0 h-6 justify-start items-center gap-1 flex">
					<div className="Lock w-6 h-6 relative">
						<div className="LiveArea w-5 h-5 left-[2px] top-[2px] absolute" />
						<Icons.Private />
					</div>
					<ChannelLableModal labelProp={channelNameProps} />
				</div>
				<div className="relative flex flex-wrap items-center">
					<input
						className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
						bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
						after:bg-slate-500 after:transition-all
						checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
						hover:bg-slate-400 after:hover:bg-slate-600
						checked:hover:bg-[#4654C0] checked:after:hover:bg-white
						focus:outline-none checked:focus:bg-[#4654C0] checked:after:focus:bg-white
						focus-visible:outline-none disabled:cursor-not-allowed
						disabled:bg-slate-200 disabled:after:bg-slate-300"
						type="checkbox"
						value={1}
						id="id-c01"
						onChange={handleToggle}
						data-e2e={generateE2eId('clan_page.modal.create_channel.toggle.is_private')}
					/>
				</div>
			</div>
			<div className="OnlySelectedMembersAndRolesWillBeAbleToViewThisChannel self-stretch text-zinc-400 text-xs font-normal leading-[18.20px]">
				Only selected members and roles will be able to view this channel.
			</div>
		</div>
	);
};
