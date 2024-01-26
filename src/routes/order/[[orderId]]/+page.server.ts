import { client } from '$lib/graphql';
import { gql } from '@urql/svelte';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { isValidUrl } from '$lib/utils';

//TODO: Break out into separate functions
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
	},
	updateShipment: async ({ cookies, request, locals }) => {
		const formData = await request.formData();

		//Shipment
		let shipment_id = formData.get('shipment_id');
		let carrier_id = formData.get('carrier_id');
		const expected_delivery_date = formData.get('expected_delivery_date');
		const confirmed_delivery_date = formData.get('confirmed_delivery_date');
		const confirmed_delivery_user_id = formData.get('confirmed_delivery_date');
		carrier_id = carrier_id || null;
		//Tracking:
		let tracking_id = formData.get('tracking_id');
		const carrier_code = String(formData.get('carrier_code') || '');
		const tracking_number = String(formData.get('tracking_number') || '');
		const tracking_url = String(formData.get('tracking_url') || '');

		console.log('?updateShipment', {
			shipment_id,
			carrier_id,
			expected_delivery_date,
			confirmed_delivery_date,
			confirmed_delivery_user_id,
			tracking_id,
			tracking_number,
			tracking_url
		});

		let trackingResult;
		//If tracking ID supplied, update existing tracking entry with supplied details
		if (tracking_id) {
			trackingResult = await client.mutation(
				gql`
					mutation updateTrackingById(
						$id: Int!
						$tracking_number: String
						$carrier_code: String
						$tracking_url: String
						$user_id: uuid
					) {
						update_erp_trackings_by_pk(
							pk_columns: { id: $id }
							_set: {
								carrier_code: $carrier_code
								tracking_number: $tracking_number
								tracking_url: $tracking_url
								user_id: $user_id
							}
						) {
							id
							carrier_code
							tracking_number
							tracking_url
							user_id
						}
					}
				`,
				{ id: tracking_id, carrier_code, tracking_number, tracking_url, user_id: locals.user.id }
			);
			if (trackingResult?.error) fail(400, { error: trackingResult?.error?.message });
			trackingResult = trackingResult.data?.update_erp_trackings_by_pk;
		} else {
			//If no tracking ID supplied, create new tracking with supplied details
			trackingResult = await client.mutation(
				gql`
					mutation insertTracking($carrier_code: String, $tracking_number: String, $tracking_url: String!, $user_id: uuid) {
						insert_erp_trackings_one(
							object: {
								carrier_code: $carrier_code
								tracking_number: $tracking_number
								tracking_url: $tracking_url
								user_id: $user_id
							}
						) {
							id
							carrier_code
							tracking_number
							tracking_url
						}
					}
				`,
				{
					carrier_code,
					tracking_number,
					tracking_url: isValidUrl(tracking_url) ? tracking_url : '',
					user_id: locals.user.id
				}
			);
			if (trackingResult?.error) console.error(400, { error: trackingResult?.error?.message });
			trackingResult = trackingResult.data?.insert_erp_trackings_one;
		}
		tracking_id = trackingResult?.id;
		/* 		if (!tracking_id)
			console.error(500, { error: 'No tracking id was returned from tracking insert/update queries...', trackingResult });*/

		let shipmentResult;
		//If shipment ID supplied, update existing shipment and set tracking_id
		if (shipment_id) {
			console.log('updateShipmentById', {
				id: shipment_id,
				carrier_id,
				tracking_id,
				expected_delivery_date,
				confirmed_delivery_date,
				confirmed_delivery_user_id
			});
			shipmentResult = await client.mutation(
				gql`
					mutation updateShipmentById(
						$id: bigint!
						$carrier_id: String
						$tracking_id: bigint
						$expected_delivery_date: timestamptz
						$confirmed_delivery_date: timestamptz
						$confirmed_delivery_user_id: uuid
					) {
						update_erp_shipments_by_pk(
							pk_columns: { id: $id }
							_set: {
								carrier_id: $carrier_id
								tracking_id: $tracking_id
								expected_delivery_date: $expected_delivery_date
								confirmed_delivery_date: $confirmed_delivery_date
								confirmed_delivery_user_id: $confirmed_delivery_user_id
							}
						) {
							id
							carrier_id
							tracking_id
							expected_delivery_date
							confirmed_delivery_date
							confirmed_delivery_user_id
						}
					}
				`,
				{
					id: shipment_id,
					carrier_id,
					tracking_id,
					expected_delivery_date,
					confirmed_delivery_date,
					confirmed_delivery_user_id
				}
			);
			if (shipmentResult?.error) console.error(400, { error: shipmentResult?.error?.message });
			shipmentResult = shipmentResult.data?.update_erp_shipments_by_pk;
		} else {
			//If no shipment ID supplied, create new shipment with tracking_id set
			shipmentResult = await client.mutation(
				gql`
					mutation insertShipment(
						$id: bigint!
						$carrier_id: String
						$tracking_id: bigint
						$expected_delivery_date: timestamptz
						$confirmed_delivery_date: timestamptz
						$confirmed_delivery_user_id: uuid
					) {
						insert_erp_shipments_one(
							pk_columns: { id: $id }
							_set: {
								carrier_id: $carrier_id
								tracking_id: $tracking_id
								expected_delivery_date: $expected_delivery_date
								confirmed_delivery_date: $confirmed_delivery_date
								confirmed_delivery_user_id: $confirmed_delivery_user_id
							}
						) {
							id
							carrier_id
							tracking_id
							expected_delivery_date
							confirmed_delivery_date
							confirmed_delivery_user_id
						}
					}
				`,
				{
					id: shipment_id,
					carrier_id,
					tracking_id,
					expected_delivery_date,
					confirmed_delivery_date,
					confirmed_delivery_user_id
				}
			);
			if (shipmentResult?.error) fail(400, { error: shipmentResult?.error?.message });
			shipmentResult = shipmentResult.data?.insert_erp_shipments_one;
		}
		shipment_id = shipmentResult?.id;
		if (!shipment_id)
			fail(500, { error: 'No shipment id was returned from shipment insert/update queries...', shipmentResult });

		console.log('updateShipment', { shipmentResultId: shipmentResult?.id, trackingResultId: trackingResult?.id });
		if (trackingResult?.error || shipmentResult?.error) {
			return {
				success: false,
				error: [
					{
						type: 'database',
						message: trackingResult?.error?.message
					},
					{
						type: 'database',
						message: shipmentResult?.error?.message
					}
				]
			};
		}
		return {
			success: true
		};
	},
	setShipmentConfirmedDelivered: async ({ cookies, request, locals }) => {
		const formData = await request.formData();

		const shipment_id = formData.get('shipment_id');
		let confirmed_delivery_date = formData.get('confirmed_delivery_date');
		let confirmed_delivery_user_id = formData.get('confirmed_delivery_user_idh');

		console.log('setShipmentConfirmedDelivered', shipment_id, confirmed_delivery_date, confirmed_delivery_user_id);

		if (!shipment_id) {
			console.error('setShipmentConfirmedDelivered', 'Missing required fields');
			return fail(401, { message: 'Missing required fields' });
		}

		if (!confirmed_delivery_user_id) confirmed_delivery_user_id = locals?.user?.id || null;
		if (!confirmed_delivery_date) confirmed_delivery_user_id = null;

		const result = await client.mutation(
			gql`
				mutation setShipmentConfirmedDelivered(
					$shipment_id: bigint!
					$confirmed_delivery_date: timestamptz
					$confirmed_delivery_user_id: uuid
				) {
					update_erp_shipments_by_pk(
						pk_columns: { id: $shipment_id }
						_set: {
							confirmed_delivery_date: $confirmed_delivery_date
							confirmed_delivery_user_id: $confirmed_delivery_user_id
						}
					) {
						id
						confirmed_delivery_date
						confirmed_delivery_user_id
					}
				}
			`,
			{ shipment_id, confirmed_delivery_date, confirmed_delivery_user_id }
		);

		if (result?.error) {
			console.error('setShipmentConfirmedDelivered', result?.error?.message);
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

		/* orderItemsQuery = client.query(
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
		); */
	}
	console.log('orders load:', order?.id, order?.user?.id);
	return {
		data: {
			orderData: order
			/* orderItems: orderItemsQuery ? (await orderItemsQuery)?.data : null */
		}
	};
};
