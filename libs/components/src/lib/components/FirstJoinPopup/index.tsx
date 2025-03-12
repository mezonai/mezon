import { Icons, Image } from '@mezon/ui';
import { useState } from 'react';

interface IFirstJoinPopup {
	onclose: () => void;
	openCreateClanModal: () => void;
}

const FirstJoinPopup = ({ onclose, openCreateClanModal }: IFirstJoinPopup) => {
	const [inputValue, setInputValue] = useState('');
	const handleJoinClan = () => {
		window.open(inputValue, '_blank');
	};
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-[#000000c9]">
			<div className="relative z-10 w-[680px] flex max-sm:justify-center">
				<Image src={`assets/images/first-join-bg.svg`} width={240} className="object-cover rounded-l-md max-sm:hidden" />
				<div className="text-[#4e5058] bg-white rounded-r-md max-sm:rounded-md relative flex flex-col">
					<Icons.MenuClose onClick={onclose} className="absolute top-5 right-5 w-[16px] cursor-pointer" />
					<div className="px-[16px] flex flex-col justify-center h-full flex-1 gap-[15px]">
						<div className="text-center">
							<div className="text-black text-[13px]">If you have invitation link,</div>
							<div className="text-black font-bold text-[25px]">Join clan</div>
							<div>Enter the invitation link below to join an available clan</div>
						</div>
						<div className="flex flex-col gap-[5px]">
							<div className="uppercase text-[12px] font-bold">Invitation link</div>
							<input
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								type="text"
								className="bg-[#dfe0e2] outline-primary border border-white hover:border-[#979a9e] w-full rounded-md p-[10px] text-[15px]"
							/>
							<div className="text-[11px] flex flex-col gap-[5px]">
								<div>Example: https://mezon.ai/cool-people, hTKzmak</div>
								<div>
									Do you want to add more clan to join?{' '}
									<span className="text-primary cursor-pointer hover:underline">Connect to Twitch or Youtube account</span>
								</div>
							</div>
						</div>
					</div>
					<div className="p-[16px] flex justify-between">
						<div className="flex items-center gap-1	">
							<div>
								Or{' '}
								<span
									onClick={() => {
										openCreateClanModal();
										onclose();
									}}
									className="font-semibold hover:underline cursor-pointer"
								>
									Create your own clan
								</span>
							</div>
						</div>
						<button
							onClick={handleJoinClan}
							className={`${inputValue === '' ? 'bg-[#959cf1]' : 'bg-[#5865f2] hover:bg-[#444ec1]'} text-white px-[13px] py-[5px] rounded-sm select-none`}
							disabled={inputValue === '' ? true : false}
						>
							Join clan
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FirstJoinPopup;
