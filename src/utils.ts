export function noop(...args: any[]) {}

export function removeFromArray<T>(arr: T[], item: T) {
    arr.splice(arr.indexOf(item), 1);
}