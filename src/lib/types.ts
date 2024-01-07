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
