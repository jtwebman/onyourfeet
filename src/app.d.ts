// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
	}

	interface Window {
		/** HitsOnce analytics. Defined in production once the tracker loads. */
		hitsonce?: (name: string, value?: string | number) => void;
	}
}

export {};
