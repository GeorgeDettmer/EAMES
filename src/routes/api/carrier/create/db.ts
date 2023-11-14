import { CARRIER_DB } from '$env/static/private';
import postgres from 'postgres';

const sql = postgres(CARRIER_DB);

export default sql;
