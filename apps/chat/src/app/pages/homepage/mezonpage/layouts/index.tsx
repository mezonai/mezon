import { Icons, Image } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { RefObject, memo, useEffect, useRef, useState } from 'react';

interface LayoutProps {
	sideBarIsOpen: boolean;
}

const Layout = memo((props: LayoutProps) => {
	const { sideBarIsOpen } = props;
	return (
		<div>
			<section id="overview" className="flex flex-col items-center relative bg-[url('/assets/pattern.png')]">
				<div className="max-lg:hidden absolute top-0 left-0 translate-y-1/2 w-[400px] h-[400px] bg-[#8D72C5] rounded-full filter blur-[130px] mix-blend-color-dodge will-change-transform"></div>
				<div className="max-lg:hidden absolute right-0 translate-y-1/2 w-[400px] h-[400px] bg-[#8D72C5] rounded-full filter blur-[130px] mix-blend-color-dodge will-change-transform"></div>
				<div
					className={`w-10/12 pt-[50px] pb-[50px] flex flex-col gap-[64px] max-md:gap-[32px] max-lg:w-full max-lg:pt-[48px] max-lg:pb-[48px] max-md:px-[16px] ${sideBarIsOpen ? 'unset' : 'relative'}`}
				>
					<div className="md:px-[32px] flex flex-col gap-[20px] text-center">
						<div className="text-[36px] leading-[44px] font-semibold text-[#ffffff]">Overview </div>
						<div className="text-[20px] leading-[30px] font-normal text-white">
							<span className="text-[#8D5BDF]">Mezon</span> is a new way to communicate with your team.
							<br /> It's faster, better organized, better for WFH.{' '}
						</div>
					</div>
					<div className="md:px-[32px] flex items-stretch gap-[64px] max-lg:flex-col max-lg:gap-[32px]">
						<AnimatedSection
							delay={0}
							className="cursor-pointer border-[1px] p-[32px] max-lg:pr-[16px] max-lg:pl-[16px] flex flex-col items-center gap-[16px] border-[#4465FF4D] rounded-[12px] bg-[#0B0E2D] hover:bg-white group flex-1"
						>
							<div
								className="text-[26px] leading-[30px] font-semibold text-transparent group-hover:text-black"
								style={{
									background: 'linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%)',
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text'
								}}
							>
								Workstation
							</div>
							<Image src={`assets/workstation.png`} className="w-[100px] h-[100px]" />
							<div className="flex flex-col items-center gap-[20px] text-center flex-grow">
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									A digital workspace that streamlines communication, collaboration, and task management by integrating with various
									systems and tools. It provides structured spaces for teams, projects, and departments while ensuring seamless
									access to information and workflows
								</div>
							</div>
						</AnimatedSection>

						<AnimatedSection
							delay={300}
							className="cursor-pointer border-[1px] p-[32px] max-lg:pr-[16px] max-lg:pl-[16px] flex flex-col items-center gap-[16px] border-[#4465FF4D] rounded-[12px] hover:bg-white group bg-[#0B0E2D] flex-1"
						>
							<div
								className="text-[26px] leading-[30px] font-semibold text-transparent group-hover:text-black"
								style={{
									background: 'linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%)',
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text'
								}}
							>
								Ecosystem
							</div>
							<Image src={`assets/ecosytem.png`} className="w-[100px] h-[100px]" />
							<div className="flex flex-col items-center gap-[20px] text-center flex-grow">
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									A dynamic digital environment that combines work and social elements, offering interactive and recreational
									features. It supports virtual transactions, engagement activities, and community-building to enhance user
									experience.
								</div>
							</div>
						</AnimatedSection>
						<AnimatedSection
							delay={600}
							className="relative border-[1px] p-[32px] max-lg:pr-[16px] max-lg:pl-[16px] flex flex-col items-center gap-[16px] border-[#4465FF4D] rounded-[12px] hover:bg-white group bg-[#0B0E2D] flex-1"
						>
							<div
								className="text-[26px] leading-[30px] font-semibold text-transparent group-hover:text-black"
								style={{
									background: 'linear-gradient(349.47deg, #1D5AFA -9.25%, #F8E4F0 90.24%)',
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text'
								}}
							>
								AI Agent
							</div>
							<Image src={`assets/aiagent.png`} className="w-[100px] h-[100px]" />
							<div className="flex flex-col items-center gap-[20px] text-center flex-grow">
								<div className="text-[16px] leading-[24px] font-normal text-[#8FA7BF]">
									An intelligent system that automates tasks, assists with information management, and optimizes workflows. It
									enhances productivity through features like reminders, monitoring, and automated communication.
								</div>
							</div>
						</AnimatedSection>
					</div>
					<div className="hidden max-lg:block absolute right-0 bottom-0 w-[300px] h-[300px] bg-[#8D72C5] filter blur-[100px] mix-blend-color-dodge will-change-transform"></div>
				</div>
			</section>
			<section id="feature" className="flex flex-col items-center bg-[#ffffff]">
				<div
					className={`w-10/12 max-lg:w-full max-md:px-[16px] py-[96px] max-md:py-[48px] ${sideBarIsOpen ? 'unset' : 'relative'} ${sideBarIsOpen ? 'overflow-hidden' : ''}`}
				>
					<div className="flex flex-col items-center gap-[15px] max-lg:pb-[30px] pb-[45px] text-center">
						<h2
							className="tracking-[-.02em] text-center font-semibold text-[36px] leading-[44px] text-[#F4F7F9] md:px-[32px] text-black"
							data-e2e={generateE2eId('homepage.layout.title.features')}
						>
							Our features
						</h2>
						<div
							className="text-[26px] leading-[30px] font-light text-transparent text-center"
							style={{
								background: 'linear-gradient(90deg, #9C3FE9 0%, #1D5AFA 100%)',
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text'
							}}
						>
							Comprehensive Communication Tools
						</div>
					</div>
					<div className="flex flex-col items-center gap-[15px] text-cente h-100">
						<AnimatedSection delay={0} className="transition-all duration-700 ease-in-out">
							<Image src="assets/feature-bg.png" className="w-full h-auto lg:max-h-[700px] xl:max-h-[700px] object-contain" />
						</AnimatedSection>
					</div>

					<div className="md:px-[24px] max-md:mt-[32px] flex flex-col">
						<div className={`flex flex-col gap-[8px] ${sideBarIsOpen ? 'unset' : 'relative'}`}>
							<div className="flex max-md:flex-wrap gap-[14px] w-full items-stretch">
								<AnimatedSection
									delay={0}
									className="relative w-[50%] flex flex-col max-md:w-full rounded-[12px] overflow-hidden gap-[40px] border-[4px] border-transparent hover:border-[#8D5BDF]  max-md:rounded-[12px] max-md:gap-[20px] bg-cover bg-center bg-no-repeat max-md:bg-cover max-md:bg-top max-lg:bg-cover max-lg:bg-center cursor-pointer transition-all duration-300"
								>
									<Image src="assets/feature-mobile-mezon.png" className="block w-full h-full object-cover rounded-[8px]" />
									<div
										className="absolute top-[30px] left-1/2 transform -translate-x-1/2 text-transparent text-center"
										style={{
											background: 'linear-gradient(90deg, #9C3FE9 0%, #1D5AFA 100%)',
											WebkitBackgroundClip: 'text',
											backgroundClip: 'text'
										}}
									>
										<span className="text-[30px] leading-[48px] max-lg:text-[26px] font-bold">Mezon Mainnet </span>
										<br></br>
										<span className="md:mt-5 mt-10 text-[26px]  max-lg:text-[18px] font-normal leading-[24px]">
											The Zero-Fee, High-Speed Layer 1 <br></br>Blockchain
										</span>
									</div>
								</AnimatedSection>
								<AnimatedSection
									delay={0}
									className="relative w-[50%] flex flex-col max-md:w-full rounded-[12px] overflow-hidden gap-[40px] border-[4px] border-transparent hover:border-[#8D5BDF]  max-md:rounded-[12px] max-md:gap-[20px] bg-cover bg-center bg-no-repeat max-md:bg-cover max-md:bg-top max-lg:bg-cover max-lg:bg-center cursor-pointer transition-all duration-300"
								>
									<Image src="assets/feature-chat-mezon.png" className="block w-full h-full object-cover rounded-[8px]" />
									<div
										className="w-full absolute top-[30px] left-1/2 transform -translate-x-1/2 font-semibold text-transparent text-center"
										style={{
											background: 'linear-gradient(90deg, #9C3FE9 0%, #1D5AFA 100%)',
											WebkitBackgroundClip: 'text',
											backgroundClip: 'text'
										}}
									>
										<span className="text-[30px] max-lg:text-[26px] font-bold">Advanced Developer </span>
										<br></br>
										<span className="md:mt-5 mt-10 text-[26px] max-lg:text-[18px] font-normal leading-[24px]">API Platform</span>
									</div>
								</AnimatedSection>
							</div>

							<div className="flex max-md:flex-wrap gap-[14px] w-full items-stretch">
								<AnimatedSection
									delay={0}
									className="relative w-[50%] flex flex-col max-md:w-full rounded-[12px] overflow-hidden gap-[40px] border-[4px] border-transparent hover:border-[#8D5BDF]  max-md:rounded-[12px] max-md:gap-[20px] bg-cover bg-center bg-no-repeat max-md:bg-cover max-md:bg-top max-lg:bg-cover max-lg:bg-center cursor-pointer transition-all duration-300"
								>
									<Image src="assets/feature-gamming.png" className="block w-full h-full object-cover rounded-[8px]" />
									<div
										className="absolute top-[20px] right-[40px] font-semibold text-transparent text-right"
										style={{
											background: 'linear-gradient(90deg, #9C3FE9 0%, #1D5AFA 100%)',
											WebkitBackgroundClip: 'text',
											backgroundClip: 'text'
										}}
									>
										{' '}
										<span className="text-[45px] leading-[48px] max-lg:text-[26px] font-bold mr-20 max-lg:mr-2.5">Gaming</span>
										<br></br>
										<span className="md:mt-5 mt-10 text-[26px] max-lg:text-[18px] font-normal leading-[24px]">
											{' '}
											& Entertainment
										</span>
									</div>
								</AnimatedSection>
								<AnimatedSection
									delay={300}
									className="relative w-[50%] flex flex-col max-md:w-full rounded-[12px] overflow-hidden gap-[40px] border-[4px] border-transparent hover:border-[#8D5BDF]  max-md:rounded-[12px] max-md:gap-[20px] bg-cover bg-center bg-no-repeat max-md:bg-cover max-md:bg-top max-lg:bg-cover max-lg:bg-center cursor-pointer transition-all duration-300"
								>
									<Image src="assets/feature-clan.png" className="block w-full h-full object-cover rounded-[8px]" />
									<div
										className="absolute top-[20px] left-[90px] font-semibold text-transparent text-left"
										style={{
											background: 'linear-gradient(90deg, #9C3FE9 0%, #1D5AFA 100%)',
											WebkitBackgroundClip: 'text',
											backgroundClip: 'text'
										}}
									>
										{' '}
										<span className="text-[30px] leading-[48px] max-lg:text-[26px] font-bold">Customizable</span>
										<br></br>
										<span className="md:mt-5 mt-10 text-[26px] max-lg:text-[18px] font-normal leading-[24px] ml-10">
											{' '}
											& Scalable Platform
										</span>
									</div>
								</AnimatedSection>
							</div>

							{/* {!sideBarIsOpen && (
								<div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#8D72C5] rounded-full filter blur-[190px] mix-blend-color-dodge will-change-transform"></div>
							)} */}
						</div>
					</div>
					{/* {!sideBarIsOpen && (
						<div>
							<div className="hidden md:block absolute top-[8%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#8D72C5] rounded-full filter blur-[140px] mix-blend-color-dodge will-change-transform"></div>
							<div className="hidden max-md:block absolute top-0 right-1/2 w-[300px] h-[300px] bg-[#8D72C5] rounded-full filter blur-[130px] mix-blend-color-dodge will-change-transform"></div>
							<div className="hidden max-md:block absolute bottom-0 right-1/2 w-[300px] h-[300px] bg-[#8D72C5] rounded-full filter blur-[130px] mix-blend-color-dodge will-change-transform"></div>
							<div className="hidden max-md:block absolute top-[40%] right-0 w-[200px] h-[400px] bg-[#8D72C5] rounded-full filter blur-[100px] mix-blend-color-dodge will-change-transform"></div>
						</div>
					)} */}
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
			className={`text-[30px] font-semibold leading-[38px] text-center max-md:text-[20px] max-md:leading-[30px] text-transparent bg-[linear-gradient(349.47deg,_#1D5AFA_-9.25%,_#F8E4F0_90.24%)] ${className}`}
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
			className={`${className} transition-transform duration-700 ease-in-out will-change-transform will-change-opacity ${
				isVisible ? `translate-y-0 opacity-100` : 'translate-y-[20%] opacity-0'
			}`}
			style={{ transitionDelay: `${delay}ms`, ...style }}
		>
			{children}
		</div>
	);
};
