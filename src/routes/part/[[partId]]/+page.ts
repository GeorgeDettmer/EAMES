export const ssr = false;
export const prerender = false;

export const load = ({ params, url }) => {
	return {
		partId: params?.partId
	};
};
