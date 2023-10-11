export const ssr = false;
export const prerender = false;

export const load = ({ params, url }) => {
	const searchParams = new URLSearchParams([...url.searchParams].map(([key, value]) => [key.toLowerCase(), value]));
	console.log('ASSEMBLY searchParams:', searchParams.get('jobid'));
	return {
		assemblyId: params?.assemblyId,
		jobId: searchParams.get('jobid')
	};
};
