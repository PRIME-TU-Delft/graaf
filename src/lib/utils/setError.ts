import { fail } from '@sveltejs/kit';
import type {
	FormPathLeavesWithErrors,
	SuperValidated,
	ValidationErrors
} from 'sveltekit-superforms';

/**
 * This code is directly copied from the sveltekit-superforms repo
 * The orignal imported code is not compatible with vitest,
 * in the future (when sveltekit-superform has a stable release for svelte-5)
 * we will replace this with the original code
 */

type PathData<T extends object> = {
	parent: T;
	key: keyof T;
	value: T[keyof T];
	path: (string | number | symbol)[];
	isLeaf: boolean;
	set: (value: T[keyof T]) => 'skip';
};

function setPath<T extends object>(parent: T, key: keyof T, value: T[keyof T]): 'skip' {
	parent[key] = value;
	return 'skip';
}

function traversePath<T extends object>(
	obj: T,
	realPath: (string | number | symbol)[],
	modifier?: (data: PathData<T>) => undefined | unknown | void
): PathData<T> | undefined {
	if (!realPath.length) return undefined;
	const path = [realPath[0]];
	let parent = obj;
	while (parent && path.length < realPath.length) {
		const key = path[path.length - 1] as keyof T;
		const value = modifier
			? modifier({
					parent,
					key: String(key) as keyof T,
					value: parent[key],
					path: path.map((p) => String(p)),
					isLeaf: false,
					set: (v) => setPath(parent, key, v)
				})
			: parent[key];
		if (value === undefined) return undefined;
		else parent = value as T;
		path.push(realPath[path.length]);
	}
	if (!parent) return undefined;
	const key = realPath[realPath.length - 1];
	return {
		parent,
		key: String(key) as keyof T,
		value: parent[key as keyof T],
		path: realPath.map((p) => String(p)),
		isLeaf: true,
		set: (v) => setPath(parent, key as keyof T, v)
	};
}

type SetErrorOptions = {
	overwrite?: boolean;
	removeFiles?: boolean;
	status?: number;
};

export function setError<
	T extends Record<string, unknown>,
	Path extends FormPathLeavesWithErrors<T>,
	M,
	In extends Record<string, unknown>
>(form: SuperValidated<T, M, In>, path: '' | Path, error: string, options: SetErrorOptions = {}) {
	const errArr = Array.isArray(error) ? error : [error];
	form.valid = false;

	if (!form.errors) form.errors = {};

	if (path === null || path === '') {
		if (!form.errors._errors) form.errors._errors = [];
		form.errors._errors = options.overwrite ? errArr : form.errors._errors.concat(errArr);

		return fail(options.status ?? 400, { form });
	}

	const realPath = path
		.toString()
		.split(/[[\].]+/)
		.filter((p) => p);

	const leaf = traversePath(form.errors, realPath, ({ parent, key, value }) => {
		if (value === undefined) return undefined;
		return parent[key];
	});

	if (leaf) {
		const errors =
			Array.isArray(leaf.value) && !options.overwrite ? leaf.value.concat(errArr) : errArr;

		leaf.parent[leaf.key] = errors as ValidationErrors<T>['_errors' | typeof leaf.key];
	}

	return fail(options.status ?? 400, { form });
}
