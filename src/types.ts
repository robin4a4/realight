export type Params = {
	[key: string]: string | string[] | undefined;
};

export type ViewProps = {
	searchParams: URLSearchParams;
	params?: Params;
};

export type MetaObject = {
	title: string;
	description: string;
	icon: string;
};

export type Meta<
	TQueryData extends (() => Promise<Record<string, unknown>>) | null = null,
> = TQueryData extends () => Promise<Record<string, unknown>>
	? (data: Awaited<ReturnType<TQueryData>>) => MetaObject
	: MetaObject;
