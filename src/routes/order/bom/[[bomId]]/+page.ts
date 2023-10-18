export const ssr = false;
export const prerender = false;

export const load = ({ params, url }) => {
	const searchParams = new URLSearchParams([...url.searchParams].map(([key, value]) => [key.toLowerCase(), value]));
	console.log('ORDER BOM searchParams:', searchParams.get('jobid'));
	return {
		bomId: params?.bomId,
		jobId: searchParams.get('jobid')
	};
};
