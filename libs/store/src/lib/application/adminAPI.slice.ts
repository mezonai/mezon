export async function callApiAdmin<T>({
	path,
	data,
	token,
	decodeBody
}: {
	path: string;
	data: Uint8Array;
	token: string;
	decodeBody: (data: Uint8Array) => T;
}): Promise<T> {
	try {
		const response = await fetch(`https://${process.env.NX_CHAT_APP_API_HOST}:${process.env.NX_CHAT_APP_API_PORT}${path}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/proto',
				'Content-Type': 'application/proto'
			},
			body: Uint8Array.from(data)
		});

		if (response.status === 401) {
			const err = new Error(`HTTP ${path} 401`) as Error & {
				status: number;
			};

			err.status = 401;
			throw err;
		}

		if (!response.ok) {
			const detail = (await response.text().catch(() => '')).trim();
			const message = detail || `HTTP ${path} ${response.status}`;

			const err = new Error(message) as Error & {
				status: number;
			};

			err.status = response.status;
			throw err;
		}

		const buffer = await response.arrayBuffer();

		return decodeBody(new Uint8Array(buffer));
	} catch (error) {
		console.error('callApiAdmin error:', error);
		throw error;
	}
}
