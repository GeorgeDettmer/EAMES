export const ssr = false;
export const prerender = false;

export const load = ({ params, url }) => {
	return {
		kbId: params?.kbId
	};
};
