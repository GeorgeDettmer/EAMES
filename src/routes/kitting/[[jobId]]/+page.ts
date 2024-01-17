export const ssr = false;
export const prerender = false;

export const load = ({ params, url }) => {
	const searchParams = new URLSearchParams([...url.searchParams].map(([key, value]) => [key.toLowerCase(), value]));
	return {
		jobId: params?.jobId,
		batchId: searchParams?.batch
	};
};
