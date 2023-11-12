import { JsonResponse, RedirectResponse } from "./responses";

export type QueryDefaultType =
	| Record<string, unknown>
	| Record<string, unknown>[]
	| null;

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

export type QueryType = ({
	req,
	searchParams,
	params,
}: {
	req: Request;
	searchParams?: URLSearchParams;
	params?: Params;
}) => Promise<QueryDefaultType>;

export type MutateType = ({
	req,
	searchParams,
	params,
}: {
	req: Request;
	searchParams?: URLSearchParams;
	params?: Params;
}) => ReturnType<typeof JsonResponse | typeof RedirectResponse>;

export type Meta<
	TQueryData extends (() => Promise<QueryDefaultType>) | null = null,
> = TQueryData extends () => Promise<QueryDefaultType>
	? (data: Awaited<ReturnType<TQueryData>>) => MetaObject
	: MetaObject;

export type ViewModuleType = {
	query?: QueryType;
	mutate?: MutateType;
	meta?: Meta<() => Promise<QueryDefaultType>>;
	default: (viewProps?: ViewProps) => React.ReactNode;
};
