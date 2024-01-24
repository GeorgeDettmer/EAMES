import { DB } from '$env/static/private';
import postgres from 'postgres';

const _db = postgres(DB);

export default _db;
