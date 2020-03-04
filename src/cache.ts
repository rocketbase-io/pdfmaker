export class Cache<K, V> {
  private readonly keys: K[] = [];
  private readonly values: V[] = [];

  constructor(private readonly maxSize?: number, private readonly parent?: Cache<K, V>, private readonly destroyCallback?: (key: K, value: V) => void, private readonly shouldCache?: (key: K) => boolean) {
  }

  public get(key: K): V | null {
    const index = this.keys.indexOf(key);
    if (index === -1) return null;
    return this.values[index];
  }

  public async getOrComputeAsync(key: K, supplier: () => Promise<V>): Promise<V> {
    let value = this.get(key) ?? (this.parent && this.parent.get(key));
    if (value)
      return value;
    value = await supplier();
    this.put(key, value);
    return value;
  }

  public put(key: K, value: V): void {
    if (this.shouldCache && !this.shouldCache(key)) return;
    this.keys.push(key);
    this.values.push(value);
    while (this.maxSize && this.keys.length > this.maxSize) {
      this.removeIndex(0);
    }
  }

  public transferIntoParent(): void {
    if (!this.parent) throw new Error('Cache has no parent!');
    while (this.keys.length) {
      const key = this.keys.shift()!;
      const value = this.values.shift()!;
      this.parent.put(key, value);
    }
  }

  public destroy(): void {
    if (this.destroyCallback) {
      this.keys.forEach((key, index) => this.destroyCallback!(key, this.values[index]));
    }
  }

  private removeIndex(index: number): void {
    const [key] = this.keys.splice(index, 1);
    const [value] = this.values.splice(index, 1);
    if (this.destroyCallback)
      this.destroyCallback(key, value);
  }
}
