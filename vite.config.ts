import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'easl-software',
				project: 'eames'
			}
		}),
		sveltekit()
	],
	build: {
		sourcemap: true
	}
});
