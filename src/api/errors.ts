export class UnauthorizedError extends Error {
  public static readonly type = 'UnauthorizedError';

  constructor(message: string) {
    super(message);
    this.name = UnauthorizedError.type;
  }
}

export class ForbiddenError extends Error {
  public static readonly type = 'ForbiddenError';

  constructor(message: string) {
    super(message);
    this.name = ForbiddenError.type;
  }
}