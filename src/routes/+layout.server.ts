export const ssr = false;
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { client } from '$lib/graphql';
import { gql } from '@urql/svelte';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;
	if (
		!user &&
		!url.pathname.includes('/login') &&
		!url.pathname.includes('/api/health') &&
		!url.pathname.startsWith('/packages')
	) {
		throw redirect(302, '/login');
	}

	let configQuery = client.query(
		gql`
			query config($_or: [system_config_bool_exp!]) {
				system_config(where: { _or: $_or }, order_by: { user_id: asc_nulls_first }) {
					name
					type
					user_id
					json
				}
			}
		`,
		{
			_or: [locals?.user?.id ? { user_id: { _eq: locals?.user?.id } } : {}, { user_id: { _is_null: true } }]
		}
	);
	let configData = (await configQuery).data?.system_config;
	let config = {};
	configData?.forEach((item) => {
		config[`${item.name}_${item.type}`] = item?.json;
	});
	console.log('config layout', configData.length);

	return {
		config,
		user
	};
};
