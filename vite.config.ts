import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['mini'],
		watch: {
			ignored: ['**/build/**', '**/.svelte-kit/**']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		pool: 'forks',
		poolOptions: {
			forks: { singleFork: true }
		}
	}
});
