import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		warningFilter: (w) =>
			!(w.code === 'a11y_no_noninteractive_tabindex' || w.code === 'a11y_no_noninteractive_element_interactions'),
	},
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		paths: {
			base: dev ? '' : '/passport-photo'
		},
		prerender: {
			handleHttpError: 'warn',
			handleUnseenRoutes: 'warn'
		}
	}
};

export default config;
