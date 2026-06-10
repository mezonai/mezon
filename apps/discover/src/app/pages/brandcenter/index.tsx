'use client';

import { useCallback, useMemo, useRef } from 'react';

const BrandCenterPage = () => {
	const introRef = useRef<HTMLDivElement | null>(null);
	const guidelinesRef = useRef<HTMLDivElement | null>(null);
	const dosRef = useRef<HTMLDivElement | null>(null);
	const dontsRef = useRef<HTMLDivElement | null>(null);
	const legalRef = useRef<HTMLDivElement | null>(null);
	const downloadRef = useRef<HTMLDivElement | null>(null);
	const contactRef = useRef<HTMLDivElement | null>(null);

	const tocItems = useMemo(
		() => [
			{ id: 'intro', label: 'Introduction', ref: introRef },
			{ id: 'guidelines', label: 'General Guidelines', ref: guidelinesRef },
			{ id: 'dos', label: "Do's", ref: dosRef },
			{ id: 'donts', label: "Don'ts", ref: dontsRef },
			{ id: 'legal', label: 'Legal', ref: legalRef },
			{ id: 'download', label: 'Download Resources', ref: downloadRef },
			{ id: 'contact', label: 'Contact', ref: contactRef }
		],
		[]
	);

	const handleScrollToSection = useCallback(
		(id: string) => {
			const target = tocItems.find((item) => item.id === id);
			if (target?.ref.current) {
				target.ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		},
		[tocItems]
	);

	return (
		<div className="min-h-screen bg-white">
			<div className="bg-gradient-to-br from-[#6B5FE0] via-[#7B68E8] to-[#5A6FE8] text-white relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-48 -mt-48 blur-3xl" />
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-white/5 to-transparent rounded-full -ml-40 -mb-40 blur-3xl" />

				<div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
					<div className="space-y-6">
						<p className="uppercase tracking-widest text-sm font-medium text-white/70 select-text">Brand Guidelines</p>
						<h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance select-text">Mezon Brand Center</h1>
						<p className="text-xl text-white/85 max-w-2xl leading-relaxed font-light select-text">
							Official brand assets and guidelines for partners, developers, and community members.
						</p>
					</div>

					<div className="mt-12 pt-8 border-t border-white/10">
						<p className="text-white/75 text-base leading-relaxed max-w-4xl select-text">
							The Mezon brand is more than just a name — it represents a collection of values, emotions, and design principles that
							capture the spirit of human connection. Using it consistently reinforces our promise: to connect people through
							simplicity, authenticity, and real-time communication.
						</p>
					</div>
				</div>
			</div>

			<div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex flex-wrap gap-2">
						{tocItems.map((item) => (
							<button
								key={item.id}
								onClick={() => handleScrollToSection(item.id)}
								className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gradient-to-r hover:from-[#6B5FE0] hover:to-[#5A6FE8] hover:text-white rounded-full transition-all duration-300 ease-out hover:shadow-md"
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-6 py-16">
				<div className="space-y-20">
					<section id="intro" ref={introRef} className="scroll-mt-24">
						<div className="space-y-6">
							<h2 className="text-4xl font-bold text-gray-900 select-text">Introduction</h2>
							<div className="w-12 h-1 bg-gradient-to-r from-[#6B5FE0] to-[#5A6FE8] rounded-full" />
							<div className="space-y-5 text-gray-700 leading-relaxed select-text">
								<p className="text-lg">
									By downloading or using any of the Mezon brand assets ("Mezon Brand Resources"), you agree to follow all the
									guidelines below ("Guidelines"). These resources are provided to help partners, developers, media outlets, and
									community members accurately represent Mezon in their communications.
								</p>
								<p className="text-lg">
									These Guidelines explain how you may and may not use Mezon's brand assets for marketing, communication, or
									partnership purposes. They also include legal disclosures to help ensure that Mezon's visual and verbal identity
									is always represented with consistency, accuracy, and respect. By using our brand assets, you also agree to our{' '}
									<a
										href="/terms-of-service"
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#6B5FE0] hover:text-[#5A6FE8] font-semibold hover:underline transition-colors"
									>
										Terms of Service
									</a>{' '}
									and{' '}
									<a
										href="/privacy-policy"
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#6B5FE0] hover:text-[#5A6FE8] font-semibold hover:underline transition-colors"
									>
										Privacy Policy
									</a>
									.
								</p>
								<p className="text-lg">
									Our brand represents our commitment to creating meaningful connections through technology. Every element—from our
									logo to our color palette—has been carefully designed to reflect our values of simplicity, authenticity, and
									innovation. When you use our brand assets, you become part of telling the Mezon story.
								</p>
							</div>
						</div>
					</section>

					<section id="guidelines" ref={guidelinesRef} className="scroll-mt-24">
						<div className="space-y-8">
							<div>
								<h2 className="text-4xl font-bold text-gray-900 select-text">General Guidelines</h2>
								<div className="w-12 h-1 bg-gradient-to-r from-[#6B5FE0] to-[#5A6FE8] rounded-full mt-4" />
								<p className="text-lg text-gray-700 leading-relaxed mt-6 select-text">
									These guidelines are designed to help you use Mezon's brand assets correctly and effectively. Following these
									principles ensures that our brand remains strong, recognizable, and consistent across all platforms and materials.
								</p>
							</div>

							<div id="dos" ref={dosRef} className="scroll-mt-24 pt-8">
								<h3 className="text-3xl font-bold text-gray-900 mb-2 select-text">Do's</h3>
								<div className="h-1 w-12 bg-green-500 rounded-full mb-8" />
								<div className="space-y-5">
									{[
										{
											title: 'Use Official Assets Only',
											desc: "Always download and use the official Mezon name, logos, and brand assets found exclusively on this Mezon Brand Resources page. We regularly update these resources to reflect our current brand standards, so please ensure you're using the most recent version available. Never recreate or approximate our logos from memory or screenshots."
										},
										{
											title: 'Maintain Proper Capitalization',
											desc: 'When referring to Mezon in text, always capitalize the "M" and write it as "Mezon" — never as "mezon", "MEZON", or any other variation. Do not abbreviate the name or create shortened versions. This consistency helps maintain our brand identity across all communications.'
										},
										{
											title: 'Use Text, Not Logos, in Sentences',
											desc: 'Display the word "Mezon" in the same font size, weight, and style as the surrounding text. Never substitute the Mezon logo for the word "Mezon" within body copy or headlines. The logo should be used as a standalone visual element, not as a replacement for text.'
										},
										{
											title: 'Provide Adequate Spacing',
											desc: 'Give our logo room to breathe. Maintain clear space around the logo equal to at least the height of the "M" in Mezon. This ensures the logo remains prominent and isn\'t crowded by other design elements, text, or competing visuals.'
										},
										{
											title: 'Use Approved Color Schemes',
											desc: 'Use only the official Mezon colors as specified in our brand guidelines. Our primary color palette has been carefully selected to represent our brand identity. When displaying our logo on colored backgrounds, ensure sufficient contrast for legibility.'
										}
									].map((item, idx) => (
										<div
											key={idx}
											className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all duration-300 select-text"
										>
											<p className="font-semibold text-gray-900 text-lg mb-3">{item.title}</p>
											<p className="text-gray-700 leading-relaxed">{item.desc}</p>
										</div>
									))}
								</div>
							</div>

							<div id="donts" ref={dontsRef} className="scroll-mt-24 pt-8">
								<h3 className="text-3xl font-bold text-gray-900 mb-2 select-text">Don'ts</h3>
								<div className="h-1 w-12 bg-red-500 rounded-full mb-8" />
								<div className="space-y-5">
									{[
										{
											title: "Don't Create Confusing Variations",
											desc: 'Do not use other trademarks, domain names, social media handles, or logos that could be confused with or mistaken for the official Mezon brand. This includes creating similar-sounding names, lookalike logos, or any branding that might mislead users into thinking they are interacting with official Mezon services.'
										},
										{
											title: "Don't Modify the Logo",
											desc: "Do not alter, stretch, compress, rotate, or otherwise distort the Mezon logo. Do not change the logo's colors, add effects (such as shadows, glows, or gradients), or combine it with other design elements. Do not place the logo on busy, low-contrast, or inappropriate backgrounds that reduce legibility or visual impact."
										},
										{
											title: "Don't Associate with Inappropriate Content",
											desc: "Do not use the Mezon brand in connection with content that is offensive, discriminatory, illegal, misleading, defamatory, or otherwise inconsistent with Mezon's values and community standards. This includes but is not limited to hate speech, violence, adult content, or any material that could harm Mezon's reputation."
										},
										{
											title: "Don't Imply Endorsement or Partnership",
											desc: "Do not use Mezon's brand assets in a way that suggests sponsorship, endorsement, or an official partnership with Mezon unless you have explicit written permission. Do not make your product, service, or content appear to be an official Mezon offering."
										},
										{
											title: "Don't Use as Your Primary Branding",
											desc: 'The Mezon logo and brand assets should not be the most prominent visual element in your marketing materials. Your own brand should always be more prominent than the Mezon brand when used in your communications.'
										}
									].map((item, idx) => (
										<div
											key={idx}
											className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200 hover:border-red-300 hover:shadow-md transition-all duration-300 select-text"
										>
											<p className="font-semibold text-gray-900 text-lg mb-3">{item.title}</p>
											<p className="text-gray-700 leading-relaxed">{item.desc}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					</section>

					<section id="legal" ref={legalRef} className="scroll-mt-24">
						<div className="space-y-8">
							<div>
								<h2 className="text-4xl font-bold text-gray-900 select-text">Legal Information</h2>
								<div className="w-12 h-1 bg-gradient-to-r from-[#6B5FE0] to-[#5A6FE8] rounded-full mt-4" />
							</div>

							<div className="space-y-5 text-gray-700 leading-relaxed select-text">
								<p className="text-lg">
									Mezon invests significant time, effort, and resources into the development and protection of its intellectual
									property. All logos, wordmarks, trademarks, trade dress, and visual symbols associated with Mezon are owned
									exclusively by Mezon and are protected under applicable trademark, copyright, and intellectual property laws.
								</p>
								<p className="text-lg">
									These brand assets may only be used in accordance with these Guidelines or with explicit written permission from
									Mezon. Any unauthorized use may violate trademark, copyright, and other applicable laws and could result in legal
									action.
								</p>
							</div>

							<div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg select-text">
								<h4 className="font-semibold text-gray-900 mb-6 text-xl">You May Not:</h4>
								<ul className="space-y-4 text-gray-700">
									{[
										'Register, claim, or imply ownership of any trademark, company name, domain name, social media handle, or username that incorporates "Mezon" or could be confused with the Mezon brand.',
										'Use Mezon trademarks in any manner that is confusingly similar to, dilutive of, or disparaging to the Mezon brand or its reputation.',
										'Incorporate Mezon trademarks into your own product names, service names, trademarks, logos, or company names.',
										<>
											Use Mezon's brand assets in ways that violate our{' '}
											<a
												href="/terms-of-service"
												target="_blank"
												rel="noopener noreferrer"
												className="text-[#6B5FE0] hover:text-[#5A6FE8] font-semibold hover:underline transition-colors"
											>
												Terms of Service
											</a>
											,{' '}
											<a
												href="/privacy-policy"
												target="_blank"
												rel="noopener noreferrer"
												className="text-[#6B5FE0] hover:text-[#5A6FE8] font-semibold hover:underline transition-colors"
											>
												Privacy Policy
											</a>
											, Community Guidelines, or any applicable laws and regulations.
										</>,
										"Display Mezon's brand assets in a manner that implies a relationship, affiliation, endorsement, or sponsorship between you or your products/services and Mezon that does not exist."
									].map((item, idx) => (
										<li key={idx} className="flex gap-4">
											<span className="text-[#6B5FE0] font-bold flex-shrink-0 text-lg">→</span>
											<span className="leading-relaxed">{item}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="space-y-5 text-gray-700 leading-relaxed select-text">
								<p className="text-lg">
									Mezon reserves the right to review, revoke, or deny permission to use its brand assets at any time, for any
									reason, including but not limited to use that is inconsistent with our brand identity, values, or these
									Guidelines. We may modify these Guidelines at any time, and any such modifications will be effective immediately
									upon posting.
								</p>
								<p className="text-lg">
									If you become aware of any misuse of Mezon's brand assets, please report it to us at{' '}
									<a
										href="mailto:hello@mezon.vn"
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#6B5FE0] hover:text-[#5A6FE8] font-semibold hover:underline transition-colors"
									>
										hello@mezon.vn
									</a>
									.
								</p>
							</div>
						</div>
					</section>

					<section id="download" ref={downloadRef} className="scroll-mt-24">
						<div className="space-y-8">
							<div>
								<h2 className="text-4xl font-bold text-gray-900 select-text">Download Brand Resources</h2>
								<div className="w-12 h-1 bg-gradient-to-r from-[#6B5FE0] to-[#5A6FE8] rounded-full mt-4" />
								<p className="text-lg text-gray-700 leading-relaxed mt-6 select-text">
									Our comprehensive brand resource kit contains everything you need to accurately represent Mezon in your
									communications. By downloading these assets, you agree to comply with all the guidelines outlined on this page.
								</p>
							</div>

							<div className="bg-gradient-to-br from-[#6B5FE0]/5 via-[#5A6FE8]/5 to-[#7B68E8]/5 p-10 rounded-2xl border border-[#6B5FE0]/20 hover:border-[#6B5FE0]/40 hover:shadow-xl transition-all duration-300 select-text">
								<h3 className="text-3xl font-bold text-gray-900 mb-6">Complete Brand Resource Kit</h3>
								<p className="text-lg text-gray-700 mb-8 leading-relaxed">The complete kit includes:</p>
								<ul className="space-y-4 mb-10 text-gray-700">
									{[
										{
											title: 'Mezon Logos & Icons',
											desc: 'Full-color, monochrome, and icon-only versions in AI, PNG, and SVG formats for print and digital use'
										},
										{
											title: 'Color Palette Guide',
											desc: 'Complete brand color specifications including HEX, RGB, CMYK values for our primary and secondary color palettes'
										}
									].map((item, idx) => (
										<li key={idx} className="flex gap-4">
											<span className="text-[#6B5FE0] font-bold text-lg flex-shrink-0">✓</span>
											<div>
												<p className="font-semibold text-gray-900">{item.title}</p>
												<p className="text-gray-600 text-sm mt-1">{item.desc}</p>
											</div>
										</li>
									))}
								</ul>
								<a
									href={`${process.env.NX_BASE_IMG_URL}/landing-page-mezon/Mezon-Brand-Resource.zip`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<div className="flex justify-center pt-4">
										<button className="px-10 py-4 bg-gradient-to-r from-[#6B5FE0] to-[#5A6FE8] text-white text-lg font-semibold rounded-lg hover:shadow-xl hover:shadow-[#6B5FE0]/20 transition-all duration-300 transform hover:scale-105 active:scale-95">
											Download Complete Brand Resource Kit
										</button>
									</div>
								</a>
							</div>

							<p className="text-gray-600 text-base select-text">
								Resources are regularly updated to reflect our current brand standards. We recommend checking back periodically to
								ensure you have the latest versions.
							</p>
						</div>
					</section>

					<section id="contact" ref={contactRef} className="scroll-mt-24 pb-8">
						<div className="space-y-8">
							<div>
								<h2 className="text-4xl font-bold text-gray-900 select-text">Questions & Contact</h2>
								<div className="w-12 h-1 bg-gradient-to-r from-[#6B5FE0] to-[#5A6FE8] rounded-full mt-4" />
							</div>

							<p className="text-lg text-gray-700 leading-relaxed select-text">
								We're here to help ensure you use our brand assets correctly and effectively. If you have questions about using the
								Mezon brand, need clarification on these guidelines, or require special permission for a specific use case that falls
								outside these guidelines, please don't hesitate to reach out.
							</p>

							<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 select-text">
								<p className="font-semibold text-gray-900 mb-4 text-xl">Contact our Brand Team:</p>
								<a
									href="mailto:hello@mezon.vn"
									target="_blank"
									rel="noopener noreferrer"
									className="text-2xl font-bold text-[#6B5FE0] hover:text-[#5A6FE8] transition-colors hover:underline"
								>
									hello@mezon.vn
								</a>
							</div>

							<p className="text-gray-600 text-base select-text">
								Please allow 3-5 business days for a response. For urgent requests, please indicate "URGENT" in your email subject
								line.
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
};

export default BrandCenterPage;
