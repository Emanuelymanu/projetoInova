import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Confirmacao, Lixeira } from '@/services/tipos';
import { cores } from '@/theme';
import { ESTILO_PRIORIDADE, prioridadeDe, tempoDesde } from '@/utils/formatar';
import { BarraNivel } from './BarraNivel';
import { Selo } from './Selo';
import { Texto } from './Texto';

interface Props {
  lixeira: Lixeira;
  ordem: number;
  coletada: boolean;
  /** Como a coleta foi registrada; aparece no selo "Coletada". */
  confirmacao?: Confirmacao;
  distancia: string | null;
  aoAlternar: () => void;
}

const ORIGEM: Record<Confirmacao, string> = { RFID: 'tag', SENSOR: 'sensor', MANUAL: 'manual' };

export function CartaoPonto({ lixeira, ordem, coletada, confirmacao, distancia, aoAlternar }: Props) {
  const estilo = ESTILO_PRIORIDADE[prioridadeDe(lixeira)];
  const nivel = lixeira.nivel_preenchimento_pct;

  return (
    <View style={[estilos.cartao, coletada && estilos.cartaoColetado]}>
      <View style={estilos.topo}>
        <View style={[estilos.ordem, coletada && { backgroundColor: cores.verdeFundo }]}>
          {coletada ? (
            <Ionicons name="checkmark" size={16} color={cores.verde} />
          ) : (
            <Texto peso="bold" cor={cores.textoSuave}>
              {ordem}
            </Texto>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Texto peso="bold" tamanho={16} numberOfLines={1}>
            {lixeira.codigo_identificador}
          </Texto>
          <Texto tamanho={12} cor={cores.textoSuave} numberOfLines={1}>
            {lixeira.endereco ?? lixeira.zona?.nome ?? 'Sem zona'} · {lixeira.capacidade_litros} L
          </Texto>
        </View>
        {coletada ? (
          <Selo texto={confirmacao ? `Coletada · ${ORIGEM[confirmacao]}` : 'Coletada'} cor={cores.verde} fundo={cores.verdeFundo} borda={cores.verdeBorda} ponto />
        ) : (
          <Selo texto={estilo.rotulo} cor={estilo.cor} fundo={estilo.fundo} borda={estilo.borda} ponto />
        )}
      </View>

      <View style={estilos.linhaNivel}>
        <Texto tamanho={12} cor={cores.textoSuave}>
          Nível de preenchimento
        </Texto>
        <Texto peso="bold" tamanho={15} cor={estilo.cor}>
          {nivel}%
        </Texto>
      </View>
      <BarraNivel pct={nivel} cor={estilo.cor} />

      <View style={estilos.rodape}>
        <View style={estilos.infos}>
          {distancia && <Info icone="location-outline" texto={distancia} />}
          <Info
            icone="time-outline"
            texto={lixeira.sem_sinal ? `Sem sinal ${tempoDesde(lixeira.ultima_atualizacao)}` : `Lido ${tempoDesde(lixeira.ultima_atualizacao)}`}
            cor={lixeira.sem_sinal ? cores.amarelo : undefined}
          />
          <Info
            icone="battery-half-outline"
            texto={`${lixeira.nivel_bateria_pct}%`}
            cor={lixeira.nivel_bateria_pct < 20 ? cores.vermelho : undefined}
          />
        </View>
        <Pressable
          onPress={aoAlternar}
          hitSlop={8}
          style={({ pressed }) => [estilos.botaoColeta, coletada && estilos.botaoDesfazer, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={coletada ? 'Desfazer coleta' : 'Marcar como coletada'}
        >
          <Ionicons name={coletada ? 'arrow-undo' : 'checkmark'} size={14} color={coletada ? cores.textoSuave : '#FFFFFF'} />
          <Texto peso="semibold" tamanho={12} cor={coletada ? cores.textoSuave : '#FFFFFF'}>
            {coletada ? 'Desfazer' : 'Coletar'}
          </Texto>
        </Pressable>
      </View>
    </View>
  );
}

function Info({ icone, texto, cor = cores.textoSuave }: { icone: keyof typeof Ionicons.glyphMap; texto: string; cor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={icone} size={13} color={cor} />
      <Texto tamanho={12} cor={cor}>
        {texto}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 14,
    gap: 8,
  },
  cartaoColetado: { opacity: 0.6 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  ordem: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: cores.cartaoInterno,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaNivel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: 8 },
  infos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, flex: 1 },
  botaoColeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: cores.primaria,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  botaoDesfazer: { backgroundColor: 'transparent', borderWidth: 1, borderColor: cores.borda },
});
