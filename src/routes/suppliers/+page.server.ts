import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	updateShipmentAllocation: async ({ cookies, request, locals }) => {
		const formData = await request.formData();
		const ois = formData.get('ois');
		const id = formData.get('id');
		const quantity = formData.get('quantity');
		console.log('updateShipmentAllocation', id, quantity);
		const result = await client.mutation(
			gql`
				mutation updateOrderItemShipmentAllocation($id: Int!, $quantity: Int!, $user_id: uuid!) {
					update_erp_orders_items_shipments_by_pk(
						pk_columns: { id: $id }
						_set: { quantity: $quantity, user_id: $user_id }
					) {
						id
					}
				}
			`,
			{ id, quantity, user_id: locals.user.id }
		);
		let data = result.data?.update_erp_orders_items_shipments_by_pk;
		console.log('updateShipmentAllocation', data.id, result?.error?.message);
		if (result?.error) {
			return {
				success: false,
				error: {
					type: 'database',
					message: result?.error?.message
				}
			};
		}
		return {
			success: true
		};
	}
} satisfies Actions;
