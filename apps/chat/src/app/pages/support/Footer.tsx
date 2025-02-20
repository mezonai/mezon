import './styles.scss';

const Footer = () => {
	return (
		<footer id="end" className="section">
			<div className="content">
				<div className="hook">
					<a href="https://discord.com/">
						<button className="button">Tìm hiểu thêm</button>
					</a>
					<div className="apps">
						{[
							{ href: '//discord.com/login', imgSrc: '/hc/theming_assets/01HZPN9MEJ9B5HWCW63TEGN73X' },
							{
								href: 'https://play.google.com/store/apps/details?id=com.discord',
								imgSrc: '/hc/theming_assets/01HZPN9MAAAW1Q31J9C5K1Z25N'
							},
							{
								href: 'https://itunes.apple.com/us/app/discord-chat-for-games/id985746746',
								imgSrc: '/hc/theming_assets/01HZPN9MV0KBR2G79CRKRBNT7K'
							},
							{ href: 'https://discord.com/api/download?platform=win', imgSrc: '/hc/theming_assets/01HZPN9P2RN0VATHN4QQN93HF9' },
							{ href: 'https://discord.com/api/download?platform=osx', imgSrc: '/hc/theming_assets/01HZPN9N6VBE1C6FNPCV8ZMSFA' }
						].map((app, index) => (
							<a key={index} href={app.href} className="apps-icon">
								<img src={app.imgSrc} alt="App icon" />
							</a>
						))}
					</div>
				</div>
				<nav className="nav">
					<div className="branding">
						<a href="//discord.com">
							<img src="/hc/theming_assets/01HZPN9W3DFW2SEB6K9A7BDNBJ" alt="Discord" width="130" height="36" />
						</a>
					</div>
					<div className="spacer"></div>
					<div className="links">
						{['Download', 'Help & Support', 'Feedback', 'Status'].map((text, index) => (
							<div key={index} className="links-item">
								<a href={`//discord.com/${text.toLowerCase().replace(/ /g, '')}`} className="link-a">
									{text}
								</a>
							</div>
						))}
						{['Partners', 'HypeSquad', 'Merch Store', 'Branding'].map((text, index) => (
							<div key={index} className="links-item">
								<a href={`//discordapp.com/${text.toLowerCase().replace(/ /g, '')}`} className="link-a">
									{text}
								</a>
							</div>
						))}
						<div className="links-item">
							<a href="//discordapp.com/company" className="link-a">
								Company
							</a>
						</div>
						<div className="links-item">
							<a href="//discordapp.com/company#join" className="link-a">
								Jobs
							</a>
							<span className="link-sep"> — </span>
							<span className="link-hiring">We're hiring</span>
						</div>
						<div className="links-item">
							<a href="//discord.com/blog" className="link-a">
								Blog
							</a>
						</div>
						<div className="links-item">
							<a href="//discordapp.com/tos" className="link-a">
								Terms
							</a>
							<span className="link-sep"> & </span>
							<a href="//discordapp.com/privacy" className="link-a">
								Privacy
							</a>
						</div>
					</div>
				</nav>
			</div>
		</footer>
	);
};

export default Footer;
