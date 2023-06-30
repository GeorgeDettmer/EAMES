<script lang="ts">
	import type { CircleConfig } from 'konva/lib/shapes/Circle';
	import type { EllipseConfig } from 'konva/lib/shapes/Ellipse';
	import type { LineConfig } from 'konva/lib/shapes/Line';
	import type { RectConfig } from 'konva/lib/shapes/Rect';
	import type { StarConfig } from 'konva/lib/shapes/Star';
	import { Rect, Circle, Ellipse, Star, Line } from 'svelte-konva';

	export let shape: string = 'LINE';
	export let config = {};
</script>

{#if shape === 'RECTANGLE'}
	<Rect config={{ config }} />
{:else if shape === 'CIRCLE'}
	<Circle config={{ config }} />
{:else if shape === 'ELLIPSE'}
	<Ellipse config={{ config }} />
{:else if shape === 'STAR'}
	<Star config={{ config }} />
{:else}
	<Line config={{ config }} />
{/if}
