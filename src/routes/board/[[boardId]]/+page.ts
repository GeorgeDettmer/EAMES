export const load = ({ params, url }) => {
	const searchParams = new URLSearchParams(
		[...url.searchParams].map(([key, value]) => [key.toLowerCase(), value])
	);
	return {
		boardId: params?.boardId,
		instructionId: searchParams.get('instructionid')
	};
};
