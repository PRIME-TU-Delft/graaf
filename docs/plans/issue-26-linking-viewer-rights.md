# Issue #26 — Fix linking when user has only viewer rights to the host

## Context

Program settings (`/graph-editor/programs/[programId]/settings`) is reachable by program admins
_and_ program editors. Course linking lives there (and on `/graph-editor` and
`/graph-editor/programs` through the same `AddCourse` component).

Three things are wrong today:

1. `CourseActions.linkCourses` requires `whereHasProgramPermission(user, 'ProgramAdmin')`, so a
   program editor cannot link or unlink at all. The settings page text says "Programme Editors are
   able to manage its courses.", so the action is the thing that is wrong, not the page.
2. The UI hides the link table from editors (`AddCourse.svelte` gates on `'ProgramAdmin'`), so an
   editor only sees "create new course". That matches what was observed while testing: editors can
   add courses to a program, but only by creating new ones.
3. The candidate list is `prisma.course.findMany({})` — every course in the system, with no
   course-level permission filter. Courses already in the program are dropped client-side with no
   explanation, and courses the user has no rights on are offered as if linkable.

### Permission decision (the part the triage brief flagged for a human)

- Program editors **may** link and unlink courses on programs they edit.
- A course can only be linked/unlinked if the user also has course-level rights on it, i.e.
  `CourseAdminEditorORProgramAdminEditor` (course admin, course editor, or admin/editor of any
  program the course already belongs to). Super admins keep bypassing everything.
- The same rule applies to unlink, so link and unlink stay symmetric. Consequence to be aware of:
  a program editor who has no rights on a course that is already in their program will not be able
  to unlink it. That is the conservative reading and it keeps one rule instead of two.

## Files

Server:

- `src/lib/server/actions/Courses.ts` — `linkCourses` (the permission fix)
- `src/lib/server/permissions.ts` — existing `whereHasProgramPermission` /
  `whereHasCoursePermission`, no change expected
- `src/routes/graph-editor/programs/[programId=int]/settings/+page.server.ts` — `allCourses` query
- `src/routes/graph-editor/programs/+page.server.ts` — `courses` query
- `src/routes/graph-editor/+page.server.ts` — `courses` query
  (all three feed the same `AddCourse` component; each has an error branch returning
  `emptyPrismaPromise([])` that must keep type-checking)

Client:

- `src/lib/components/addCourse/AddCourse.svelte` — permission gate + candidate filtering
- `src/lib/components/addCourse/LinkCourseDataTable.svelte` — row selection/disabled rows
- `src/lib/components/addCourse/add-course-columns.ts` — new reason column
- `src/lib/components/addCourse/LinkCourses.svelte` — submit form (id already unique)
- `src/routes/graph-editor/programs/[programId=int]/settings/courses/CoursesTable.svelte` —
  hides the select column and `UnlinkCourses` behind `'ProgramAdmin'`
- `src/routes/graph-editor/Program.svelte` — other `AddCourse` call site
- `src/lib/utils/permissions.ts` — `hasCoursePermissions` already exists for the client side

## Change

### 1. Server action: allow editors, check each course

In `CourseActions.linkCourses`, replace the single program-admin check with two checks.

```ts
static async linkCourses(
	user: User,
	form: SuperValidated<Infer<typeof linkingCoursesSchema>>,
	options: { link: boolean } = { link: true }
) {
	if (!form.valid) return setError(form, '', 'Form is not valid');

	// The user must be able to manage the program itself
	const program = await prisma.program.findFirst({
		where: {
			id: form.data.programId,
			...whereHasProgramPermission(user, 'ProgramAdminEditor')
		},
		select: { id: true }
	});
	if (!program) {
		return setError(form, '', "You don't have permission to link/unlink courses in this program");
	}

	// ...and must have rights on every course being linked/unlinked
	const permittedCourses = await prisma.course.findMany({
		where: {
			id: { in: form.data.courseIds },
			...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
		},
		select: { id: true, code: true }
	});

	if (permittedCourses.length !== form.data.courseIds.length) {
		const permitted = new Set(permittedCourses.map((c) => c.id));
		const missing = form.data.courseIds.filter((id) => !permitted.has(id));
		return setError(
			form,
			'courseIds',
			`You don't have permission on ${missing.length} of the selected courses`
		);
	}

	try {
		await prisma.program.update({
			where: { id: form.data.programId },
			data: getData()
		});
	} catch {
		return setError(form, '', 'Failed to link/unlink courses');
	}

	return { form };
}
```

Notes:

- Keep `getData()` as it is.
- The program-permission re-check is now a `findFirst` instead of relying on `update` throwing,
  because we want to distinguish "not allowed on this program" from "not allowed on these courses"
  in the error message.
- Current code returns `undefined` on success (no `{ form }`). Returning `{ form }` matches the
  other actions in this file; verify the client toast still fires after the change.
- No transaction needed: the two reads are checks, the write is a single `update`.

### 2. Scope the candidate list server-side

In all three load functions, add the course permission filter to the candidate query:

```ts
const courses = prisma.course.findMany({
	where: whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor'),
	orderBy: { updatedAt: 'desc' }
});
```

`whereHasCoursePermission` returns `{}` for super admins, so they still see everything.

In the program settings load (`allCourses`), the same filter applies. That query is currently not
awaited and is returned as a promise; keep it that way so streaming behaviour and the
`Promise<Course[]>` prop type do not change.

### 3. UI gate: editors see the link table

`AddCourse.svelte`:

```ts
const hasLinkRights = $derived(hasProgramPermissions(user, program, 'ProgramAdminEditor'));
```

and use `hasLinkRights` for the dialog title and the `{#if}` around `LinkCourseDataTable`.

`CoursesTable.svelte` gates the select column and `UnlinkCourses` on `'ProgramAdmin'` — change to
`'ProgramAdminEditor'` so unlink matches the new server rule.

### 4. Show why a course cannot be linked

After step 2 the list only contains courses the user may use, so the remaining reason a row is not
selectable is "already in this program". Stop silently filtering those out.

In `AddCourse.svelte`, instead of dropping already-linked courses, map them to a row model:

```ts
type LinkCandidate = Course & { linkable: boolean; reason?: string };

data = courses.map((c) => {
	const alreadyLinked = program.courses.some((course) => course.id === c.id);
	return {
		...c,
		linkable: !alreadyLinked,
		reason: alreadyLinked ? 'Already in this program' : undefined
	};
});
```

Note the existing code compares by `code`, not `id`; switch to `id` since that is what the link
form submits.

Change `add-course-columns.ts` to type against `LinkCandidate` and:

- render the select checkbox as `disabled` when `!row.original.linkable`
- add a `reason` column rendering `row.original.reason ?? ''` in muted text

In `LinkCourseDataTable.svelte`, block selecting non-linkable rows: guard the `onclick` handler
(`if (!row.original.linkable) return;`) and set `enableRowSelection: (row) => row.original.linkable`
on the table options so `getIsSelected()` and the tanstack state agree.

Keep the empty state honest: if every candidate row is non-linkable, still render the table so the
reasons are visible, rather than hiding the whole section. The `data.length > 0` condition in
`AddCourse.svelte` stays; the "or link one" dialog title should reflect that there is something to
look at even when nothing is selectable.

`LinkCourses.svelte` maps `rowSelection` indices into `courses[i]`; since rows are no longer
filtered, that array must be the same array passed to the table (it is — `data`), so indices stay
aligned. Double-check this after the change, it is the easiest thing to break.

## Verification

Type/lint:

```bash
pnpm check
pnpm lint
```

Manual, with `NETLIFY_CONTEXT=DEPLOY_PREVIEW pnpm run dev` and the seeded test users
(`prisma/seed.ts`, switch via the `user_id` cookie):

1. As a **program editor** of program P, open `/graph-editor/programs/<P>/settings`:
   - "Add course" dialog shows the link table
   - only courses the editor admins/edits appear
   - a course already in P appears disabled with "Already in this program"
   - linking a permitted course succeeds and the toast fires
   - unlinking a course the editor has rights on succeeds
2. As a **program admin**: behaviour unchanged from before (acceptance criterion 4).
3. As a **user with no course rights**: link table is empty or absent, and no course they cannot
   touch is listed.
4. Forge a request: submit `link-courses` with a `courseIds` entry the user has no rights on (edit
   the hidden input in devtools). Expect the form error, and expect the program to be unchanged in
   `pnpm prisma:studio`.

Step 4 is the one that proves this is a real permission fix and not just UI filtering.

## Out of scope

- Changing the permission tiers themselves (`src/lib/utils/permissions.ts` option names)
- Pagination of the course list (two of the three queries carry
  `TODO: Check if we need pagination here`; leave them)
- Any change to how courses are created
