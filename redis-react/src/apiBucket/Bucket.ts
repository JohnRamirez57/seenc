export class TokenBucket {
    private capacity: number;
    private tokens: number;
    private refillRate: number;
    private lastRefill: number;

    constructor(capacity: number, refillRate: number) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }

    private refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;

        this.tokens = Math.min(
            this.capacity,
            this.tokens + elapsed * this.refillRate
        );

        this.lastRefill = now;
    }

    async acquire() {
        while (true) {
            this.refill();

            if (this.tokens >= 1) {
                this.tokens -= 1;
                return;
            }

            const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;

            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}