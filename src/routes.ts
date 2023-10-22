
export function path<TView>(path: string, view: TView) {
	return {
		path,
		view,
	} as const;
}
