import * as Sentry from "@sentry/react";

export const debug = (...args: any) => {
  console.debug(...args);
};

export const debugWithSentry = (...args: any) => {
  console.debug(...args);
  try {
    const message = args.reduce((acc: string, curr: any) => acc + JSON.stringify(curr) + ", ", "");
    Sentry.captureMessage(message);
  } catch (error) {
    Sentry.captureMessage(args);
  }
};
