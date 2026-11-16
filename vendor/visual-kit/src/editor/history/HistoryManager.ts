export class HistoryManager<T> {
  private past: T[] = [];
  private future: T[] = [];
  constructor(private limit = 80) {}
  push(value: T) {
    const state = JSON.stringify(value);
    if (JSON.stringify(this.past.at(-1)) === state) return;
    this.past.push(structuredClone(value));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }
  undo(): T | null {
    if (this.past.length < 2) return null;
    this.future.push(this.past.pop()!);
    return structuredClone(this.past.at(-1)!);
  }
  redo(): T | null {
    const state = this.future.pop();
    if (state === undefined) return null;
    this.past.push(state);
    return structuredClone(state);
  }
}
