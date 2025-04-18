import { useAppNavigation } from '@mezon/core';
import { selectTheme } from '@mezon/store';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TypeSelectClan } from './types';
import { Button, Card } from 'flowbite-react';
import { Check } from 'libs/ui/src/lib/Icons';

type ModalSuccessProps = {
	name?: string;
	isModalTry?: boolean;
	clan?: TypeSelectClan;
};

const ModalSuccess = (props: ModalSuccessProps) => {
	const { name, isModalTry, clan } = props;
	const { toClanPage } = useAppNavigation();
	const navigate = useNavigate();
	const handleNavigate = () => {
		if (clan?.clanId) {
			window.location.href = `${process.env.NX_CHAT_APP_REDIRECT_URI}${toClanPage(clan.clanId)}`;
		}
	};

	const appearanceTheme = useSelector(selectTheme);

	return (
	<Card className="max-w-[440px] w-full rounded-md overflow-hidden border-0 bg-[#313338] text-white shadow-xl">
		<div className="p-8 flex flex-col items-center text-center space-y-5">
			<div className="w-20 h-20 rounded-full bg-[#23a55a] flex items-center justify-center animate-in zoom-in-50 duration-300">
				<Check className="h-10 w-10 text-white" />
			</div>
			<h2 className="text-xl font-bold text-white animate-in fade-in-50 duration-300 delay-100">Success!</h2>

			<p className="text-[#b9bbbe] animate-in fade-in-50 duration-300 delay-200">
				<span className="font-semibold text-white">{name}</span> has been authorised and added
				{clan?.clanName ? (
					<> to <span className="font-semibold text-white">{clan.clanName}</span></>
				) : (
					'.'
				)}
			</p>

			{clan?.clanName && (
				<Button
					onClick={handleNavigate}
					className="bg-[#5865f2] hover:bg-[#4752c4] text-white w-full mt-4 animate-in fade-in-50 duration-300 delay-300"
				>
					Go to <span className="font-bold ml-1">{clan.clanName}</span>
				</Button>
			)}

			<p className="text-xs text-[#b9bbbe] animate-in fade-in-50 duration-300 delay-400">You may now close this window or tab.</p>
		</div>
	</Card>
);

};

export default ModalSuccess;
