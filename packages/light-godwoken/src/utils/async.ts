export function waitFor(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function retryIfFailed<T = any>(action: () => T, maxRetry = 3, interval = 1000) {
  let retries = 0;

  async function process(): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (retries < maxRetry) {
        await waitFor(interval);
        retries += 1;
        return await process();
      } else {
        throw error;
      }
    }
  }

  return await process();
}
