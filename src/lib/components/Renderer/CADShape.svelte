<script lang="ts">
	import Shape from './Shape.svelte';

	export const shape: string;
	export const cad;
</script>

<Shape {shape} {config} />
