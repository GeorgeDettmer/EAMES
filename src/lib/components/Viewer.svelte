<script context="module" lang="ts">
	const renderers = new Map();

	const checkRendererExisits = (renderer: string) => {
		const exists = renderers.has(renderer);
		if (!exists) {
			console.log('EXPORT | VIEWER | Invalid renderer: ', renderer);
		}
		return exists;
	};

	export function getRenderers() {
		return renderers;
	}

	export function removeComponent(reference: string, rendererId: string) {
		checkRendererExisits(rendererId);
		const renderer = renderers.get(rendererId);
		console.log('EXPORT | removeComponent | ', renderer, reference);
		let group = renderer.find(`.${reference}`)?.[0];
		console.log(group);
		group.destroy();
		let tooltip = renderer.findOne('._tooltip');
		console.log(tooltip);
	}

	export function getComponentGroup(reference: string, rendererId: string) {
		checkRendererExisits(rendererId);
		const renderer = renderers.get(rendererId);
		let group = renderer.find(`.${reference}`)?.[0];
		console.log('EXPORT | getComponentGroup | ', renderer, reference, group);

		return group;
	}

	export function goTo(reference: string, rendererId: string) {
		checkRendererExisits(rendererId);
		let group = getComponentGroup(reference, rendererId);
		console.log(group);
		return group;
	}
</script>

<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import Konva from 'konva';
	export const name = '';
	const dispatch = createEventDispatcher();

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

	$: drawnPins = highlightPins.concat(outlinePins);

	interface ComponentEvent {
		event: string;
		viewer: string;
		component_idx: number;
		component: string;
	}

	let viewer: HTMLDivElement;
	let window_height: number;
	let window_width: number;
	let stage: Stage;
	let layer: Layer;
	let backgroundLayer: Layer;
	let tooltipLayer: Layer;
	let tooltip: Group | Shape<ShapeConfig>;

	let canDraw: boolean = false;

	let annotations: { target: any; annotation: Group; line: Arrow }[] = [];
	let annotationSelected;
	let annotationColors = [];
	let annotationAvailableColorsOriginal = [
		'orange',
		'violet',
		'purple',
		'green',
		'yellowgreen',
		'turquoise'
	];
	let annotationAvailableColors = annotationAvailableColorsOriginal;
	console.log(data);
	onMount(() => {
		width = width == 0 ? window_width : width;
		height = height == 0 ? window_height : height;
		console.log('CAD VIEWER | New viewer:', width, height, `${data?.name}(${data?.id})`);

		stage = new Konva.Stage({
			container: viewer,
			width: width,
			height: height,
			draggable: true
		});
		layer = new Konva.Layer();
		backgroundLayer = new Konva.Layer();
		tooltipLayer = new Konva.Layer();
		tooltip = new Konva.Text();
		let scaleBy = 1.1;
		stage.on('wheel', (e) => {
			// stop default scrolling
			e.evt.preventDefault();

			let oldScale = stage.scaleX();
			let pointer = stage.getPointerPosition();

			let mousePointTo = {
				x: (pointer.x - stage.x()) / oldScale,
				y: (pointer.y - stage.y()) / oldScale
			};

			let direction = e.evt.deltaY > 0 ? 1 : -1;
			if (e.evt.ctrlKey) {
				direction = -direction;
			}

			let newScale = direction < 0 ? oldScale * scaleBy : oldScale / scaleBy;
			stage.scale({ x: newScale, y: newScale });

			let newPos = {
				x: pointer.x - mousePointTo.x * newScale,
				y: pointer.y - mousePointTo.y * newScale
			};
			stage.position(newPos);
		});
		canDraw = true;
		renderers.set(id, stage);
		console.log('CAD VIEWER | RENDERERS:', renderers);
		return () => {
			renderers.delete(stage);
			stage.destroy();
		};
	});

	$: {
		if (data?.data) {
			console.log('has data', data);
			board_parsed = data?.data?.BOARD || [];
			components_parsed = data?.data?.COMPONENTS || [];
			shapes_parsed = data?.data?.SHAPES || [];
			pads_parsed = data?.data?.PADS || [];
			padstacks_parsed = data?.data?.PADSTACKS || [];
			header_parsed = data?.data?.HEADER || [];

			if (canDraw) {
				console.log('RENDER@', new Date(), data?.name);
				draw();
			}
		}
	}

	$: {
		if (layerToShow && canDraw) {
			draw();
		}
	}

	let files;
	let cadapi = 'http://GeorgePC.local:3333/parse';
	async function getData() {
		let formData = new FormData();
		formData.append('file', files[0]);
		await fetch(cadapi, {
			method: 'PUT',
			body: formData
		})
			.then((response) => response.json())
			.then((response) => {
				let response_data = response.data;

				board_parsed = response_data?.BOARD || [];
				components_parsed = response_data?.COMPONENTS || [];
				shapes_parsed = response_data?.SHAPES || [];
				pads_parsed = response_data?.PADS || [];
				padstacks_parsed = response_data?.PADSTACKS || [];
				header_parsed = response_data?.HEADER || [];
				console.log(header_parsed);
				draw();
			})
			.catch((error) => {
				console.error('Error:', error);
			});
	}

	let board_parsed = [];
	let components_parsed = [];
	let shapes_parsed = [];
	let pads_parsed = [];
	let padstacks_parsed = [];
	let header_parsed = [];

	let hires = false;
	let smartRenderLeads = true;
	let drawAllPins = true;
	let sizeMultiplyer = hires ? 21.725 * 2 : 21.7;
	function draw(data) {
		console.log(layer);
		let drawTime = Date.now();
		sizeMultiplyer = hires ? 21.725 * 2 : 21.7;
		layer.destroy();
		backgroundLayer.destroy();
		tooltipLayer.destroy();
		layer = new Konva.Layer();
		backgroundLayer = new Konva.Layer();
		annotations = [];
		annotationColors = annotationAvailableColorsOriginal;

		tooltipLayer = new Konva.Layer({ name: '_tooltip' });
		tooltip = new Konva.Text({
			text: '',
			fontFamily: 'Calibri',
			fontSize: 8,
			padding: 2,
			textFill: 'white',
			fill: 'black',
			alpha: 0.75,
			visible: false,
			name: '_tooltip_text'
		});
		tooltipLayer.add(tooltip);

		featuresDrawn = 0;
		let boardOutline = new Konva.Group();
		//console.log(board_parsed);
		board_parsed.forEach((line) => {
			boardOutline.add(
				new Konva.Line({
					points: line.points.map((x) => convertUnits(x)),
					stroke: 'blue',
					strokeWidth: 4,
					lineCap: 'round'
				})
			);

			featuresDrawn++;
		});

		components_parsed.forEach((component, component_idx) => {
			if (!component || component?.layer != layerToShow) return;
			let group = new Konva.Group({
				x: convertUnits(component.x),
				y: convertUnits(component.y),
				rotation: component.r,
				name: component?.component
			});
			let colour = 'black';
			let defaultColor = colour;
			let shape = shapes_parsed.filter((s) => s?.shape == component?.shape)[0];
			/* colour = component?.device.includes('Not Fitted') ? 'red' : 'blue'; */

			let text = new Konva.Text({
				text: component.component,
				fontSize: 2,
				fontFamily: 'Calibri',
				fill: colour,
				align: 'center',
				verticalAlign: 'center',
				fontStyle: 'bold',
				name: component.component,
				opacity: 0.75,
				listening: false
			});
			text.offsetX(text.width() / 2);
			text.offsetY(text.height() / 2);
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
				let fontSize = minMaxFromPointToPoints(
					[convertUnits(component.x), convertUnits(component.y)],
					[...points]
				).min;
				text.fontSize(fontSize * 1.5);

				if (points.length > 0) {
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
							if (mark.fill() == 'red' || mark.fill() == 'orange') return;
							mark.strokeWidth(mark.strokeWidth() == 5 ? 10 : 5);
							/* mark.fill("blue");
                            mark.opacity(0.5);
                            mark.fillEnabled(true); */
							/* cursorTooltip(
                                true,
                                `${component?.component} (${component?.shape}): ${component?.device}`,
                                stage.getRelativePointerPosition()
                            ); */
							dispatch('component_event', {
								event: e,
								viewer: id,
								component_idx: component_idx,
								component: component
							});
						});
						mark.on('mouseout', function (e) {
							if (mark.fill() == 'red' || mark.fill() == 'orange') return;
							mark.strokeWidth(mark.strokeWidth() == 10 ? 5 : 2);
							/* mark.fill("blue");
                            mark.opacity(1);
                            mark.fillEnabled(false); */
							cursorTooltip(false);
							dispatch('component_event', {
								event: e,
								viewer: id,
								component_idx: component_idx,
								component: component
							});
						});
						mark.perfectDrawEnabled(false);
						group.add(mark);
					}
				}
			});
			let bounds = group.getClientRect();

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
						if (
							smartRenderLeads &&
							!['CIRCLE', 'RECTANGLE'].some((v) => shapeArrayFlat.includes(v))
						) {
							shapes = shapeArrayFlat.filter((item) => typeof item == typeof 1);
							shapes = [['LINE', ...shapes]];
						}
						shapes.forEach((points) => {
							if (!points) return;
							let shapeType = points[0].toUpperCase();
							let strokeWidth = drawPin ? 1.5 : 1;
							let opacity = 0.75;
							let stroke = drawPin ? 'orangered' : 'purple';
							let lineCap = 'round';
							points = points.slice(1).map((point) => convertUnits(point));
							if (points.length > 0) {
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
										fillEnabled: false
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
										fillEnabled: false
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
										fillEnabled: false
									});
								}

								//mark.x(convertUnits(pin.x));
								//mark.y(convertUnits(pin.y));

								if (shapeType == 'RECTANGLE') {
									//mark.x(mark.x() - mark.width() / 2);
									//mark.y(mark.y() - mark.height() / 2);
								}
								//mark.rotation()
								/* mark.on("mouseover", function (e) {
                                    if (mark.fill() == "red") return;
                                    mark.opacity(0.75);
                                    mark.fillEnabled(true);
                                });
                                mark.on("mouseout", function (e) {
                                    if (mark.fill() == "red") return;
                                    mark.opacity(0.75);
                                    if (pin?.pin == "1") return;
                                    mark.fillEnabled(false);
                                }); */
								mark.on('mousemove', function (e) {
									/* cursorTooltip(
                                        true,
                                        `${component?.component} (${pin?.pin})`,
                                        stage.getRelativePointerPosition()
                                    ); */
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
								mark.on('mouseout', function (e) {
									cursorTooltip(false);
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
					/* console.log(
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

			featuresDrawn += group.getChildren().length;

			group.on('mouseover', function (e) {
				//currentCompText.innerHTML = "Reference: " + component.component + ` [${component.device}/${component.shape}]`;
				dispatch('component_event', {
					event: e,
					viewer: id,
					component_idx: component_idx,
					component: component
				});
			});
			group.on('mouseout', function (e) {
				//currentCompText.innerHTML = "Reference: Not Selected";
				dispatch('component_event', {
					event: e,
					viewer: id,
					component_idx: component_idx,
					component: component
				});
			});
			group.on('mousedown touchstart', (e) => {
				//createAnnotation(group);
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

			if (group.width > 0 && group.height > 0) {
				group.cache({ pixelRatio: 0.2, drawBorder: true });
			}
			text.offsetX(text.width() / 2);
			text.offsetY(text.height() / 2);

			if (text.rotation() == 180) {
				text.rotation(0);
				//console.log(text.rotation());
			}
			group.add(text);
			layer.add(group);
		});
		layer.add(boardOutline);
		let bounding = boardOutline.getClientRect();
		let boundingArea = new Konva.Rect({
			x: bounding.x,
			y: bounding.y,
			width: bounding.width,
			height: bounding.height,
			stroke: 'red',
			strokeWidth: 2,
			opacity: 1,
			strokeHitEnabled: false,
			listening: false
		});
		let annotationArea = new Konva.Rect({
			x: bounding.x,
			y: bounding.y,
			width: bounding.width + 25,
			height: bounding.height + 25,
			stroke: 'blue',
			strokeWidth: 2,
			opacity: 1,
			strokeHitEnabled: false,
			listening: false
		});
		layer.add(boundingArea);
		layer.scaleY(-1);
		if (layerToShow == 'TOP') {
		} else {
			layer.scaleX(-1);
		}

		/*
            let backgroundImage = new Image();

            let side = layerToShow == "TOP" ? 1 : 2;
            let boardUrl = `${aoiapi}${"Boards/"}${document.querySelector("#fileupload")?.files?.[0]?.name}/SIDE${side}/Image${hires ? "HR" : ""}${false ? "SDR" : ""}`;
            console.log("Board URL:", boardUrl);
            backgroundImage.src = boardUrl;
            backgroundImage.onload = (e) => {
                let image = new Konva.Image({
                    x: 0,
                    y: 0,
                    image: backgroundImage,
                    width: backgroundImage.width,
                    height: backgroundImage.height,
                    listening: false,
                    rotation: -90,
                });
                image.zIndex(-50);
                image.opacity(0.75);
                image.x(bounding.x - (side == 2 ? 3.5 : 10.3) * sizeMultiplyer); //(bounding.x - (10.3 * sizeMultiplyer))
                image.y(bounding.y + (backgroundImage.height - 21.65 * sizeMultiplyer));
                backgroundLayer.add(image);
            };
            backgroundImage.onerror = (e) => {
                console.log("No AOI image...");
            };

            layer.move({
                x: 300,
                y: 700,
            });
            backgroundLayer.move({
                x: 300,
                y: 700,
            });
        */

		stage.add(backgroundLayer);
		stage.add(layer);
		stage.add(tooltipLayer);

		/* backgroundLayer.clip(0, 0, bounding.width, bounding.height);
        backgroundLayer.hide();
        console.log("featuresDrawn:", featuresDrawn);

        let featureCount = document.querySelector("#featureCount");
        featureCount.textContent = "featureCount: " + featuresDrawn;
        featureCount.style.color = "red";
        if (featuresDrawn < 10000) {
            featureCount.style.color = featuresDrawn < 5000 ? "green" : "orange";
        }

        let showImageCheckbox = document.querySelector("#showBoardImage").checked;
        if (showImageCheckbox) {
            backgroundLayer.show();
        } */
		//fitToScreen();
		console.log('Draw:', Date.now() - drawTime, 'ms', layer, featuresDrawn);
		dispatch('draw_done', stage);
	}

	function createAnnotation(target) {
		let color = annotationAvailableColors.shift();
		let textColor = 'black';
		console.log(annotationAvailableColors, color);
		if (!color) {
			color = Konva.Util.getRandomColor();
		} else {
			color = colourNameToHex(color);
		}

		textColor = invertColor(color, true);
		/* while (annotationColors.includes(color)) {
                color = Konva.Util.getRandomColor();
            } */
		//annotationColors.push(color)
		let bounds = target.getClientRect({ relativeTo: layer });
		console.log(color, bounds);
		let pointer = stage.getPointerPosition();
		let annotation = new Konva.Group({
			x: target.x() + 100,
			y: target.y() + 100,
			rotation: 0,
			draggable: true
		});

		let outline = new Konva.Circle({
			fill: color,
			radius: 50,
			x: 0,
			y: 0,
			stroke: 'black',
			strokeWidth: 3,
			strokeEnabled: false,
			name: 'outline'
		});
		let text = new Konva.Text({
			text: numberToLetter(annotations.length),
			fontSize: 50,
			fontFamily: 'Calibri',
			fill: textColor,
			align: 'center',
			verticalAlign: 'center',
			fontStyle: 'bold'
		});
		text.scaleY(-1);
		text.offsetX(text.width() / 2);
		text.offsetY(text.height() / 2);
		let component_outline = target.find('.outline');
		let comp = component_outline[0];
		let pointOnRect = getNearestPointOnRectangle(
			comp.x(),
			comp.y() + comp.height(),
			comp.width(),
			comp.height(),
			annotation.x(),
			annotation.y()
		);
		let line = new Konva.Arrow({
			points: [annotation.x(), annotation.y(), pointOnRect[0], pointOnRect[1]],
			stroke: color,
			fill: color,
			opacity: 0.5,
			strokeWidth: 5
		});
		annotation.add(outline);
		annotation.add(text);

		layer.add(line);
		layer.add(annotation);
		//line.zIndex(50)
		component_outline.forEach((i) => {
			i.stroke(color);
			i.strokeWidth(5);
		});
		comp.fillEnabled(true);

		let idx =
			annotations.push({
				target: target,
				annotation: annotation,
				line: line
			}) - 1;
		updateLine(idx);
		annotation.on('dragmove', (e) => {
			annotationSelected = null;
			outline.strokeEnabled(false);
			updateLine(idx);
		});
		annotation.on('mousedown touchstart', (e) => {
			outline.strokeEnabled(!outline.strokeEnabled());
			let old;
			if (annotationSelected) {
				let old = annotationSelected.findOne('.outline');
				console.log('annotationSelected-out', old);
				old.strokeEnabled(false);
				//annotationSelected.zIndex(100)
			}
			//annotation.zIndex(200)
			annotationSelected = annotation;
		});
		/* outline.on('mouseover.outline', function (e) {
                console.log(new Date(), "annotation mouseover", e)
                outline.scaleX(1.75)
                outline.scaleY(1.75)
            });
            outline.on('mouseout.outline', function (e) {
                console.log(new Date(), "annotation mouseout", e)
                outline.scaleX(-1.75)
                outline.scaleY(-1.75)
            }); */
	}

	function updateLine(annotationIdx) {
		let annotation = annotations[annotationIdx];
		let target = annotation.target;
		let line = annotation.line;
		annotation = annotation.annotation;

		let target_outline = target.find('.outline')[0];
		let vX = annotation.x() - target.x();
		let vY = annotation.y() - target.y();
		let radius = Math.min(target_outline.width(), target_outline.height()) / 2 - 1;
		let pointOnCircle = getNearestPointOnCircle(
			{ x: vX, y: vY },
			{ x: target.x(), y: target.y() },
			radius
		);
		let annotationRadius = Math.min(target_outline.width(), target_outline.height()) / 2;
		let inside = Math.abs(vX) < radius && Math.abs(vY) < radius;
		console.log(['X', Math.abs(vX)], ['Y', Math.abs(vY)], 'HIDE LINE:', inside);

		line.opacity(inside ? 0 : 1);
		annotation.opacity(inside ? 0.75 : 1);
		line.points([annotation.x() + 1, annotation.y() + 1, pointOnCircle.x, pointOnCircle.y]);
	}

	function colourNameToHex(colour) {
		var colours = {
			aliceblue: '#f0f8ff',
			antiquewhite: '#faebd7',
			aqua: '#00ffff',
			aquamarine: '#7fffd4',
			azure: '#f0ffff',
			beige: '#f5f5dc',
			bisque: '#ffe4c4',
			black: '#000000',
			blanchedalmond: '#ffebcd',
			blue: '#0000ff',
			blueviolet: '#8a2be2',
			brown: '#a52a2a',
			burlywood: '#deb887',
			cadetblue: '#5f9ea0',
			chartreuse: '#7fff00',
			chocolate: '#d2691e',
			coral: '#ff7f50',
			cornflowerblue: '#6495ed',
			cornsilk: '#fff8dc',
			crimson: '#dc143c',
			cyan: '#00ffff',
			darkblue: '#00008b',
			darkcyan: '#008b8b',
			darkgoldenrod: '#b8860b',
			darkgray: '#a9a9a9',
			darkgreen: '#006400',
			darkkhaki: '#bdb76b',
			darkmagenta: '#8b008b',
			darkolivegreen: '#556b2f',
			darkorange: '#ff8c00',
			darkorchid: '#9932cc',
			darkred: '#8b0000',
			darksalmon: '#e9967a',
			darkseagreen: '#8fbc8f',
			darkslateblue: '#483d8b',
			darkslategray: '#2f4f4f',
			darkturquoise: '#00ced1',
			darkviolet: '#9400d3',
			deeppink: '#ff1493',
			deepskyblue: '#00bfff',
			dimgray: '#696969',
			dodgerblue: '#1e90ff',
			firebrick: '#b22222',
			floralwhite: '#fffaf0',
			forestgreen: '#228b22',
			fuchsia: '#ff00ff',
			gainsboro: '#dcdcdc',
			ghostwhite: '#f8f8ff',
			gold: '#ffd700',
			goldenrod: '#daa520',
			gray: '#808080',
			green: '#008000',
			greenyellow: '#adff2f',
			honeydew: '#f0fff0',
			hotpink: '#ff69b4',
			'indianred ': '#cd5c5c',
			indigo: '#4b0082',
			ivory: '#fffff0',
			khaki: '#f0e68c',
			lavender: '#e6e6fa',
			lavenderblush: '#fff0f5',
			lawngreen: '#7cfc00',
			lemonchiffon: '#fffacd',
			lightblue: '#add8e6',
			lightcoral: '#f08080',
			lightcyan: '#e0ffff',
			lightgoldenrodyellow: '#fafad2',
			lightgrey: '#d3d3d3',
			lightgreen: '#90ee90',
			lightpink: '#ffb6c1',
			lightsalmon: '#ffa07a',
			lightseagreen: '#20b2aa',
			lightskyblue: '#87cefa',
			lightslategray: '#778899',
			lightsteelblue: '#b0c4de',
			lightyellow: '#ffffe0',
			lime: '#00ff00',
			limegreen: '#32cd32',
			linen: '#faf0e6',
			magenta: '#ff00ff',
			maroon: '#800000',
			mediumaquamarine: '#66cdaa',
			mediumblue: '#0000cd',
			mediumorchid: '#ba55d3',
			mediumpurple: '#9370d8',
			mediumseagreen: '#3cb371',
			mediumslateblue: '#7b68ee',
			mediumspringgreen: '#00fa9a',
			mediumturquoise: '#48d1cc',
			mediumvioletred: '#c71585',
			midnightblue: '#191970',
			mintcream: '#f5fffa',
			mistyrose: '#ffe4e1',
			moccasin: '#ffe4b5',
			navajowhite: '#ffdead',
			navy: '#000080',
			oldlace: '#fdf5e6',
			olive: '#808000',
			olivedrab: '#6b8e23',
			orange: '#ffa500',
			orangered: '#ff4500',
			orchid: '#da70d6',
			palegoldenrod: '#eee8aa',
			palegreen: '#98fb98',
			paleturquoise: '#afeeee',
			palevioletred: '#d87093',
			papayawhip: '#ffefd5',
			peachpuff: '#ffdab9',
			peru: '#cd853f',
			pink: '#ffc0cb',
			plum: '#dda0dd',
			powderblue: '#b0e0e6',
			purple: '#800080',
			rebeccapurple: '#663399',
			red: '#ff0000',
			rosybrown: '#bc8f8f',
			royalblue: '#4169e1',
			saddlebrown: '#8b4513',
			salmon: '#fa8072',
			sandybrown: '#f4a460',
			seagreen: '#2e8b57',
			seashell: '#fff5ee',
			sienna: '#a0522d',
			silver: '#c0c0c0',
			skyblue: '#87ceeb',
			slateblue: '#6a5acd',
			slategray: '#708090',
			snow: '#fffafa',
			springgreen: '#00ff7f',
			steelblue: '#4682b4',
			tan: '#d2b48c',
			teal: '#008080',
			thistle: '#d8bfd8',
			tomato: '#ff6347',
			turquoise: '#40e0d0',
			violet: '#ee82ee',
			wheat: '#f5deb3',
			white: '#ffffff',
			whitesmoke: '#f5f5f5',
			yellow: '#ffff00',
			yellowgreen: '#9acd32'
		};

		if (typeof colours[colour.toLowerCase()] != 'undefined') return colours[colour.toLowerCase()];

		return false;
	}
	function numberToLetter(int) {
		return String.fromCharCode('A'.charCodeAt(0) + int);
	}
	function invertColor(hex, bw) {
		if (hex.indexOf('#') === 0) {
			hex = hex.slice(1);
		}
		// convert 3-digit hex to 6-digits.
		if (hex.length === 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}
		if (hex.length !== 6) {
			throw new Error('Invalid HEX color.');
		}
		var r = parseInt(hex.slice(0, 2), 16),
			g = parseInt(hex.slice(2, 4), 16),
			b = parseInt(hex.slice(4, 6), 16);
		if (bw) {
			// https://stackoverflow.com/a/3943023/112731
			return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
		}
		// invert color components
		r = (255 - r).toString(16);
		g = (255 - g).toString(16);
		b = (255 - b).toString(16);
		// pad each with zeros and return
		return '#' + r.padStart(2, '0') + g.padStart(2, '0') + b.padStart(2, '0');
	}

	function getNearestPointOnCircle(pointA, pointB, radius) {
		let magV = Math.sqrt(pointA.x * pointA.x + pointA.y * pointA.y);
		let aX = pointB.x + (pointA.x / magV) * radius;
		let aY = pointB.y + (pointA.y / magV) * radius;
		return { x: aX, y: aY };
	}

	function getNearestPointOnRectangle(l, t, w, h, x, y) {
		/* https://stackoverflow.com/a/20453634
            local abs, min, max = math.abs, math.min, math.max

            local function clamp(x, lower, upper)
                return max(lower, min(upper, x))
            end

            local function getNearestPointInPerimeter(l,t,w,h, x,y)
                local r, b = l+w, t+h

                x, y = clamp(x, l, r), clamp(y, t, b)

                local dl, dr, dt, db = abs(x-l), abs(x-r), abs(y-t), abs(y-b)
                local m = min(dl, dr, dt, db)

                if m == dt then return x, t end
                if m == db then return x, b end
                if m == dl then return l, y end
                return r, y
            end
            */

		let clamp = (x, lower, upper) => Math.max(lower, Math.min(upper, x));

		let r = l + w;
		let b = t + h;

		x = clamp(x, l, r);
		y = clamp(y, t, b);

		let dl = Math.abs(x - l);
		let dr = Math.abs(x - r);
		let dt = Math.abs(y - t);
		let db = Math.abs(y - b);

		let m = Math.min(dl, dr, dt, db);

		if (m == dt) return [x, t];
		if (m == db) return [x, b];
		if (m == dl) return [x, y];
		return [r, y];
	}

	function convertUnits(n, units) {
		return (units || header_parsed?.units) == 'INCH'
			? n * sizeMultiplyer * 25.4
			: n * sizeMultiplyer;
	}

	function minMaxFromPointToPoints(point, points) {
		point = point.map((p) => Math.abs(p));
		points = points.map((p) => Math.abs(p));
		const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
		let distances = [];
		points.forEach((p) => distances.push(distance(point[0], point[1], p[0], p[1])));
		return {
			max: points.sort((a, b) => b - a)[0],
			min: points.sort((a, b) => a - b)[0]
		};
	}

	function cursorTooltip(visible, text, position) {
		let mousePos = stage.getRelativePointerPosition();
		if (visible) {
			tooltip.show();
		} else {
			tooltip.hide();
		}

		if (position) {
			tooltip.position({
				x: position.x + 4,
				y: position.y + 4
			});
		}
		if (text) {
			tooltip.text(text);
		}
	}

	const fitToScreen = (tween: Boolean = false) => {
		// get layers
		const nodesLayer = layer;
		const layerSize = nodesLayer.getClientRect({
			relativeTo: stage
		});

		// calculate sizes
		const stageSize = stage.getSize();
		const scaleX = stageSize.width / layerSize.width;
		const scaleY = stageSize.height / layerSize.height;
		const scaleValue = Math.min(scaleX, scaleY) * 0.9;

		if (tween) {
			moveStage(stage, { x: 0, y: 20 }, { x: scaleValue, y: scaleValue });
		} else {
			stage.scale({ scaleValue, scaleValue });
		}
	};

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

<svelte:window bind:innerHeight={window_height} bind:innerWidth={window_width} />

<div {style} class={classes}>
	{#if importAvailable}
		<input id="fileupload" type="file" bind:files />
		<Button on:click={() => getData()}>Draw</Button>
	{/if}
	<div bind:this={viewer} class="overflow-hidden" />
</div>
