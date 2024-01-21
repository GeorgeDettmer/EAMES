export interface Supplier {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	names: string[] | null;
	user_id: string | null;
	tags: string[] | null;
	image_url: string | null;
	categories: string[] | null;
	url: string | null;
}

export interface Tracking {
	id: number | undefined;
	carrier_code: string | undefined;
	tracking_number: string | undefined;
	tacking_url: string | undefined;
	status: string | undefined;
}

export interface Shipment {
	id: number | undefined;
	tracking_id: string | undefined;
	expected_delivery_date: string | undefined;
	confirmed_delivery_date: string | undefined;
	confirmed_delivery_user_id: string | undefined;
	created_at: string | undefined;
	updated_at: string | undefined;
	user_id: string | undefined;
	tracking: Tracking | undefined;
}

export interface OrderItemShipments {
	id: number | undefined;
	quantity: number | undefined;
	shipment: Shipment | undefined;
}

export interface TrackingEvent {
	carrierDetailCode: string | null;
	carrierOccurredAt: string | null;
	carrierStatusCode: string | null;
	cityLocality: string | null;
	companyName: string | null;
	countryCode: string | null;
	description: string | null;
	eventCode: string | null;
	latitude: number | null;
	longitude: number | null;
	occurredAt: string | null;
	postalCode: string | null;
	signer: string | null;
	stateProvince: string | null;
	statusCode: string | null;
}
