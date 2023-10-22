export function JsonResponse<TData = Record<string, unknown>>(
	data: TData,
	options: { revalidate?: boolean } = {},
) {
	return {
		type: "json-response",
		data,
		...options,
	};
}
