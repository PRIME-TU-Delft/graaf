// A single breadcrumb node. Loads can return a `breadcrumbs` array in their page
// data to give the navigation bar the real entity names for the current route,
// instead of letting it guess from the raw URL path.
export type Breadcrumb = { name: string; url: string };
