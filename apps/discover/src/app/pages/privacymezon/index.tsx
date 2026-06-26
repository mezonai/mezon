import { useCallback, useMemo, useRef } from 'react';

const PrivacyMezonPage = () => {
	const introRef = useRef<HTMLDivElement | null>(null);
	const collectionRef = useRef<HTMLDivElement | null>(null);
	const logDataRef = useRef<HTMLDivElement | null>(null);
	const cookiesRef = useRef<HTMLDivElement | null>(null);
	const serviceProvidersRef = useRef<HTMLDivElement | null>(null);
	const securityRef = useRef<HTMLDivElement | null>(null);
	const linksRef = useRef<HTMLDivElement | null>(null);
	const childrenRef = useRef<HTMLDivElement | null>(null);
	const changesRef = useRef<HTMLDivElement | null>(null);
	const contactRef = useRef<HTMLDivElement | null>(null);

	const tocItems = useMemo(
		() => [
			{ id: 'intro', label: 'Introduction', ref: introRef },
			{ id: 'collection', label: 'Information Collection and Use', ref: collectionRef },
			{ id: 'log-data', label: 'Log Data', ref: logDataRef },
			{ id: 'cookies', label: 'Cookies', ref: cookiesRef },
			{ id: 'service-providers', label: 'Service Providers', ref: serviceProvidersRef },
			{ id: 'security', label: 'Security', ref: securityRef },
			{ id: 'links', label: 'Links to Other Sites', ref: linksRef },
			{ id: 'children', label: "Children's Privacy", ref: childrenRef },
			{ id: 'changes', label: 'Changes to This Privacy Policy', ref: changesRef },
			{ id: 'contact', label: 'Contact Us', ref: contactRef }
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
			<div className="bg-gradient-to-r from-[#8960e0] via-[#7e6eea] to-[#6e7cf3] text-white">
				<div className="max-w-5xl mx-auto px-6 py-12">
					<p className="uppercase tracking-[0.35em] text-sm font-semibold mb-4">Legal</p>
					<h1 className="text-4xl md:text-5xl font-bold leading-tight">Privacy Policy</h1>
					<p className="mt-4 text-white/80 text-lg max-w-3xl">
						Learn how we collect, use, and protect your personal information when you use Mezon.
					</p>
					<p className="mt-6 text-sm text-white/70">Effective as of 2024-03-01</p>
				</div>
			</div>

			<div className="bg-white border-b border-gray-100">
				<div className="max-w-5xl mx-auto px-6 py-4">
					<div className="flex flex-wrap gap-2">
						{tocItems.map((item) => (
							<button
								key={item.id}
								onClick={() => handleScrollToSection(item.id)}
								className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 py-12">
				<div className="prose prose-lg max-w-none select-text">
					<section className="mb-8" id="intro" ref={introRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Mezon</h2>
						<div className="space-y-4 text-gray-700 leading-relaxed text-lg select-text">
							<p>
								Mezon built the Mezon app as a Free app. This SERVICE is provided by Mezon at no cost and is intended for use as is.
							</p>
							<p>
								This page is used to inform visitors regarding our policies with the collection, use, and disclosure of Personal
								Information if anyone decided to use our Service.
							</p>
							<p>
								If you choose to use our Service, then you agree to the collection and use of information in relation to this policy.
								The Personal Information that we collect is used for providing and improving the Service. We will not use or share
								your information with anyone except as described in this Privacy Policy.
							</p>
							<p>
								The terms used in this Privacy Policy have the same meanings as in our Terms and Conditions, which are accessible at
								Mezon unless otherwise defined in this Privacy Policy.
							</p>
						</div>
					</section>

					<section className="mb-8" id="collection" ref={collectionRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Information Collection and Use</h2>
						<div className="space-y-4 text-gray-700 leading-relaxed text-lg select-text">
							<p>
								For a better experience, while using our Service, we may require you to provide us with certain personally
								identifiable information, including but not limited to Mezon. The information that we request will be retained by us
								and used as described in this privacy policy.
							</p>
							<p>The app does use third-party services that may collect information used to identify you.</p>
							<p>Link to the privacy policy of third-party service providers used by the app</p>
							<p>
								<a
									href="https://policies.google.com/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline font-medium"
								>
									Google Play Services
								</a>
							</p>
						</div>
					</section>

					<section className="mb-8" id="log-data" ref={logDataRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Log Data</h2>
						<p className="text-gray-700 leading-relaxed text-lg select-text">
							We want to inform you that whenever you use our Service, in a case of an error in the app we collect data and information
							(through third-party products) on your phone called Log Data. This Log Data may include information such as your device
							Internet Protocol ("IP") address, device name, operating system version, the configuration of the app when utilizing our
							Service, the time and date of your use of the Service, and other statistics.
						</p>
					</section>

					<section className="mb-8" id="cookies" ref={cookiesRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Cookies</h2>
						<div className="space-y-4 text-gray-700 leading-relaxed text-lg select-text">
							<p>
								Cookies are files with a small amount of data that are commonly used as anonymous unique identifiers. These are sent
								to your browser from the websites that you visit and are stored on your device's internal memory.
							</p>
							<p>
								This Service does not use these "cookies" explicitly. However, the app may use third-party code and libraries that use
								"cookies" to collect information and improve their services. You have the option to either accept or refuse these
								cookies and know when a cookie is being sent to your device. If you choose to refuse our cookies, you may not be able
								to use some portions of this Service.
							</p>
						</div>
					</section>

					<section className="mb-8" id="service-providers" ref={serviceProvidersRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Service Providers</h2>
						<div className="space-y-4 text-gray-700 leading-relaxed text-lg select-text">
							<p>We may employ third-party companies and individuals due to the following reasons:</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>To facilitate our Service;</li>
								<li>To provide the Service on our behalf;</li>
								<li>To perform Service-related services; or</li>
								<li>To assist us in analyzing how our Service is used.</li>
							</ul>
							<p>
								We want to inform users of this Service that these third parties have access to their Personal Information. The reason
								is to perform the tasks assigned to them on our behalf. However, they are obligated not to disclose or use the
								information for any other purpose.
							</p>
						</div>
					</section>

					<section className="mb-8" id="security" ref={securityRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Security</h2>
						<p className="text-gray-700 leading-relaxed text-lg select-text">
							We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means
							of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100%
							secure and reliable, and we cannot guarantee its absolute security.
						</p>
					</section>

					<section className="mb-8" id="links" ref={linksRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Links to Other Sites</h2>
						<p className="text-gray-700 leading-relaxed text-lg select-text">
							This Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note
							that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these
							websites. We have no control over and assume no responsibility for the content, privacy policies, or practices of any
							third-party sites or services.
						</p>
					</section>

					<section className="mb-8" id="children" ref={childrenRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Children's Privacy</h2>
						<p className="text-gray-700 leading-relaxed text-lg select-text">
							These Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information
							from children under 13 years of age. In the case we discover that a child under 13 has provided us with personal
							information, we immediately delete this from our servers. If you are a parent or guardian and you are aware that your
							child has provided us with personal information, please contact us so that we will be able to do the necessary actions.
						</p>
					</section>

					<section className="mb-8" id="changes" ref={changesRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Changes to This Privacy Policy</h2>
						<p className="text-gray-700 leading-relaxed text-lg select-text">
							We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any
							changes. We will notify you of any changes by posting the new Privacy Policy on this page.
						</p>
						<p className="text-gray-700 leading-relaxed mt-4 font-medium text-lg select-text">
							This policy is effective as of 2024-03-01
						</p>
					</section>

					<section className="mb-8" id="contact" ref={contactRef}>
						<h2 className="text-3xl font-semibold text-gray-900 mb-4 select-text">Contact Us</h2>
						<p className="text-gray-700 leading-relaxed text-lg select-text">
							If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at{' '}
							<a href="mailto:hello@mezon.vn" className="text-blue-600 hover:underline font-medium">
								hello@mezon.vn
							</a>
							.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
};

export default PrivacyMezonPage;
