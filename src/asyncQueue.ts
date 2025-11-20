type Job<T> = {
  work: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

export class AsyncQueue<T> {
  private queue: Job<T>[] = [];
  private active = 0;

  constructor(private concurrency = 5) {}

  push(work: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ work, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.active >= this.concurrency) return;

    const job = this.queue.shift();
    if (!job) return;

    this.active++;

    try {
      const result = await job.work();
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    } finally {
      this.active--;
      this.process();
    }
  }
}