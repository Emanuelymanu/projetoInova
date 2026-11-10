import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, View } from 'react-native';
import { BarraNivel } from '@/components/BarraNivel';
import { Cabecalho } from '@/components/Cabecalho';
import { Selo } from '@/components/Selo';
import { Texto } from '@/components/Texto';
import { useRota } from '@/contexts/RotaContext';
import { useSessao } from '@/contexts/SessaoContext';
import type { RotaConcluida } from '@/services/tipos';
import { cores } from '@/theme';
import { dataCurta } from '@/utils/formatar';

export default function Historico() {
  const { historico } = useRota();
  const { sessao } = useSessao();

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Cabecalho titulo="Histórico de coletas" subtitulo={`${sessao?.usuario.nome ?? ''} · Matrícula ${sessao?.usuario.id ?? ''}`} />
      <FlatList
        data={historico}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        renderItem={({ item }) => <CartaoRota rota={item} />}
        ListEmptyComponent={
          <View style={estilos.vazio}>
            <Ionicons name="document-text-outline" size={44} color={cores.textoFraco} />
            <Texto cor={cores.textoSuave} style={{ textAlign: 'center' }}>
              Nenhuma rota finalizada ainda.{'\n'}Ao finalizar uma rota, ela aparece aqui.
            </Texto>
          </View>
        }
      />
    </View>
  );
}

function CartaoRota({ rota }: { rota: RotaConcluida }) {
  const ocorrencias = rota.pontos - rota.coletas;
  const completa = ocorrencias === 0;
  const pct = rota.pontos ? (rota.coletas / rota.pontos) * 100 : 0;

  return (
    <View style={estilos.cartao}>
      <View style={estilos.topo}>
        <View style={{ flex: 1 }}>
          <Texto peso="bold" tamanho={17}>
            {rota.nome}
          </Texto>
          <Texto tamanho={12} cor={cores.textoSuave}>
            {dataCurta(rota.data, true)}
          </Texto>
        </View>
        {completa ? (
          <Selo texto="Completa" cor={cores.verde} fundo={cores.verdeFundo} borda={cores.verdeBorda} />
        ) : (
          <Selo texto="Parcial" cor={cores.amarelo} fundo={cores.amareloFundo} borda={cores.amareloBorda} />
        )}
      </View>
      <View style={estilos.numeros}>
        <Texto peso="semibold" cor={cores.textoSuave}>
          {rota.pontos} pontos
        </Texto>
        <Texto peso="semibold" cor={cores.verde}>
          {rota.coletas} coletas
        </Texto>
        {!completa && (
          <Texto peso="semibold" cor="#FB923C">
            {ocorrencias} {ocorrencias === 1 ? 'ocorrência' : 'ocorrências'}
          </Texto>
        )}
      </View>
      <BarraNivel pct={pct} cor={cores.verde} />
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
    gap: 12,
  },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  numeros: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  vazio: { alignItems: 'center', gap: 10, marginTop: 48, paddingHorizontal: 24 },
});
