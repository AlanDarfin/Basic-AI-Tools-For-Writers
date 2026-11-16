export class HtmlConflict extends Error {
  constructor() {
    super(
      "The HTML file changed outside this editor. Reload it, save your edits as a copy, or resolve in Source mode.",
    );
  }
}

/** Each write compares against the exact last-read source inside Vault.process's atomic callback. */
export class HtmlPersistence {
  baseline: string;
  current: string;
  saving = false;
  private queue: Promise<void> = Promise.resolve();
  constructor(
    source: string,
    private process: (change: (disk: string) => string) => Promise<unknown>,
  ) {
    this.baseline = this.current = source;
  }
  get dirty() {
    return this.current !== this.baseline;
  }
  whenIdle(): Promise<void> {
    return this.queue.catch(() => {});
  }
  save(): Promise<void> {
    const result = this.queue
      .catch(() => {})
      .then(async () => {
        if (!this.dirty) return;
        const snapshot = this.current;
        this.saving = true;
        try {
          await this.process((disk) => {
            if (disk !== this.baseline) throw new HtmlConflict();
            return snapshot;
          });
          this.baseline = snapshot;
        } finally {
          this.saving = false;
        }
      });
    this.queue = result;
    return result;
  }
}
