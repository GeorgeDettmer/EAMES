import { client } from '$lib/graphql';
import { gql } from '@urql/svelte';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';

export const actions = {
	// Creates as new shipment allocation/order item shipment
	createShipmentAllocation: async ({ cookies, request, locals }) => {
		const formData = await request.formData();
		const order_item_id = formData.get('order_item_id');
		const shipment_id = formData.get('shipment_id');
		const quantity = formData.get('quantity');
		console.log('createShipmentAllocation', order_item_id, shipment_id, quantity);
		if (!order_item_id || !shipment_id || !quantity) {
			console.error('createShipmentAllocation', 'Missing required fields');
			return fail(401, { message: 'Missing required fields' });
		}
		const result = await client.mutation(
			gql`
				mutation createOrderItemShipmentAllocation(
					$order_item_id: uuid!
					$shipment_id: Int!
					$quantity: Int
					$user_id: uuid
				) {
					insert_erp_orders_items_shipments_one(
						object: { order_item_id: $order_item_id, shipment_id: $shipment_id, quantity: $quantity, user_id: $user_id }
					) {
						id
						created_at
					}
				}
			`,
			{ order_item_id, shipment_id, quantity, user_id: locals.user.id }
		);
		let data = result.data?.insert_erp_orders_items_shipments_one;
		console.log('createShipmentAllocation', data?.error?.message);
		if (result?.error) {
			return fail(401, { message: 'Database Error: ' + result?.error?.message }); /* {
				success: false,
				error: {
					type: 'database',
					message: result?.error?.message
				}
			}; */
		}
		return {
			success: !result.data?.insert_erp_orders_items_shipments_one,
			data: result?.data
		};
	},
	//Removes a shipment allocation by id
	deleteShipmentAllocation: async ({ cookies, request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		console.log('removeShipmentAllocation', id);
		const result = await client.mutation(
			gql`
				mutation deleteOrderItemShipmentAllocation($id: Int!) {
					delete_erp_orders_items_shipments_by_pk(id: $id) {
						id
						shipment {
							id
							orders_items_shipments_aggregate {
								aggregate {
									count
								}
							}
						}
					}
				}
			`,
			{ id }
		);
		let data = result.data?.delete_erp_orders_items_shipments_by_pk;
		console.log('removeShipmentAllocation', data?.error?.message);
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
			success: !result.data?.delete_erp_orders_items_shipments_by_pk,
			data: result?.data
		};
	},
	// Updates an exising shipment allocation/order item shipment by id
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

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;
