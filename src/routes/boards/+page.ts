import { graphql } from '$houdini';
//import type { BoardsVariables } from './$houdini';

export const _houdini_load = graphql(`
	query Boards {
		boards {
			id
			job {
				id
				batch
				quantity
				assembly {
					id
					name
					revision_external
					revision_internal
				}
				customer {
					id
					name
				}
			}
		}
	}
`);

/* export const _BoardsVariables: BoardsVariables = ({ params }) => {
	console.log('Ppppppppppppppp', params);
	return {
		id: 4
	};
}; */
