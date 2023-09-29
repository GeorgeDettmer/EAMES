import { HASURA_URL } from '$env/static/private';
import { Client, fetchExchange } from '@urql/core';

export const client = new Client({
	url: HASURA_URL,
	exchanges: [fetchExchange],
	fetchOptions: () => {
		return {
			headers: {
				'x-hasura-admin-secret': 'cMJvwCG29qElvQ8mnouvac8BBDI0dCJT'
			}
		};
	}
});

/*
subscription MySubscription2 {
  boards(where: {id: {_in: [35, 36]}}) {
    id
    stepsByAssemblyId {
      id
      reference
      instruction {
        id
        name
      }
    }
    stepsByBoardId {
      reference
      id
      board_id
      instruction {
        id
        name
      }
      user {
        ...usersFragment
      }
    }
    assembly {
      id
      name
      revision_internal
      revision_external
      meta
      kb
    }
    signoffsByBoardId {
      step {
        reference
        instruction {
          id
          name
        }
      }
      user {
        ...usersFragment
      }
    }
  }
}

fragment usersFragment on users {
  id
  username
  first_name
  last_name
  initials
  color
  processes
}
*/
