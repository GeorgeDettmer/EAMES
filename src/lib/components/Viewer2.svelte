<script lang="ts">
	import { Stage, Layer, Group, Rect, Circle, Line } from 'svelte-konva';

	import Shape from './Renderer/Shape.svelte';

	export let data = {};
	export let width: number = 0;
	export let height: number = 0;

	let window_width = 0;
	let window_height = 0;
	let sizeMultiplyer = false ? 21.725 * 2 : 21.7;
	function convertUnits(n, units) {
		return (units || data?.HEADER?.units) == 'INCH'
			? n * sizeMultiplyer * 25.4
			: n * sizeMultiplyer;
	}

	const flattenShapeLinePoints = (shapes) => {
		const shapesFlat = shapes.map((s) => Object.values(s)).flat();
		if (!['CIRCLE', 'RECTANGLE'].some((v) => shapesFlat.includes(v))) {
			shapes = shapesFlat.filter((item) => typeof item == typeof []);
			shapes = [{ type: 'LINE', points: shapes }];
		}
		return shapes;
	};

	const onDrag = (e) => {
		const scaleBy = 1.1;
		const event = e.detail.evt;
		event.preventDefault();

		let oldScale = stage.scaleX();
		let pointer = stage.getPointerPosition();

		let mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale
		};

		let direction = event.deltaY > 0 ? 1 : -1;
		if (event.ctrlKey) {
			direction = -direction;
		}

		let newScale = direction < 0 ? oldScale * scaleBy : oldScale / scaleBy;
		stage.scale({ x: newScale, y: newScale });

		let newPos = {
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale
		};
		stage.position(newPos);
	};

	$: console.log(data, window_width, window_height, width, height);

	$: size = {
		width: (width == 0 ? window_width : width) - 50,
		height: (height == 0 ? window_height : height) - 200
	};

	let stage;
</script>

<svelte:window bind:innerHeight={window_height} bind:innerWidth={window_width} />

<Stage
	config={{ width: size.width, height: size.height, draggable: true }}
	bind:handle={stage}
	on:wheel={onDrag}
>
	<Layer>
		<Group
			config={{
				name: 'outline'
			}}
		>
			{#each flattenShapeLinePoints(data?.BOARD) as { type, points }, i}
				<p>{JSON.stringify(type)}</p>
				<!-- <Line
					config={{
						x: 200,
						y: 200,
						points: points.map((x) => convertUnits(x)),
						stroke: 'blue',
						strokeWidth: 4,
						lineCap: 'round'
					}}
				/> -->
				<Rect config={{ x: 100, y: 100, width: 10, height: 10, fill: 'blue' }} />
			{/each}

			<!-- <Line config={{}} /> -->
			<Rect config={{ x: 100, y: 100, width: 10, height: 10, fill: 'blue' }} />
			<Shape shape="RECTANGLE" config={{ x: 120, y: 100, width: 10, height: 10, fill: 'red' }} />
		</Group>
	</Layer>
</Stage>
