import { GraphD3 } from '$lib/d3/GraphD3';
import type { PrismaGraphPayload } from '$lib/d3/types';

class GraphD3Store {
	graphD3 = $state<GraphD3>();

	constructor() {}

	setGraphD3(d3Canvas: SVGSVGElement, payload: PrismaGraphPayload, editable: boolean) {
		this.graphD3 = new GraphD3(d3Canvas, payload, editable);
	}
}

export const graphD3Store = new GraphD3Store();
