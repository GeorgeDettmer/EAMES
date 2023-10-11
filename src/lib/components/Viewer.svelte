<script context="module" lang="ts">
	const renderers: Map<string, Stage> = new Map();

	export function getRenderers(): Map<string, Stage> {
		return renderers;
	}

	const checkRendererExists = (renderer: string): boolean => {
		const exists = renderers.has(renderer);
		if (!exists) {
			console.warn('EXPORT | VIEWER | Invalid renderer: ', renderer, renderers);
		}
		return exists;
	};

	export function removeComponent(reference: string, rendererId: string): boolean {
		checkRendererExists(rendererId);
		const renderer: Stage | undefined = renderers.get(rendererId);
		console.debug('EXPORT | removeComponent | ', renderer, reference);
		const group = renderer?.find(`.${reference}`)?.[0];
		if (!group) {
			console.debug('EXPORT | removeComponent | Could not find component group', renderer, reference);
			return false;
		}
		group?.destroy();
		return true;
	}

	export function getComponentGroups(reference: string, rendererId: string = ''): Group[] {
		let renderer: Stage | undefined;
		if (!rendererId) {
			getRenderers().forEach((r, id) => {
				if (getComponentGroup(reference, id)) {
					renderer = r;
					rendererId = id;
					return;
				}
			});
		} else {
			renderer = renderers.get(rendererId);
		}
		return renderer?.find(`.${reference}`) || [];
	}

	export function getComponentGroup(reference: string, rendererId: string = ''): Group | undefined {
		return getComponentGroups(reference, rendererId)?.[0];
	}

	export function goTo(reference: string, rendererId: string) {
		checkRendererExists(rendererId);
		let group = getComponentGroup(reference, rendererId);
		return group;
	}

	export const fitToScreen = (rendererId: string) => {
		const renderer = getRenderers().get(rendererId);
		if (!renderer) return;
		const layer = renderer?.findOne('.board');
		if (!layer) return;
		const scale = Math.min(
			renderer.width() / (layer.getClientRect().width * 1.025),
			renderer.height() / (layer.getClientRect().height * 1.025)
		);
		console.log('fitToScreen', rendererId, scale);
		renderer.position({
			x: -layer.getClientRect().x * scale,
			y: -layer.getClientRect().y * scale
		});
		renderer.scaleX(scale);
		renderer.scaleY(scale);
	};
</script>

<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Konva from 'konva';
	import { truncateString } from '$lib/utils';
	import type { Stage } from 'konva/lib/Stage';
	import type { Layer } from 'konva/lib/Layer';
	import type { Shape, ShapeConfig } from 'konva/lib/Shape';
	import type { Group } from 'konva/lib/Group';

	export const name: string = '';
	export let classes: string = '';
	export let style: string = '';
	export let id: string;
	export let data = {};
	export let width: number = 0;
	export let height: number = 0;
	export let layerToShow: string = 'TOP';
	export let highlightPins: number[] = [];
	export let outlinePins: number[] = [];
	export let featuresDrawn: number = 0;
	export let drawAllPins: boolean = true;
	export let highlightComponents: string[] = [];

	const dispatch = createEventDispatcher();
	let viewer: HTMLDivElement;
	let window_height: number;
	let window_width: number;
	let stage: Stage;
	let layer: Layer;
	let backgroundLayer: Layer;
	let canDraw: boolean = false;

	$: drawnPins = highlightPins.concat(outlinePins);

	onMount(() => {
		width = width == 0 ? window_width : width;
		height = height == 0 ? window_height : height;
		console.info('CAD VIEWER | New viewer:', width, height, `${data?.name}(${data?.id})`);
		stage = new Konva.Stage({
			container: viewer,
			width: width + 100,
			height: height + 1,
			draggable: true
		});
		layer = new Konva.Layer();
		backgroundLayer = new Konva.Layer();
		let scaleBy = 1.1;
		stage.on('wheel', (e) => {
			// stop default scrolling
			e.evt.preventDefault();

			const oldScale = stage.scaleX();
			const pointer = stage.getPointerPosition();

			const mousePointTo = {
				x: (pointer.x - stage.x()) / oldScale,
				y: (pointer.y - stage.y()) / oldScale
			};

			let direction = e.evt.deltaY > 0 ? 1 : -1;
			if (e.evt.ctrlKey) {
				direction = -direction;
			}

			const newScale = direction < 0 ? oldScale * scaleBy : oldScale / scaleBy;
			stage.scale({ x: newScale, y: newScale });

			let newPos = {
				x: pointer.x - mousePointTo.x * newScale,
				y: pointer.y - mousePointTo.y * newScale
			};
			stage.position(newPos);
		});
		canDraw = true;
		renderers.set(id, stage);
		console.info('CAD VIEWER | RENDERERS:', renderers);
		return () => {
			renderers.delete(stage);
			stage.destroy();
		};
	});

	$: {
		if (data?.data) {
			board_parsed = data?.data?.BOARD || [];
			components_parsed = data?.data?.COMPONENTS || [];
			shapes_parsed = data?.data?.SHAPES || [];
			pads_parsed = data?.data?.PADS || [];
			padstacks_parsed = data?.data?.PADSTACKS || [];
			header_parsed = data?.data?.HEADER || [];

			if (canDraw) {
				console.info('RENDER@', new Date(), data?.name);
				draw();
			}
		}
	}

	let board_parsed = [];
	let components_parsed = [];
	let shapes_parsed = [];
	let pads_parsed = [];
	let padstacks_parsed = [];
	let header_parsed = [];
	let hires = false;
	let smartRenderLeads = true;
	let sizeMultiplyer = hires ? 21.725 * 2 : 21.7;
	function draw(data?: any) {
		let drawTime = Date.now();
		sizeMultiplyer = hires ? 21.725 * 2 : 21.7;
		layer.destroy();
		backgroundLayer.destroy();
		layer = new Konva.Layer({ name: 'board' });
		backgroundLayer = new Konva.Layer();

		featuresDrawn = 0;
		let boardOutline = new Konva.Group({ name: 'outline' });
		board_parsed.forEach((line) => {
			boardOutline.add(
				new Konva.Line({
					points: line.points.map((x: number) => convertUnits(x)),
					stroke: 'blue',
					strokeWidth: 4,
					lineCap: 'round'
				})
			);

			featuresDrawn++;
		});

		components_parsed.forEach((component, component_idx) => {
			if (!component || component?.layer != layerToShow) return;
			let componentFeaturesDrawn = 0;
			let group = new Konva.Group({
				x: convertUnits(component.x),
				y: convertUnits(component.y),
				rotation: component.r,
				name: component?.component,
				layer: component?.layer,
				component: component
			});
			let colour = 'black';
			let defaultColor = colour;
			let shape = shapes_parsed.filter((s) => s?.shape == component?.shape)[0];
			let text = new Konva.Text({
				text: truncateString(component.component),
				fontSize: 2,
				fontFamily: 'Calibri',
				fill: colour,
				align: 'center',
				verticalAlign: 'center',
				fontStyle: 'bold',
				name: 'reference',
				opacity: 0.75,
				listening: false
			});
			componentFeaturesDrawn++;
			featuresDrawn++;
			text.scaleY(-1);

			let shapes = shape?.shapes;
			let shapesFlat = shapes.flat();
			if (smartRenderLeads && !['CIRCLE', 'RECTANGLE'].some((v) => shapesFlat.includes(v))) {
				shapes = shapesFlat.filter((item) => typeof item == typeof 1);
				shapes = [['LINE', ...shapes]];
			}
			shapes.forEach((s, shape_idx) => {
				if (!s) return;
				let shapeType = s[0].toUpperCase();
				let points = s.slice(1).map((point) => convertUnits(point));
				let stroke = colour;
				let strokeWidth = 2;
				let opacity = colour == defaultColor ? 1 : 0.5;
				let lineCap = 'round';

				if (points.length > 0) {
					featuresDrawn++;
					componentFeaturesDrawn++;
					let mark = new Konva.Line({
						points: points,
						stroke: 'red',
						strokeWidth: strokeWidth,
						opacity: opacity,
						lineCap: lineCap,
						name: 'outline'
					});
					if (shapeType == 'RECTANGLE') {
						mark = new Konva.Rect({
							x: points[0],
							y: points[1],
							width: points[2],
							height: points[3],
							stroke: stroke,
							strokeWidth: strokeWidth,
							opacity: opacity,
							name: 'outline',
							fill: colour == defaultColor ? '' : colour
						});
					} else if (shapeType == 'CIRCLE') {
						mark = new Konva.Circle({
							x: points[0],
							y: points[1],
							radius: points[2],
							stroke: stroke,
							strokeWidth: strokeWidth,
							opacity: opacity,
							name: 'outline',
							fill: colour == defaultColor ? '' : colour
						});
					} else if (shapeType == 'LINE') {
						mark = new Konva.Line({
							points: points,
							stroke: stroke,
							strokeWidth: strokeWidth,
							opacity: opacity,
							lineCap: lineCap,
							lineJoin: 'round',
							name: 'outline',
							closed: true,
							fill: colour == defaultColor ? '' : colour
						});
					}

					if (s) {
						mark.on('mouseover', function (e) {
							dispatch('component_event', {
								event: e,
								viewer: id,
								component_idx: component_idx,
								component: component
							});
						});
						mark.on('mouseout', function (e) {
							dispatch('component_event', {
								event: e,
								viewer: id,
								component_idx: component_idx,
								component: component
							});
						});
						if (highlightComponents.includes(component?.component)) {
							mark.fill('blue');
							mark.opacity(0.5);
						}

						mark.perfectDrawEnabled(true);
						mark.fillAfterStrokeEnabled(true);
						mark.addName('outline');
						group.add(mark);
					}
				}
			});

			let pins = shape.pins || [];
			pins.forEach((pin, pin_idx) => {
				if (pins.length < 1) return;
				let drawPin = drawnPins.includes(parseInt(pin?.pin));
				if (drawAllPins || drawPin) {
					let pinGroup = new Konva.Group({
						x: convertUnits(pin.x),
						y: convertUnits(pin.y),
						rotation: parseInt(pin.r),
						name: component?.component + ':' + pin?.pin
					});
					let padstack = padstacks_parsed.filter((padstack) => padstack?.padstack == pin?.pad)[0];
					let padstack_pads = padstack?.pads;
					let pads = pads_parsed.filter((p) => p?.pad == padstack_pads?.[0]?.name);

					let pad_shapes = pads.map((pad_shape) => [...pad_shape?.shape]);
					let pad_marks = [];
					pad_shapes.forEach((shapes) => {
						let shapeArrayFlat = shapes.flat();
						if (smartRenderLeads && !['CIRCLE', 'RECTANGLE'].some((v) => shapeArrayFlat.includes(v))) {
							shapes = shapeArrayFlat.filter((item) => typeof item == typeof 1);
							shapes = [['LINE', ...shapes]];
						}
						shapes.forEach((points) => {
							if (!points) return;
							let shapeType = points[0].toUpperCase();
							let strokeWidth = drawPin ? 1.5 : 1;
							let opacity = 0.25;
							let stroke = drawPin ? 'red' : 'purple';
							let lineCap = 'round';
							points = points.slice(1).map((point: number) => convertUnits(point));
							if (points.length > 0) {
								featuresDrawn++;
								componentFeaturesDrawn++;
								let mark = new Konva.Line({
									points: points,
									stroke: 'red',
									strokeWidth: strokeWidth,
									opacity: opacity,
									lineCap: lineCap,
									name: 'lead'
								});
								if (shapeType == 'RECTANGLE') {
									mark = new Konva.Rect({
										x: points[0],
										y: points[1],
										width: points[2],
										height: points[3],
										stroke: stroke,
										strokeWidth: strokeWidth,
										opacity: opacity,
										name: 'lead',
										fill: stroke,
										fillEnabled: true
									});
								} else if (shapeType == 'CIRCLE') {
									mark = new Konva.Circle({
										x: points[0],
										y: points[1],
										radius: points[2],
										stroke: stroke,
										strokeWidth: strokeWidth,
										opacity: opacity,
										name: 'lead',
										fill: stroke,
										fillEnabled: true
									});
								} else if (shapeType == 'LINE') {
									mark = new Konva.Line({
										points: points,
										stroke: stroke,
										strokeWidth: strokeWidth,
										opacity: opacity,
										lineCap: lineCap,
										lineJoin: 'round',
										name: 'lead',
										closed: true,
										fill: stroke,
										fillEnabled: true
									});
								}

								mark.on('mouseover', function (e) {
									dispatch('pin_event', {
										event: e,
										viewer: id,
										component_idx: component_idx,
										component: component,
										pin_idx: pin_idx,
										pin: pin
									});
								});
								mark.on('mouseout', function (e) {
									dispatch('pin_event', {
										event: e,
										viewer: id,
										component_idx: component_idx,
										component: component,
										pin_idx: pin_idx,
										pin: pin
									});
								});
								mark.on('mousedown', function (e) {
									dispatch('pin_event', {
										event: e,
										viewer: id,
										component_idx: component_idx,
										component: component,
										pin_idx: pin_idx,
										pin: pin
									});
								});
								mark.perfectDrawEnabled(false);
								pinGroup.add(mark);
								pinGroup.rotation(parseFloat(pin.r));
								if (highlightPins.includes(parseInt(pin?.pin))) {
									mark.fillEnabled(true);
								}
								pad_marks.push(mark);
								group.add(pinGroup);
							}
						});
					});
					let pinBB = pinGroup.getClientRect({ relativeTo: pinGroup });
					let text_pin = new Konva.Text({
						name: 'pin_number',
						x: pinBB.x,
						y: pinBB.y,
						text: pin?.pin,
						scaleX: -1,
						visible: false,
						fill: 'blue',
						fontSize: 15
					});
					text_pin.position({
						x: pinBB.x + pinBB.width / 2 + text_pin.width() / 2,
						y: pinBB.y + pinBB.height / 2 - text_pin.height() / 2
					});
					pinGroup.add(text_pin);
					/* console.info(
						`${component.component}(${pin?.pin}):`,
						{
							padstack: padstack,
							pin: pin,
							pads: pads,
							pad_shapes: pad_shapes
						},
						pad_marks,
						`(${group.getChildren().length})`
					); */
				}
			});

			//featuresDrawn += group.getChildren().length;

			group.on('mouseover', function (e) {
				dispatch('component_event', {
					event: e,
					viewer: id,
					component_idx: component_idx,
					component: component
				});
			});
			group.on('mouseout', function (e) {
				dispatch('component_event', {
					event: e,
					viewer: id,
					component_idx: component_idx,
					component: component
				});
			});
			group.on('mousedown touchstart', (e) => {
				dispatch('component_event', {
					event: e,
					viewer: id,
					component_idx: component_idx,
					component: component
				});
			});

			if (layerToShow == 'TOP') {
				//group.scaleY(-1)
			} else {
				group.scaleX(-1);
			}

			/* if (group.width() > 0 && group.height() > 0) {
				group.cache({ pixelRatio: 0.2, drawBorder: true });
			} */

			if (text.rotation() == 180) {
				text.rotation(0);
			}

			let bounds = group.getClientRect({ relativeTo: group });
			//TODO: Center reference text to center of component group bounding box
			/* let componentGroupbb = new Konva.Rect({
				name: 'bounds',
				x: bounds.x,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height,
				stroke: 'red',
				strokeWidth: 2,
				opacity: 1,
				strokeHitEnabled: false,
				listening: false
			});

			group.add(componentGroupbb); */
			let fontSize = Math.min(bounds.width, bounds.height) / 3;
			//text.fontSize(Math.max(fontSize - (fontSize / 100) * 10, 4));
			text.fontSize(fontSize);
			text.offsetX(text.width() / 2);
			text.offsetY(text.height() / 2);

			/* text.offsetY(-bounds.width / 2 + text.width() / 2);
			text.offsetX(-bounds.height / 2 + text.height() / 2); */
			text.align('center');
			text.verticalAlign('center');
			group.add(text);
			layer.add(group);
		});
		layer.add(boardOutline);
		let bounding = boardOutline.getClientRect();
		let boundingArea = new Konva.Rect({
			name: 'bounds',
			x: bounding.x,
			y: bounding.y,
			width: bounding.width,
			height: bounding.height,
			stroke: 'red',
			strokeWidth: 2,
			opacity: 1,
			//strokeHitEnabled: false,
			listening: false,
			hitStrokeWidth: 0
		});

		layer.add(boundingArea);
		layer.scaleY(-1);
		if (layerToShow == 'TOP') {
		} else {
			layer.scaleX(-1);
		}

		stage.add(backgroundLayer);
		stage.add(layer);
		stage.on('contextmenu', (e) => {
			dispatch('contextmenu', {
				event: e,
				viewer: id,
				component_idx: null,
				component: null
			});
		});

		fitToScreen(layerToShow);

		console.info('Draw:', Date.now() - drawTime, 'ms', layer, featuresDrawn);
		dispatch('draw_done', stage);
	}

	function convertUnits(n: number, units: 'INCH' | 'MM' = header_parsed?.units) {
		return units == 'INCH' ? n * sizeMultiplyer * 25.4 : n * sizeMultiplyer;
	}

	const moveStage = (stage, location, scale) => {
		const { x, y } = location;
		const tween = new Konva.Tween({
			duration: 0.35,
			easing: Konva.Easings.EaseInOut,
			node: stage,
			onFinish: tween.destroy,
			scaleX: (scale && scale.x) || 1,
			scaleY: (scale && scale.y) || 1,
			x,
			y
		});

		tween.play();
		stage.batchDraw();
	};
</script>

<!-- <svelte:window bind:innerHeight={window_height} bind:innerWidth={window_width} /> -->

<div {style} class={classes} bind:clientWidth={window_width} bind:clientHeight={window_height}>
	<div bind:this={viewer} class="overflow-hidden" />
</div>
