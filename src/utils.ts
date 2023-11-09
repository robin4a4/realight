export function createSlug(string: string) {
	return string.replaceAll("/", "-").replaceAll(".tsx", "");
}
