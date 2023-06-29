<script lang="ts">
	import { Stage, Layer, Group, Rect, Circle, Line } from 'svelte-konva';

	import Shape from './Renderer/Shape.svelte';

	export let classes: string = '';
	export let style: string = '';
	export let id: number = -1;
	export let data = {};
	export let width: number = 0;
	export let height: number = 0;
	export let layerToShow: string = 'TOP';
	export let importAvailable: boolean = !data;
	export let highlightPins: number[] = [];
	export let outlinePins: number[] = [];
	export let featuresDrawn: number = 0;

	width = width == 0 ? window_width : width;
	height = height == 0 ? window_height : height;

	const flattenShapeLinePoints = (shapes)=>{
		const shapesFlat = shapes.flat();
		if (!['CIRCLE', 'RECTANGLE'].some((v) => shapesFlat.includes(v))) {
			shapes = shapesFlat.filter((item) => typeof item == typeof 1);
			shapes = [['LINE', ...shapes]];
		}
		return shapes
	}
</script>

<Stage config={{ width, height }}>
	<Layer>
		<Group>
			{#each flattenShapeLinePoints(data?.data?.BOARD) as outlineShape}
			<Shape shape={} config={points:[]}/>
			{/each}
			
			<Line config={{}} />
		</Group>
		<Rect config={{ x: 100, y: 100, width: 400, height: 200, fill: 'blue' }} />
	</Layer>
</Stage>
