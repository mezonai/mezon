import './styles.scss';

const Body = () => {
	return (
		<main role="main">
			<section id="main-content" className="section hero">
				<div className="hero-inner">
					<h1>Trung tâm Trợ Giúp</h1>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						focusable="false"
						viewBox="0 0 12 12"
						className="search-iconb"
						aria-hidden="true"
					>
						<circle cx="4.5" cy="4.5" r="4" fill="none" stroke="currentColor"></circle>
						<path stroke="currentColor" strokeLinecap="round" d="M11 11L7.5 7.5"></path>
					</svg>
					<form
						role="search"
						className="search search-full search-kb-fix"
						autoComplete="off"
						action="/hc/vi/search"
						acceptCharset="UTF-8"
						method="get"
					>
						<input name="utf8" type="hidden" value="✓" autoComplete="off" />
						<input type="search" name="query" id="query" placeholder="Tìm kiếm" autoComplete="off" aria-label="Tìm kiếm" />
						<input type="hidden" name="filter_by" value="knowledge_base" />
					</form>
				</div>
			</section>
			<section className="intro">
				<h1>Bạn cần trợ giúp? Chúng tôi luôn hỗ trợ bạn.</h1>
				<p>
					Từ cài đặt tài khoản đến quyền, hãy tìm trợ giúp cho mọi thứ trên Discord
					<br />
					Nếu bạn mới sử dụng Discord và đang tìm kiếm mẹo, hãy xem{' '}
					<a href="//support.discord.com/hc/articles/360045138571">Hướng dẫn dành cho người mới</a>
				</p>
			</section>
			<section className="category-grid">
				<ul className="flex-container">
					{[
						{
							href: '//support.discord.com/hc/vi/categories/115000193752',
							title: 'Thông báo',
							desc: 'Chúng tôi luôn lắng nghe. Sau đây là những điều bạn cần biết.'
						},
						{
							href: '//support.discord.com/hc/vi/categories/115000217151',
							title: 'Thông tin cơ bản về Discord',
							desc: 'Bắt đầu đúng cách! Không phải bên trái!'
						},
						{
							href: '//support.discord.com/hc/vi/categories/200404358',
							title: 'Cài đặt tài khoản',
							desc: 'Bạn là một bông tuyết đặc biệt và tài khoản của bạn cũng vậy.'
						},
						{
							href: '//support.discord.com/hc/vi/categories/200404378',
							title: 'Cài đặt máy chủ',
							desc: 'Gần như thú vị như trang trí nội thất.'
						}
					].map((item, index) => (
						<a key={index} href={item.href}>
							<li className="flex-item">
								<h2>{item.title}</h2>
								<hr />
								<h3>{item.desc}</h3>
							</li>
						</a>
					))}
				</ul>
			</section>
		</main>
	);
};

export default Body;
