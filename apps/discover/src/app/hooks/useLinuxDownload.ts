import { useEffect, useState } from 'react';

interface LinuxRelease {
	version: string;
	downloadUrl: string;
}

const releaseCdnUrl = 'https://cdn.komu.vn';
const manifestPath = '/release/latest-native-linux-x86_64.yml';
const manifestUrl = process.env.NODE_ENV === 'development' ? manifestPath : `${releaseCdnUrl}${manifestPath}`;
let releaseRequest: Promise<LinuxRelease | undefined> | undefined;

const loadLinuxRelease = () => {
	if (!releaseRequest) {
		releaseRequest = fetch(manifestUrl, { cache: 'no-cache' })
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch the Linux release: ${response.status}`);
				}

				const manifest = await response.text();
				const version = manifest.match(
					/^version:[ \t]*['"]?(\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?)['"]?[ \t]*(?:#.*)?\r?$/m
				)?.[1];
				if (!version) {
					throw new Error('The Linux release manifest has no valid version');
				}

				return {
					version,
					downloadUrl: `${releaseCdnUrl}/desktop/release/latest/mezon_${version}_amd64.deb`
				};
			})
			.catch((error) => {
				releaseRequest = undefined;
				console.error('Unable to load the latest Linux download', error);
				return undefined;
			});
	}

	return releaseRequest;
};

export const useLinuxDownload = () => {
	const [release, setRelease] = useState<LinuxRelease>();

	useEffect(() => {
		let active = true;
		loadLinuxRelease().then((latestRelease) => {
			if (active) {
				setRelease(latestRelease);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	return { version: release?.version, downloadUrl: release?.downloadUrl };
};
