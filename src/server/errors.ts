export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class MissingConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingConfigurationError";
  }
}

export function logError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[audit] ${scope}: ${message}`);
}
