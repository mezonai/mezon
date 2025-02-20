import { Image } from '@mezon/ui';
import { Link } from 'react-router-dom';
import './styles.scss';

const Header = () => {
	return (
		<header className="header">
			<Link to={'/mezon'} className="flex items-center gap-[4.92px]">
				<Image src={`assets/images/mezon-logo-black.svg`} alt={'logoMezon'} width={32} height={32} className="aspect-square object-cover " />
				<div className="font-semibold text-[22.15px] leading-[26.58px] tracking-[0.06em] font-['Poppins'] text-white">mezon</div>
			</Link>
			<div className="text-white">
				{/* <button className="menu-button" aria-controls="user-nav" aria-expanded="false" aria-label="Bật tắt menu điều hướng">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" focusable="false" viewBox="0 0 16 16" className="icon-menu">
						<path fill="none" stroke="currentColor" strokeLinecap="round" d="M1.5 3.5h13m-13 4h13m-13 4h13"></path>
					</svg>
				</button> */}
				<nav className="user-nav">
					<a href="//feedback.discord.com/">Phản hồi</a>
					<div className="dropdown language-selector text-white">
						<button className="dropdown-toggle" aria-haspopup="true">
							Tiếng Việt
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="12"
								height="12"
								focusable="false"
								viewBox="0 0 12 12"
								className="dropdown-chevron-icon"
							>
								<path fill="none" stroke="currentColor" strokeLinecap="round" d="M3 4.5l2.6 2.6c.2.2.5.2.7 0L9 4.5"></path>
							</svg>
						</button>
						<span className="dropdown-menu dropdown-menu-end" role="menu">
							{['da', 'de', 'en-us', 'es', 'fr', 'hi-in', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-br', 'ru', 'sv', 'th', 'tr', 'zh-tw'].map(
								(lang) => (
									<a
										key={lang}
										href={`/hc/change_language/${lang}?return_to=%2Fhc%2F${lang}`}
										dir="ltr"
										rel="nofollow"
										role="menuitem"
									>
										{lang}
									</a>
								)
							)}
						</span>
					</div>
					<a className="submit-a-request" href="/hc/vi/requests/new">
						Gửi yêu cầu
					</a>
				</nav>
				<a
					className="sign-in"
					rel="nofollow"
					data-auth-action="signin"
					title="Mở hộp thoại"
					role="button"
					href="/hc/vi/signin?return_to=https%3A%2F%2Fsupport.discord.com%2Fhc%2Fvi"
				>
					Đăng nhập
				</a>
			</div>
		</header>
	);
};

export default Header;
