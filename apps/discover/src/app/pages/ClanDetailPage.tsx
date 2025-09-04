import { Icons } from '@mezon/ui';
import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { useParams } from 'react-router-dom';
import ImageWithSkeleton from '../components/common/ImageWithSkeleton';
import { FacebookIcon, LightBulbIcon, RedditIcon, TwitterIcon, UserGroupIcon } from '../components/icons';
import { DEFAULT_IMAGES } from '../constants/constants';
import { useDiscover } from '../context/DiscoverContext';
import { useNavigation } from '../hooks/useNavigation';
import { ApiClanDiscover } from 'mezon-js/api.gen';


export default function ClanDetailPage() {
	const { id } = useParams();
	const { fetchSingleClan } = useDiscover();
	const [clan, setClan] = useState<ApiClanDiscover | null>(null);
	const [loading, setLoading] = useState(true);
	const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [isJoinOptionsOpen, setIsJoinOptionsOpen] = useState(false);
	const { toClanPage } = useNavigation();

	useEffect(() => {
		const loadClan = async () => {
			if (!id) return;
			
			setLoading(true);
			const clanData = await fetchSingleClan(id);
			setClan(clanData);
			setLoading(false);
		};

		loadClan();
	}, [id, fetchSingleClan]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865f2]"></div>
			</div>
		);
	}

	if (!clan) {
		return <div className="text-center py-20">Clan not found.</div>;
	}

	const chatty = (clan as any).chatty || 'Like a busy coffee shop';
	const createdAt = (clan as any).created_at || 'January 2nd, 2020';
	const features = [
		(clan as any).feature1 || 'Try out the official features of this clan!',
		(clan as any).feature2 || 'Weekly events and updates.',
		(clan as any).feature3 || 'Chat with other members about real-life projects.',
		(clan as any).feature4 || 'Ask questions and explore tips.'
	];
	const categories = (clan as any).categories || ['Science & Tech', 'Entertainment'];
	const socials = (clan as any).socials || [
		{ icon: <FacebookIcon />, url: 'https://www.facebook.com/mezonworld?locale=vi_VN' },
		{ icon: <RedditIcon />, url: '#' },
		{ icon: <TwitterIcon />, url: '#' }
	];
	const inviteLink = `https://mezon.ai/invite/${clan?.invite_id}`;
	const handleNavigate = () => {
		if (clan?.invite_id) {
			window.open(`https://mezon.ai/invite/${clan.invite_id}`, "_blank");
		}
	};

	const handleShare = () => {
		setIsShareDialogOpen(true);
	};

	const handleJoinOptions = () => {
		setIsJoinOptionsOpen(true);
	};

	const handleCopy = () => {

		navigator.clipboard
			.writeText(inviteLink)
			.then(() => {
				setIsCopied(true);
				setTimeout(() => setIsCopied(false), 2000);
			})
			.catch((err) => {
				console.error('Failed to copy: ', err);
			});
	};

	return (
		<>
			<div className="max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
				<div className="relative h-56 bg-gray-200">
					<ImageWithSkeleton
						src={clan.banner || DEFAULT_IMAGES.BANNER}
						alt="banner"
						className="w-full h-full object-cover"
					/>
					<div className="absolute left-8 -bottom-10 w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden border-4 border-white">
						<ImageWithSkeleton
							src={clan.clan_logo || DEFAULT_IMAGES.LOGO}
							alt="logo"
							className="w-full h-full object-cover"
							skeletonClassName="rounded-2xl"
						/>
					</div>
				</div>
				<div className="pt-14 px-8 pb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<h1 className="text-2xl font-bold text-gray-900">{clan.clan_name}</h1>
								{clan.verified && (
									<svg className="w-6 h-6 text-[#5865f2]" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clipRule="evenodd"
										></path>
									</svg>
								)}
							</div>
							<div className="text-gray-600 mb-2">{clan.description || 'No description.'}</div>
							<div className="flex items-center text-gray-500 text-[10px] sm:text-xs  mb-1">
								<div className="flex items-center">
									<svg
										className="mr-1"
										width="12"
										height="12"
										viewBox="0 0 12 12"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<circle
											cx="6"
											cy="6"
											r="5"
											stroke="#22c55e"
											strokeWidth="2"
											fill="none"
										>
											<animate
												attributeName="r"
												from="3"
												to="6"
												dur="1.5s"
												repeatCount="indefinite"
											/>
											<animate
												attributeName="opacity"
												from="1"
												to="0"
												dur="1.5s"
												repeatCount="indefinite"
											/>
										</circle>
										<circle cx="6" cy="6" r="3" fill="#22c55e" />
									</svg>

								</div>
								<span>{clan.total_members?.toLocaleString('en-US') || 0} Members</span>
							</div>
						</div>
						<div className="flex flex-col gap-2 min-w-[160px]">
							<button
								onClick={handleJoinOptions}
								className="bg-[#5865f2] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#4752c4]"
							>
								Join Clan
							</button>
							<button
								onClick={handleShare}
								className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 transition-colors"
							>
								Share Clan
							</button>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
						<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
							<Icons.IconChat className="w-6 h-6 text-[#5865f2]" />
							<div>
								<div className="font-semibold text-sm">How chatty?</div>
								<div className="text-xs text-gray-500">{chatty}</div>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
							<Icons.CalendarIcon className="w-6 h-6 text-[#5865f2]" />
							<div>
								<div className="font-semibold text-sm">Server created</div>
								<div className="text-xs text-gray-500">{createdAt}</div>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
							<LightBulbIcon className="w-6 h-6 text-[#5865f2]" />
							<div>
								<div className="font-semibold text-sm">Feature</div>
								<div className="text-xs text-gray-500">{features[0]}</div>
							</div>
						</div>
						<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
							<UserGroupIcon className="w-6 h-6 text-[#5865f2]" />
							<div>
								<div className="font-semibold text-sm">Community</div>
								<div className="text-xs text-gray-500">{features[1]}</div>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-between mt-6 gap-4">
						<div className="flex flex-wrap gap-2">
							{categories.map((cat: string, idx: number) => (
								<span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
									{cat}
								</span>
							))}
						</div>
						<div className="flex gap-2">
							{socials.map((s: any, idx: number) => (
								<a
									key={idx}
									href={s.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-[#5865f2] text-xl"
								>
									{s.icon}
								</a>
							))}
						</div>
					</div>
					<div className="mt-8">
						<h2 className="text-lg font-bold mb-2">About</h2>
						<div className="text-gray-700 text-sm">{clan.about || 'No additional information.'}</div>
					</div>
				</div>
			</div>

			{isShareDialogOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
						<button onClick={() => setIsShareDialogOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
							<Icons.Close className="w-6 h-6" />
						</button>

						<h2 className="text-xl font-bold mb-4">Share Clan</h2>

						<div className="mb-6">
							<p className="text-gray-600 mb-2">Share this clan with your friends</p>
							<div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
								<input
									type="text"
									value={`https://mezon.ai/invite/${clan?.invite_id}`}
									readOnly
									className="flex-1 bg-transparent outline-none text-sm"
								/>
								<button
									onClick={handleCopy}
									className={`flex items-center gap-1 px-3 py-1.5 rounded-md w-[80px] text-sm transition-colors ${isCopied ? 'bg-gray-200 text-gray-600' : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
										}`}
								>
									<Icons.CopyIcon className="w-4 h-4" />
									{isCopied ? 'Copied!' : 'Copy'}
								</button>
							</div>
						</div>
						<div className="flex justify-center gap-4">
							{socials.map((s: any, idx: number) => (
								<a
									key={idx}
									href={s.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-[#5865f2] text-2xl transition-colors"
								>
									{s.icon}
								</a>
							))}
						</div>
					</div>
				</div>
			)}

			{isJoinOptionsOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
						<button onClick={() => setIsJoinOptionsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
							<Icons.Close className="w-6 h-6" />
						</button>

						<h2 className="text-xl font-bold mb-4 text-center">Join Clan</h2>
						<p className="text-gray-600 mb-6 text-center">Choose how you want to join this clan</p>

						<div className="space-y-4">
							<div className="text-center p-4 border-2 border-gray-200 rounded-lg  transition-colors">
								<p className="text-gray-700 mb-3 font-medium">Scan QR Code</p>
								<div className="flex justify-center mb-3">
									<div className="bg-white p-3 rounded-lg shadow-sm border">
										<QRCode value={inviteLink} size={120} />
									</div>
								</div>
								<p className="text-xs text-gray-500">Use your phone camera to scan and join</p>
							</div>

							<div className="text-center p-4 border-2 border-gray-200 rounded-lg  transition-colors">
								<p className="text-gray-700 mb-3 font-medium">Open Link Directly</p>
								<button
									onClick={handleNavigate}
									className="bg-[#5865f2] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#4752c4] transition-colors w-full"
								>
									Join Now
								</button>
								<p className="text-xs text-gray-500 mt-2">Open in new tab</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

