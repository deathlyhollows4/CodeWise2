// Bounded UTF-16 text batches. Timers never persist or broadcast outside onBatch.
export class StreamBatcher {
  private text = "";
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  constructor(
    private onBatch: (text: string) => void,
    private onError: (error: unknown) => void,
    readonly maxCharacters = 8192,
    readonly delayMs = 100,
  ) {}
  push(text: string) {
    if (this.disposed) return;
    this.text += text;
    while (this.text.length >= this.maxCharacters)
      this.flush(this.maxCharacters);
    if (this.text && !this.timer)
      this.timer = setTimeout(() => {
        this.timer = undefined;
        try {
          this.flush();
        } catch (error) {
          this.onError(error);
        }
      }, this.delayMs);
  }
  flush(limit = this.text.length) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.text || this.disposed) return;
    // Do not split a UTF-16 surrogate pair across independently rendered batches.
    if (
      limit < this.text.length &&
      /[\uD800-\uDBFF]/.test(this.text[limit - 1])
    )
      limit--;
    const batch = this.text.slice(0, limit);
    this.onBatch(batch); // Failure preserves pending text, without acknowledging it.
    this.text = this.text.slice(limit);
  }
  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.text = "";
    this.disposed = true;
  }
}
