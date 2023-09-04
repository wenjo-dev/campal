module.exports = {
	content: ['./frontend/src/**/*.{svelte,js,ts}'],
	plugins: [
		require("daisyui")
	],
	daisyui: {
		themes: ["light", "dark", "bumblebee", "garden", "pastel", "retro", "lofi", "black", "dracula", "wireframe"]
	}
};