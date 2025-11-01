import {
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors
} from '@dnd-kit-svelte/core';

export const sensors = useSensors(
	useSensor(TouchSensor),
	useSensor(KeyboardSensor),
	useSensor(MouseSensor)
);
