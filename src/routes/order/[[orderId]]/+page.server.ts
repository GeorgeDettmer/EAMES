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

export const load: PageServerLoad = async ({ params }) => {
	let order;
	let orderItemsQuery;
	if (params?.orderId) {
		console.log('params.orderId', params.orderId);
		let orderQuery = await client.query(
			gql`
				query order($orderId: bigint!) {
					erp_orders_by_pk(id: $orderId) {
						id
						kb
						reference
						jobs_orders {
							job {
								id
								batch
							}
						}
						orders_items(order_by: { created_at: asc_nulls_last }) {
							id
							created_at
							order_id
							part
							part_id
							spn
							category
							partByPartId {
								description
								name
							}
							price
							quantity
							user {
								id
								username
								first_name
								last_name
								initials
								color
							}
							orders_items_receiveds {
								id
								quantity
								created_at
								updated_at
								user {
									id
									username
									first_name
									last_name
									initials
									color
								}
							}
							orders_items_shipments {
								id
								quantity
								shipment {
									id
									expected_delivery_date
									carrier {
										id
										name
										image_url
									}
									tracking {
										id
										carrier_code
										tracking_number
										tracking_url
										status
									}
								}
							}
						}
						supplier {
							id
							name
						}
						user {
							id
							username
							first_name
							last_name
							initials
							color
						}
					}
				}
			`,
			{ orderId: Number(params.orderId) }
		);
		order = orderQuery?.data?.erp_orders_by_pk;

		orderItemsQuery = client.query(
			gql`
				query orderItems($orderId: bigint!) {
					erp_orders_items(where: { _eq: { id: $orderId } }) {
						id
						created_at
						order_id
						part
						part_id
						spn
						category
						partByPartId {
							description
							name
						}
						price
						quantity
						user {
							id
							username
							first_name
							last_name
							initials
							color
						}
						orders_items_receiveds {
							id
							quantity
							created_at
							updated_at
							user {
								id
								username
								first_name
								last_name
								initials
								color
							}
						}
						orders_items_shipments {
							id
							quantity
							shipment {
								id
								expected_delivery_date
								carrier {
									id
									name
									image_url
								}
								tracking {
									id
									carrier_code
									tracking_number
									tracking_url
									status
								}
							}
						}
					}
				}
			`,
			{ orderId: Number(params.orderId) }
		);
		console.log('order', order.user.id);
	}
	console.log('orders load:', order, orderItemsQuery);
	return {
		data: {
			order,
			orderItems: orderItemsQuery ? await orderItemsQuery : null
		}
	};
};
