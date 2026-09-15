// A single breadcrumb node. Loads can return a `breadcrumbs` array in their page
// data to give the navigation bar the real entity names for the current route,
// instead of letting it guess from the raw URL path.
//
// A page whose trail is built by its layout can return `breadcrumbLeaf` instead, and the
// navigation bar appends it to that trail. That keeps the leaf out of the layout load, which
// would otherwise have to read `url` and so re-run on every navigation within the layout.
export type Breadcrumb = { name: string; url: string };
