export type GridStateType = {
	columnTemplate: string[];
};

export class GridState implements GridStateType {
	columnTemplate: string[] = $state([]);
}
