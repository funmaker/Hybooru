declare type ArrayElement<A> = A extends ReadonlyArray<infer T> ? T : never;

declare type Empty = Record<any, never>;

declare interface JustId { id: string }

declare type SetState<T> = (state: T | ((prev: T) => T)) => void;
