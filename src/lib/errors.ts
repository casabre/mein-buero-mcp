export class MeinBueroApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "MeinBueroApiError";
  }
}

export function formatApiError(error: unknown): string {
  if (error instanceof MeinBueroApiError)
    return `MeinBüro API error ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}
