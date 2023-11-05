import { ShipEngine } from 'shipengine';
import { trackingCache } from '../../cache';
import type { RequestHandler } from './$types';
import { SHIPENGINE_API_KEY } from '$env/static/private';
import { error, fail, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const trackingNumber = url.searchParams.get('tracking_number');
	const carrierCode = url.searchParams.get('carrier_code');

	if (!trackingNumber || !carrierCode) throw error(400, "No 'tracking_number' or 'carrier' query parameter provided");
	console.log('Tracking request: ', carrierCode, trackingNumber);
	let cacheId = `${carrierCode}_${trackingNumber}`;
	let cached = trackingCache.get(cacheId);
	if (cached) {
		let cacheTimestamp = cached?._cachedTimestamp;
		//TODO: configurable cache expiry
		if (cacheTimestamp && (Date.now() - cacheTimestamp) / 1000 < 60) {
			console.log('Tracking status:');
			console.log('CACHED', (Date.now() - cacheTimestamp) / 1000);
			console.log(cached?.statusCode, cached?.statusDescription);
			return json(cached);
		}
	}
	const shipengine = new ShipEngine(SHIPENGINE_API_KEY);
	try {
		const result = await shipengine.trackUsingCarrierCodeAndTrackingNumber({ carrierCode, trackingNumber });

		console.log('Tracking status:');
		console.log(result?.statusCode, result?.statusDescription);

		result._cachedTimestamp = Date.now();
		trackingCache.set(cacheId, result);
		console.log('Cached at:', result._cachedTimestamp);
		return json(result);
	} catch (e) {
		console.log('Error tracking shipment: ', e?.message);
		throw error(400, e);
	}
};
