import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3307),
  DB_USER: z.string().default('admin'),
  DB_PASS: z.string().default('adminpassword'),
  DB_NAME: z.string().default('residuos_iot_db'),
  // Sem valor padrão de propósito: a API não sobe com um segredo conhecido.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),
  SENSOR_API_KEY: z.string().min(16, 'SENSOR_API_KEY precisa ter pelo menos 16 caracteres'),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  console.error('Configuração inválida no .env (veja o .env.example):');
  for (const issue of resultado.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = resultado.data;
