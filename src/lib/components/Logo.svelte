<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	let { mouseState }: { mouseState: number } = $props();

	// Define constants
	const viewboxSize = 100;
	const circleRadius = 15;
	const bigCircleRadius = 20;
	const strokeWidth = 8;

	// Positions of the circles
	const circleLeft = {
		x: bigCircleRadius + strokeWidth / 2,
		y: viewboxSize / 2,
		r: bigCircleRadius
	};
	const circleRight = {
		x: viewboxSize - bigCircleRadius - strokeWidth / 2,
		y: viewboxSize / 2,
		r: bigCircleRadius
	};
	const circleBottom = {
		x: viewboxSize / 2,
		y: viewboxSize - bigCircleRadius - strokeWidth / 2,
		r: bigCircleRadius
	};
	const circleTop = {
		x: viewboxSize / 2,
		y: bigCircleRadius + strokeWidth / 2,
		r: bigCircleRadius
	};

	const circleTopLeft = {
		x: circleRadius + strokeWidth / 2,
		y: circleRadius + strokeWidth / 2,
		r: circleRadius
	};
	const circleTopRight = {
		x: viewboxSize - circleRadius - strokeWidth / 2,
		y: circleRadius + strokeWidth / 2,
		r: circleRadius
	};
	const circleBottomLeft = {
		x: circleRadius + strokeWidth / 2,
		y: viewboxSize - circleRadius - strokeWidth / 2,
		r: circleRadius
	};
	const circleBottomRight = {
		x: viewboxSize - circleRadius - strokeWidth / 2,
		y: viewboxSize - circleRadius - strokeWidth / 2,
		r: circleRadius
	};

	// Define vertex positions
	const v1 = new Tween({ ...circleLeft }, { duration: 600, easing: cubicOut });
	const v2 = new Tween({ ...circleTopRight }, { duration: 600, easing: cubicOut });
	const v3 = new Tween({ ...circleBottomRight }, { duration: 600, easing: cubicOut });

	// Previous position, to prevent duplicates
	let prevPosition: number | undefined = undefined;

	function handleMouseEnter() {
		// Choose a random position for the vertices
		let r = Math.floor(Math.random() * 5);
		if (r === prevPosition) r = (r + 1) % 5;
		prevPosition = r;

		switch (r) {
			case 0:
				v1.target = { ...circleLeft };
				v2.target = { ...circleTopRight };
				v3.target = { ...circleBottomRight };
				break;
			case 1:
				v1.target = { ...circleTop };
				v2.target = { ...circleBottomRight };
				v3.target = { ...circleBottomLeft };
				break;
			case 2:
				v1.target = { ...circleBottom };
				v2.target = { ...circleTopLeft };
				v3.target = { ...circleTopRight };
				break;
			case 3:
				v1.target = { ...circleBottom };
				v2.target = { ...circleTopRight };
				v3.target = { ...circleTopLeft };
				break;
			default:
				v1.target = { ...circleRight };
				v2.target = { ...circleTopLeft };
				v3.target = { ...circleBottomLeft };
				break;
		}
	}

	function handleMouseLeave() {
		v1.set({ ...circleLeft });
		v2.set({ ...circleTopRight });
		v3.set({ ...circleBottomRight });
	}

	const edgeX1 = (
		a: { x: number; y: number; r: number },
		b: { x: number; y: number; r: number }
	): number => {
		const length = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
		return a.x + ((b.x - a.x) * a.r) / length;
	};

	const edgeY1 = (
		a: { x: number; y: number; r: number },
		b: { x: number; y: number; r: number }
	): number => {
		const length = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
		return a.y + ((b.y - a.y) * a.r) / length;
	};

	const edgeX2 = (
		a: { x: number; y: number; r: number },
		b: { x: number; y: number; r: number }
	): number => {
		const length = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
		return b.x + ((a.x - b.x) * b.r) / length;
	};

	const edgeY2 = (
		a: { x: number; y: number; r: number },
		b: { x: number; y: number; r: number }
	): number => {
		const length = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
		return b.y + ((a.y - b.y) * b.r) / length;
	};

	$effect(() => {
		if (mouseState >= 0) {
			handleMouseEnter();
		} else {
			handleMouseLeave();
		}
	});

	onMount(() => {
		setTimeout(() => {
			handleMouseEnter();
		}, 1000);
		setTimeout(() => {
			handleMouseLeave();
		}, 2000);
	});
</script>

<a href="/">
	<!-- SVG Logo -->
	<svg viewBox="0 0 {viewboxSize} {viewboxSize}">
		<!-- Edges -->
		<line
			x1={edgeX1(v1.current, v2.current)}
			y1={edgeY1(v1.current, v2.current)}
			x2={edgeX2(v1.current, v2.current)}
			y2={edgeY2(v1.current, v2.current)}
			stroke-width={strokeWidth}
			stroke="white"
		/>

		<line
			x1={edgeX1(v1.current, v3.current)}
			y1={edgeY1(v1.current, v3.current)}
			x2={edgeX2(v1.current, v3.current)}
			y2={edgeY2(v1.current, v3.current)}
			stroke-width={strokeWidth}
			stroke="white"
		/>

		<!-- Vertices -->
		<circle
			cx={v1.current.x}
			cy={v1.current.y}
			r={bigCircleRadius}
			fill="transparent"
			stroke="white"
			stroke-width={strokeWidth}
		/>
		<circle
			cx={v2.current.x}
			cy={v2.current.y}
			r={circleRadius}
			fill="transparent"
			stroke="white"
			stroke-width={strokeWidth}
		/>
		<circle
			cx={v3.current.x}
			cy={v3.current.y}
			r={circleRadius}
			fill="transparent"
			stroke="white"
			stroke-width={strokeWidth}
		/>
	</svg>
</a>

<style>
	svg {
		width: 1.5rem;
	}
</style>
