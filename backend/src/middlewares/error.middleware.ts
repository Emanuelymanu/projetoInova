import type { NextFunction, Request, Response } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function rotaNaoEncontrada(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Rota não encontrada'));
}

// O Express só reconhece o handler de erro pela assinatura com 4 parâmetros.
export function tratarErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: err.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message,
      })),
    });
    return;
  }
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ erro: 'Já existe um registro com esses dados' });
    return;
  }
  if (err instanceof ForeignKeyConstraintError) {
    res.status(400).json({ erro: 'Registro relacionado não encontrado' });
    return;
  }
  // Erros do body-parser (ex.: JSON malformado) trazem um status 4xx.
  const status = (err as { status?: number }).status;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ erro: 'Requisição inválida' });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
