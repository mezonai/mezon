import { Icons, Image } from '@mezon/ui';
import { RefObject, memo, useEffect, useRef, useState } from 'react';

interface LayoutProps {
	sideBarIsOpen: boolean;
}

const Layout = memo((props: LayoutProps) => {
	const { sideBarIsOpen } = props;

	return (
		<div>
			<section id="overview" className="flex flex-col items-center relative">
				<div className="max-lg:hidden absolute top-0 left-0 transform translate-y-1/2 w-[400px] h-[400px] bg-[#8D72C5] rounded-[50%] filter blur-[130px] mix-blend-color-dodge"></div>
				<div className="max-lg:hidden absolute right-0 transform translate-y-1/2 w-[400px] h-[400px] bg-[#8D72C5] rounded-[50%] filter blur-[130px] mix-blend-color-dodge"></div>
				<div
					className={`w-10/12 pt-96 pb-96 flex flex-col gap-[64px] max-md:gap-[32px] max-lg:w-full max-lg:pt-[48px] max-lg:pb-[48px] max-md:px-[16px] ${sideBarIsOpen ? 'unset' : 'relative'}`}
				>
					<div className="md:px-[32px] flex flex-col gap-[20px] text-center">
						<div className="text-[36px] leading-[44px] font-semibold text-[#F4F7F9]">Overview</div>
						<div className="text-[20px] leading-[30px] font-normal text-[#8FA7BF]">
							Mezon is a new way to communicate with your team.
							<br /> It's faster, better organized, better for WFH.{' '}
						</div>
					</div>
					<div className="md:px-[32px] flex items-stretch gap-[64px] max-lg:flex-col max-lg:gap-[32px]">
						<AnimatedSection
							delay={0}
							className="border-[1px] p-[32px] max-lg:pr-[16px] max-lg:pl-[16px] flex flex-col items-center gap-[16px] border-[#4465FF4D] rounded-[12px]"
							style={{ boxShadow: '0px 4px 90px 16px #22119280 inset' }}
						>
							<Image src={`assets/blockchain-intergration.svg`} />
							<div className="flex flex-col items-center gap-[20px] text-center">
								<div
									className="text-[20px] leading-[30px] font-semibold"
									style={{
										background: 'linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%)',
										WebkitBackgroundClip: 'text',
										backgroundClip: 'text',
										color: 'transparent',
										fontFamily: 'Poppins'
									}}
								>
									Workstation
								</div>
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									A digital workspace that streamlines communication, collaboration, and task management by integrating with various
									systems and tools. It provides structured spaces for teams, projects, and departments while ensuring seamless
									access to information and workflows
								</div>
							</div>
						</AnimatedSection>

						<AnimatedSection
							delay={300}
							className="border-[1px] p-[32px] max-lg:pr-[16px] max-lg:pl-[16px] flex flex-col items-center gap-[16px] border-[#4465FF4D] rounded-[12px]"
							style={{ boxShadow: '0px 4px 90px 16px #22119280 inset' }}
						>
							<Image src={`assets/developer-empowerment.svg`} />
							<div className="flex flex-col items-center gap-[20px] text-center">
								<div
									className="text-[20px] leading-[30px] font-semibold"
									style={{
										background: ' linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%',
										WebkitBackgroundClip: 'text',
										backgroundClip: 'text',
										color: 'transparent',
										fontFamily: 'Poppins'
									}}
								>
									Ecosystem
								</div>
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									A dynamic digital environment that combines work and social elements, offering interactive and recreational
									features. It supports virtual transactions, engagement activities, and community-building to enhance user
									experience.
								</div>
							</div>
						</AnimatedSection>
						<AnimatedSection
							delay={600}
							className="relative border-[1px] p-[32px] max-lg:pr-[16px] max-lg:pl-[16px] flex flex-col items-center gap-[16px] border-[#4465FF4D] rounded-[12px]"
							style={{ boxShadow: '0px 4px 90px 16px #22119280 inset' }}
						>
							<Image src={`assets/vision-for-the-future.svg`} />
							<div className="flex flex-col items-center gap-[20px] text-center">
								<div
									className="text-[20px] leading-[30px] font-semibold"
									style={{
										background: 'linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%)',
										WebkitBackgroundClip: 'text',
										backgroundClip: 'text',
										color: 'transparent',
										fontFamily: 'Poppins'
									}}
								>
									AI Agent
								</div>
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									An intelligent system that automates tasks, assists with information management, and optimizes workflows. It
									enhances productivity through features like reminders, monitoring, and automated communication.
								</div>
							</div>
						</AnimatedSection>
					</div>
					<div className="hidden max-lg:block absolute right-0 bottom-0 w-[300px] h-[300px] bg-[#8D72C5] filter blur-[100px] mix-blend-color-dodge"></div>
				</div>
			</section>
			<section id="feature" className="flex flex-col items-center">
				<div
					className={`w-10/12 max-lg:w-full max-md:px-[16px] py-[96px] max-md:py-[48px] ${sideBarIsOpen ? 'unset' : 'relative'} ${sideBarIsOpen ? 'overflow-hidden' : ''}`}
				>
					<h2 className="tracking-[-.02em] text-center font-semibold text-[36px] leading-[44px] text-[#F4F7F9] md:px-[32px] font-['Poppins']">
						Our features
					</h2>

					<div className="md:px-[32px] mt-[64px] max-md:mt-[32px] flex flex-col gap-[48px]">
						<div
							className="rounded-[20px] border p-[64px] bg-[#0B0E2D] border-[#4465FF4D] flex flex-col gap-[52px] max-md:rounded-[12px] max-md:py-[32px] max-md:px-[16px] max-md:gap-[20px]"
							style={{ boxShadow: '0px 4px 90px 16px #22119280 inset' }}
						>
							<HeaderFeature content="Comprehensive Communication Tools" className="px-[20px]" />
							<IconGrid />
						</div>

						<div className={`flex flex-col gap-[48px] ${sideBarIsOpen ? 'unset' : 'relative'}`}>
							<div className="flex max-md:flex-wrap gap-[48px] w-full">
								<AnimatedSection
									delay={0}
									className="w-[50%] flex flex-col max-md:w-full rounded-[20px] border border-[#4465FF4D] p-[64px] pb-0 h-fit gap-[40px] max-md:py-[32px] max-md:px-[16px] max-md:rounded-[12px] max-md:gap-[20px]"
									style={{
										background:
											window.innerWidth > 768 ? 'linear-gradient(142.48deg, #0A052C 44.04%, #221192 124.62%)' : '#0B0E2D'
									}}
								>
									<HeaderFeature
										content={
											<>
												Decentralized <br></br> Token-Based Economy
											</>
										}
									/>
									<Image src={`../../../assets/multiple-block.png`} />
								</AnimatedSection>
								<AnimatedSection
									delay={300}
									className="w-[50%] flex flex-col max-md:w-full rounded-[20px] border border-[#4465FF4D] p-[64px] pb-0 gap-[40px] max-md:py-[32px] max-md:px-[16px] max-md:rounded-[12px] max-md:gap-[20px] max-md:bg-[#0B0E2D]"
									style={{
										background: window.innerWidth > 768 ? 'linear-gradient(192.5deg, #0A052C 27.1%, #221192 137.4%)' : '#0B0E2D'
									}}
								>
									<HeaderFeature
										content={
											<>
												Advanced Developer <br></br> API Platform
											</>
										}
									/>
									<div className={`${sideBarIsOpen ? 'unset' : 'relative'} flex flex-col items-center justify-center w-full`}>
										<Image className="w-full" src={`../../../assets/multiple-conversation-reply.svg`} />
									</div>
								</AnimatedSection>
							</div>

							<div className="flex max-md:flex-wrap gap-[48px] w-full">
								<AnimatedSection
									delay={0}
									className={`w-[50%] flex flex-col max-md:w-full rounded-[20px] border border-[#4465FF4D] p-[64px] gap-[40px] max-md:py-[32px] max-md:px-[16px] max-md:rounded-[12px] max-md:gap-[20px] max-md:bg-[#0B0E2D] ${sideBarIsOpen ? 'unset' : 'relative'}`}
									style={{
										background: window.innerWidth > 768 ? 'linear-gradient(38.57deg, #0A052C 47.53%, #221192 124.01%)' : '#0B0E2D'
									}}
								>
									<HeaderFeature content="Gaming & Entertainment" />
									<div className="flex flex-col gap-[23px] max-md:gap-[12px] max-md:items-center">
										{['Game Rooms & Channels', 'Developer-Driven Game Creation', 'Token-Driven Gaming Economy'].map(
											(text, index) => (
												<div
													key={index}
													className="p-[16px] border border-[#4465FF4D] rounded-[8px] max-md:rounded-[6.67px] max-md:p-[13.33px] border-[0.83px] bg-[#0A052C] w-fit"
													style={{ boxShadow: '0px 4px 24px 16px rgba(34, 17, 146, 0.4) inset' }}
												>
													<span className="font-normal text-[20px] leading-[28px] text-[#92B8FF] max-md:text-[16.67px] max-md:leading-[23.33px]">
														{text}
													</span>
												</div>
											)
										)}
									</div>
									<Image
										src={`../../../assets/cube.png`}
										className="absolute bottom-[0] right-[0] max-md:bottom-[0] max-md:left-[0] max-md:w-[100px] max-md:h-[100px]"
									/>
									<Image
										src={`../../../assets/sword.png`}
										className="absolute md:top-[25%] right-[0] max-md:bottom-[0] max-md:right-[0] max-md:w-[95px] max-md:h-[95px]"
									/>
								</AnimatedSection>

								<AnimatedSection
									delay={300}
									className="w-[50%] flex flex-col items-center max-md:w-full rounded-[20px] border border-[#4465FF4D] p-[64px] gap-[40px] max-md:py-[32px] max-md:px-[16px] max-md:rounded-[12px] max-md:gap-[20px] max-md:bg-[#0B0E2D] max-md:shadow-[0px_4px_90px_16px_#22119280_inset] max-md:bg-[#0B0E2D]"
									style={{
										background:
											window.innerWidth > 768 ? 'linear-gradient(315.97deg, #0A052C 52.65%, #221192 113.54%)' : '#0B0E2D'
									}}
								>
									<HeaderFeature content="Customizable & Scalable Platform" />
									<div className="flex flex-col gap-[12px] p-[19.23px] rounded-[12px] border border-[#445FA34D] bg-[#0D0935] max-md:border-[1.2px] max-w-[241.39px]">
										<div className="font-semibold text-[12.38px] text-center leading-[14.85px] text-[#FFFFFF]">
											Customize Your Clan
										</div>
										<span className="font-normal text-[9.9px] leading-[11.88px] text-center text-[#FFFFFF]">
											Give your new clan a personality with a name and an icon. You can always change it later.
										</span>
										<div className="flex justify-center">
											<Icons.UploadImageIcon />
										</div>
										<div className="flex flex-col gap-[4.95px]">
											<span className="font-semibold text-[8.67px] leading-[10.4px] text-[#FFFFFF]">Clan Name</span>
											<div className="flex items-center p-[8.67px] rounded-[4.95px] border-[0.62px] bg-[#1B011A] border-[#535050] h-[27.33px]">
												<span className="font-normal text-[8.67px] leading-[10.4px] text-[#FFFFFF]">adeptus astartes</span>
											</div>
										</div>
										<div className="flex flex-col gap-[4.95px]">
											<span className="font-normal text-[9.9px] leading-[11.88px] text-[#FFFFFF]">
												By creating a clan, you agree to Mezon’s
											</span>
											<span className="font-normal text-[9.9px] leading-[11.88px] text-[#5865F2]">Community Guidelines.</span>
										</div>
										<button className="border-0 p-[7.43px] rounded-[618.32px] bg-[#4477FC] text-center font-semibold text-[11.14px] leading-[13.37px] text-[#FFFFFF] cursor-default">
											Create Clan
										</button>
									</div>
								</AnimatedSection>
							</div>

							{!sideBarIsOpen && (
								<div className="hidden md:block absolute top-2/4 left-2/4 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#8D72C5] rounded-[50%] filter blur-[190px] mix-blend-color-dodge"></div>
							)}
						</div>
					</div>

					{!sideBarIsOpen && (
						<div>
							<div className="hidden md:block absolute top-[8%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#8D72C5] rounded-[50%] filter blur-[140px] mix-blend-color-dodge"></div>
							<div className="hidden max-md:block absolute top-0 right-1/2 w-[300px] h-[300px] bg-[#8D72C5] rounded-[50%] filter blur-[130px] mix-blend-color-dodge"></div>
							<div className="hidden max-md:block absolute bottom-0 right-1/2 w-[300px] h-[300px] bg-[#8D72C5] rounded-[50%] filter blur-[130px] mix-blend-color-dodge"></div>
							<div className="hidden max-md:block absolute top-[40%] right-0 w-[200px] h-[400px] bg-[#8D72C5] rounded-[50%] filter blur-[100px] mix-blend-color-dodge"></div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
});

export default Layout;

interface HeaderFeatureProps {
	content: React.ReactNode;
	className?: string;
}

export const HeaderFeature: React.FC<HeaderFeatureProps> = ({ content, className }) => {
	return (
		<h3
			className={`text-[30px] font-semibold leading-[38px] text-center max-md:text-[20px] max-md:leading-[30px] text-transparent font-['Poppins'] bg-[linear-gradient(349.47deg,_#1D5AFA_-9.25%,_#F8E4F0_90.24%)] ${className}`}
			style={{
				WebkitBackgroundClip: 'text',
				backgroundClip: 'text'
			}}
		>
			{content}
		</h3>
	);
};

interface IconCardProps {
	icon: JSX.Element;
	label: string;
}

const IconCard: React.FC<IconCardProps> = ({ icon, label }) => {
	return (
		<div
			className="flex items-center gap-[16px] p-[16px] max-md:gap-[10px] border rounded-[8px] bg-[#0A052C] border-[#4465FF4D] w-fit max-md:rounded-[5px] max-md:border-[0.63px] max-md:p-[10px] h-[64px] max-md:h-[40px]
				shadow-[0px_4px_24px_16px_#22119266_inset] max-md:shadow-[0px_2.5px_15px_10px_#22119266_inset]"
		>
			{icon}
			<span className="font-normal leading-[37.33px] text-[24px] text-[#92B8FF] max-md:text-[15px] max-md:leading-[23.33px] whitespace-nowrap">
				{label}
			</span>
		</div>
	);
};

const IconGrid: React.FC = () => {
	const items = [
		{ icon: <Icons.MessageSquareIcon className="max-md:w-5" />, label: 'Text' },
		{ icon: <Icons.VoiceIcon className="max-md:w-5" />, label: 'Voice' },
		{ icon: <Icons.VideoIcon className="max-md:w-5" />, label: 'Video' },
		{ icon: <Icons.UserIcon className="max-md:w-5" />, label: 'Customizable roles & permissions' },
		{ icon: <Icons.Bell className="w-8 max-md:w-5 text-[#92B8FF]" />, label: 'Notification management' },
		{ icon: <Icons.PrivateChatIcon className="max-md:w-5" />, label: 'Private messaging' }
	];

	return (
		<div className="flex items-center justify-center flex-wrap gap-[23px] max-md:gap-[20px]">
			{items.map((item, index) => (
				<IconCard key={index} icon={item.icon} label={item.label} />
			))}
		</div>
	);
};

interface IntersectionOptions {
	root?: Element | null;
	rootMargin?: string;
	threshold?: number | number[];
}

export const useIntersectionObserver = (elementRef: RefObject<Element>, options: IntersectionOptions): boolean => {
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [hasAnimated, setHasAnimated] = useState<boolean>(false);

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			const [entry] = entries;
			if (entry.isIntersecting && !hasAnimated) {
				setIsVisible(true);
				setHasAnimated(true);
			}
		}, options);

		if (elementRef.current) {
			observer.observe(elementRef.current);
		}

		return () => {
			if (elementRef.current) {
				observer.unobserve(elementRef.current);
			}
		};
	}, [elementRef, options, hasAnimated]);

	return isVisible;
};

interface AnimatedSectionProps {
	children: React.ReactNode;
	delay: number;
	className?: string;
	style?: React.CSSProperties;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, delay, className, style }) => {
	const sectionRef = useRef<HTMLDivElement>(null);
	const isVisible = useIntersectionObserver(sectionRef, { threshold: 0.1 });

	return (
		<div
			ref={sectionRef}
			className={`${className} transition-transform duration-700 ease-in-out ${
				isVisible ? `translate-y-0 opacity-100` : 'translate-y-[20%] opacity-0'
			}`}
			style={{ transitionDelay: `${delay}ms`, ...style }}
		>
			{children}
		</div>
	);
};
