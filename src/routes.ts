export function path(path: string, view: string) {
	return {
		path,
		view,
	} as const;
}
