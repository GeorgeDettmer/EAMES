export const load = ({ params, url }) => {
	return {
		boardId: params?.boardId,
		instructionId: url.searchParams.get('instruction')
	};
};
