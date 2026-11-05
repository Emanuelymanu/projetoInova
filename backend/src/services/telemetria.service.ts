import { sequelize } from '../config/database';
import { HistoricoTelemetria, Lixeira } from '../models';
import { AppError } from '../utils/AppError';
import { calcularNivelPct, classificarSituacao } from '../utils/nivel';
import type { TelemetriaInput } from '../validators/telemetria.validator';

export async function registrarLeitura(dados: TelemetriaInput) {
  const lixeira = await Lixeira.findOne({
    where: { codigo_identificador: dados.codigo_identificador },
  });
  if (!lixeira) throw new AppError(404, 'Lixeira não cadastrada');

  const agora = new Date();
  const distancia_cm = Math.round(dados.distancia_cm);
  const nivel_preenchimento_pct = calcularNivelPct(distancia_cm, lixeira.altura_cm);
  const nivel_bateria_pct =
    dados.nivel_bateria_pct === undefined
      ? lixeira.nivel_bateria_pct
      : Math.round(dados.nivel_bateria_pct);

  await sequelize.transaction(async (transaction) => {
    await HistoricoTelemetria.create(
      {
        lixeira_id: lixeira.id,
        nivel_preenchimento_pct,
        nivel_bateria_pct,
        distancia_cm,
        data_hora: agora,
      },
      { transaction },
    );
    // A data vai explícita: o ON UPDATE do MySQL não dispara se o nível não mudou,
    // e a lixeira apareceria como "sem sinal" mesmo com o sensor funcionando.
    await lixeira.update(
      { nivel_preenchimento_pct, nivel_bateria_pct, ultima_atualizacao: agora },
      { transaction },
    );
  });

  return {
    codigo_identificador: lixeira.codigo_identificador,
    nivel_preenchimento_pct,
    nivel_bateria_pct,
    situacao: classificarSituacao(nivel_preenchimento_pct),
  };
}
