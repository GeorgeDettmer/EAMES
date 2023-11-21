import sql from './db';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { CARRIER_PREFIX } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	let carrierid = decodeURIComponent(url.searchParams.get('carrierid') || '');
	const componentname = decodeURIComponent(url.searchParams.get('componentname') || '');
	const owner = decodeURIComponent(url.searchParams.get('owner') || '');
	const quantity = decodeURIComponent(url.searchParams.get('quantity') || '');
	const angle = decodeURIComponent(url.searchParams.get('angle') || '');
	const batchid = decodeURIComponent(url.searchParams.get('batchid') || '');
	const step = decodeURIComponent(url.searchParams.get('step') || '');
	if (!carrierid || !componentname || !quantity) {
		console.log('Error creating carrier: ', 'missing info', carrierid, componentname, quantity);
		throw error(400, 'missing info');
	}
	let carrierPrefix = CARRIER_PREFIX || 'EAMES#';
	carrierid = carrierPrefix + carrierid;
	if (carrierid.length > 50) {
		console.log('Error creating carrier: ', 'carrierid over 50 chars', carrierid, carrierid.length);
		throw error(400, 'carrierid over 50 chars');
	}
	if (batchid && batchid.length > 35) {
		console.log('Error creating carrier: ', 'batchid over 35 chars', batchid, batchid.length);
		throw error(400, 'batchid over 35 chars');
	}
	try {
		let carrier = {
			carrierid,
			componentname,
			quantity,
			step: step ? step : '2000',
			angle: angle ? angle : -90,
			owner: owner ? owner : '',
			batchid: batchid ? batchid : ''
		};
		console.log('Create carrier:', JSON.stringify(carrier));
		//INSERT INTO mydbcarrview_10.carrier_magname (carrierid, componentname, quantity, batchid, owner, aux1, step, angle) VALUES ('{id}', '{component}', {quantity}, '{batch}', '{owner}', '{note}', '{step}', '{angle}');
		const result = await sql`INSERT INTO mydbcarrview_10.carrier_magname ${sql(carrier)}`;
		console.log('Create carrier result:', JSON.stringify(result));

		return json(result);
	} catch (e) {
		console.log('Error creating carrier: ', e);
		throw error(400, e);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	let { carrierid, componentname, quantity, owner, angle, batchid, step } = await request.json();

	if (!carrierid || !componentname || !quantity) {
		console.log('Error creating carrier: ', 'missing info', carrierid, componentname, quantity);
		throw error(400, 'missing info');
	}
	let carrierPrefix = CARRIER_PREFIX || 'EAMES#';
	carrierid = carrierPrefix + carrierid;
	if (carrierid.length > 50) {
		console.log('Error creating carrier: ', 'carrierid over 50 chars', carrierid, carrierid.length);
		throw error(400, 'carrierid over 50 chars');
	}
	if (batchid && batchid.length > 35) {
		console.log('Error creating carrier: ', 'batchid over 35 chars', batchid, batchid.length);
		throw error(400, 'batchid over 35 chars');
	}
	try {
		let carrier = {
			carrierid,
			componentname,
			quantity,
			step: step ? step : '2000',
			angle: angle ? angle : -90,
			owner: owner ? owner : '',
			batchid: batchid ? batchid : ''
		};
		console.log('Create carrier:', JSON.stringify(carrier));
		//INSERT INTO mydbcarrview_10.carrier_magname (carrierid, componentname, quantity, batchid, owner, aux1, step, angle) VALUES ('{id}', '{component}', {quantity}, '{batch}', '{owner}', '{note}', '{step}', '{angle}');
		const result = await sql`INSERT INTO mydbcarrview_10.carrier_magname ${sql(carrier)}`;
		console.log('Create carrier result:', JSON.stringify(result));

		return json(result);
	} catch (e) {
		console.log('Error creating carrier: ', e);
		throw error(400, e);
	}
};
