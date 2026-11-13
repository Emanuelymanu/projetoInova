import { QueryTypes } from 'sequelize';
import { LIMITE_CHEIA_PCT } from '../config/constants';
import { sequelize } from '../config/database';
import { Zona } from '../models';
import { AppError } from '../utils/AppError';
import type { AtualizarZonaInput, CriarZonaInput } from '../validators/zona.validator';

interface Contagem {
  zona_id: number;
  total: number;
  cheias: number;
  nivel_medio: number | null;
}

/** Zonas com a quantidade de lixeiras ativas, quantas estão cheias e o nível médio. */
export async function listarZonas() {
  const zonas = await Zona.findAll({ order: [['nome', 'ASC']] });
  const contagens = await sequelize.query<Contagem>(
    `SELECT zona_id,
            COUNT(*) AS total,
            SUM(nivel_preenchimento_pct >= :limite) AS cheias,
            AVG(nivel_preenchimento_pct) AS nivel_medio
       FROM lixeiras
      WHERE zona_id IS NOT NULL AND status <> 'DESATIVADO'
      GROUP BY zona_id`,
    { type: QueryTypes.SELECT, replacements: { limite: LIMITE_CHEIA_PCT } },
  );
  const porZona = new Map(contagens.map((c) => [Number(c.zona_id), c]));

  return zonas.map((zona) => {
    const c = porZona.get(zona.id);
    return {
      id: zona.id,
      nome: zona.nome,
      descricao: zona.descricao,
      total_lixeiras: Number(c?.total ?? 0),
      lixeiras_cheias: Number(c?.cheias ?? 0),
      nivel_medio_pct: c?.nivel_medio == null ? null : Math.round(Number(c.nivel_medio)),
    };
  });
}

export async function criarZona(dados: CriarZonaInput) {
  const zona = await Zona.create({ nome: dados.nome, descricao: dados.descricao ?? null });
  return { id: zona.id, nome: zona.nome, descricao: zona.descricao };
}

export async function atualizarZona(id: number, dados: AtualizarZonaInput) {
  const zona = await Zona.findByPk(id);
  if (!zona) throw new AppError(404, 'Zona não encontrada');
  await zona.update(dados);
  return { id: zona.id, nome: zona.nome, descricao: zona.descricao };
}
