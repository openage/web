export class InProcessStorage implements Storage {
    store: any = {};

    [name: string]: any;
    length: number = 0;

    clear(): void {
        this.store = {};
    }
    getItem(key: string): string | null {
        return this.store[key] as string;
    }
    key(index: number): string| null {
        const keys = Object.getOwnPropertyNames(this.store);

        if (!keys || !keys.length) {
            return null;
        }
        return this.store[keys[0]];
    }
    removeItem(key: string): void {
        this.store[key] = undefined;
    }
    setItem(key: string, value: string): void {
        this.store[key] = value;
    }
}
