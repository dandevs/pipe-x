export function removeFromArray<T>(arr: T[], item: T) {
    const index = arr.indexOf(item);
    if (index > -1) arr.splice(index, 1);
}

export const noop: (...args: any[]) => any = () => {};