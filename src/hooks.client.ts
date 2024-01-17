import { dev } from '$app/environment';

import { handleErrorWithSentry, Replay } from '@sentry/sveltekit';
import { CaptureConsole } from '@sentry/integrations';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://e4470f743dce413934de370a59515993@o1053754.ingest.sentry.io/4506309759008768',
	tracesSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [
		new Replay({
			maskAllText: false,
			blockAllMedia: false
		}),
		new CaptureConsole({
			levels: ['error']
		})
	],
	environment: dev ? 'development' : 'production',
	enabled: !dev
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
