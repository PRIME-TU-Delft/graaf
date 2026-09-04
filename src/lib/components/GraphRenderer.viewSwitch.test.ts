// @vitest-environment jsdom

// Regression test for issue #181: GraphDecorators' view-switch handler used to call
// `graphD3.setView(tab)` directly *and* navigate the URL via `gotoView(tab)`. Since the URL
// update lands a tick later than the direct call, GraphRenderer's URL-driven effect could fire
// with a stale `view` value and trigger an extra, overlapping transition, leaving a
// setTimeout-armed fade-out `end` handler pointing at DOM nodes that a later transition had
// already reused (matched by uuid) as the current, correctly-rendered content. That handler
// fires afterward and deletes them, silently zeroing out the rendered graph. The fix removed the
// direct call, leaving the URL-driven effect as the sole transition trigger.
//
// This test mounts GraphDecorators + GraphRenderer together (via a small harness mirroring how
// src/routes/graph/example/+page.svelte wires `view`/`lectureID` from the URL), drives repeated
// domains <-> lectures switches through the real dropdown, and asserts the rendered node count
// matches the selected lecture's node count after each switch, both right after the transition
// settles and again after a further animation duration, to catch a removal deferred past that
// point.

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, tick } from 'svelte';

import * as settings from '$lib/settings';
import { buildGraphFixture } from '../../test-setup/graphFixture';
import { __setPageUrl } from '../../test-setup/mocks/appState.svelte';
import { graphD3Store } from '$lib/d3/graphD3.svelte';

vi.mock('$app/state', () => import('../../test-setup/mocks/appState.svelte'));
vi.mock('$app/navigation', () => import('../../test-setup/mocks/appNavigation'));
vi.mock('$app/stores', () => import('../../test-setup/mocks/appStores'));
vi.mock('$app/environment', () => import('../../test-setup/mocks/appEnvironment'));
vi.mock('$app/forms', () => import('../../test-setup/mocks/appForms'));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Comfortably past GRAPH_ANIMATION_DURATION, so every setTimeout/transition chain a switch can
// schedule (including the two-stage lecturesToDomains animation) has fully settled.
const SETTLE_MS = settings.GRAPH_ANIMATION_DURATION * 3;

describe('GraphDecorators + GraphRenderer view-switch race', () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
		document.body.innerHTML = '';
		graphD3Store.graphD3 = undefined;
	});

	function viewDropdownTrigger() {
		const trigger = container.querySelector<HTMLButtonElement>('button.rounded-ee-2xl');
		if (!trigger) throw new Error('View dropdown trigger not found');
		return trigger;
	}

	async function openViewDropdown() {
		viewDropdownTrigger().dispatchEvent(
			new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' })
		);
		await tick();
	}

	async function switchView(label: 'Domains' | 'Subjects' | 'Lectures') {
		await openViewDropdown();

		const item = Array.from(document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
			(el) => el.textContent?.trim() === label
		);
		if (!item) throw new Error(`Dropdown item "${label}" not found`);

		item.click();
		await tick();
		await sleep(SETTLE_MS);
		await tick();
	}

	function renderedNodeCount() {
		return container.querySelectorAll('.node').length;
	}

	it('keeps the rendered node count in sync with the lecture across repeated view switches', async () => {
		const graph = buildGraphFixture();
		const lecture = graph.lectures[0];

		__setPageUrl(new URL(`http://localhost/graph/test?view=DOMAINS&lectureID=${lecture.id}`));

		const { default: ViewSwitchHarness } =
			await import('../../test-setup/ViewSwitchHarness.svelte');
		const app = mount(ViewSwitchHarness, { target: container, props: { data: graph } });
		await tick();

		expect(renderedNodeCount()).toBe(graph.domains.length);

		// The node count the lectures view should show: the lecture's own subjects plus whatever
		// past/future subjects formatPayload pulled in via subject edges. Read from the formatted
		// data rather than hardcoded, so this doesn't drift if the fixture changes.
		const expectedLectureNodeCount = graphD3Store.graphD3!.data.lectures.find(
			(l) => l.id === lecture.id
		)!.nodes.length;

		for (let round = 0; round < 3; round++) {
			await switchView('Lectures');
			expect(renderedNodeCount()).toBe(expectedLectureNodeCount);

			// The bug's fade-out `end` handler fires this long after the transition that armed it -
			// check again to catch a removal deferred past the initial settle.
			await sleep(SETTLE_MS);
			expect(renderedNodeCount()).toBe(expectedLectureNodeCount);

			await switchView('Domains');
			expect(renderedNodeCount()).toBe(graph.domains.length);
		}

		unmount(app);
	}, 75000);
});
