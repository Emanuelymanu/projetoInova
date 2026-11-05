/** Erro previsto: a mensagem é segura para devolver ao cliente. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
