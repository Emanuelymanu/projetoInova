import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { CartaoPonto } from '@/components/CartaoPonto';
import { LeitorTag } from '@/components/LeitorTag';
import { Texto } from '@/components/Texto';
import { useRota } from '@/contexts/RotaContext';
import { cores } from '@/theme';
import { distanciaKm, formatarKm, prioridadeDe } from '@/utils/formatar';

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'prioridade', rotulo: 'Prioridade' },
  { id: 'pendentes', rotulo: 'Pendentes' },
  { id: 'concluidas', rotulo: 'Concluídas' },
] as const;
type Filtro = (typeof FILTROS)[number]['id'];

export default function Rota() {
  const { nomeRota, lixeiras, coletadas, confirmacoes, alternarColeta, finalizar, carregando, erro, atualizar } = useRota();
  const [leitorAberto, setLeitorAberto] = useState(false);
  // O filtro fica no parâmetro da rota, para o Início poder abrir a tela já filtrada
  // (ex.: o alerta de "coleta urgente" abre em "Prioridade").
  const params = useLocalSearchParams<{ filtro?: string }>();
  const filtro: Filtro = FILTROS.find((f) => f.id === params.filtro)?.id ?? 'todas';
  const setFiltro = (id: Filtro) => router.setParams({ filtro: id });
  const [atualizando, setAtualizando] = useState(false);

  // A ordem é a de visita definida pelo gestor. A distância é até o ponto anterior da rota.
  const pontos = useMemo(
    () =>
      lixeiras.map((lixeira, i) => ({
        lixeira,
        ordem: i + 1,
        distancia: i === 0 ? null : formatarKm(distanciaKm(lixeiras[i - 1], lixeira)),
      })),
    [lixeiras],
  );

  const visiveis = pontos.filter(({ lixeira }) => {
    const coletada = coletadas.has(lixeira.id);
    if (filtro === 'prioridade') return !coletada && prioridadeDe(lixeira) === 'alta';
    if (filtro === 'pendentes') return !coletada;
    if (filtro === 'concluidas') return coletada;
    return true;
  });

  const coletadasNaRota = lixeiras.filter((l) => coletadas.has(l.id)).length;

  function aoFinalizar() {
    const faltam = lixeiras.length - coletadasNaRota;
    Alert.alert(
      'Finalizar rota?',
      faltam > 0
        ? `${faltam} ${faltam === 1 ? 'ponto ficará registrado' : 'pontos ficarão registrados'} como não coletado.`
        : 'Todos os pontos foram coletados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            await finalizar();
            router.navigate('/historico');
          },
        },
      ],
    );
  }

  async function aoPuxar() {
    setAtualizando(true);
    await atualizar();
    setAtualizando(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <Cabecalho
        titulo="Pontos da rota"
        subtitulo={nomeRota ? `${nomeRota} · ${lixeiras.length} lixeiras na ordem de visita` : 'Nenhuma rota atribuída'}
        acao={
          lixeiras.length > 0 && (
            <Pressable
              onPress={() => setLeitorAberto(true)}
              style={({ pressed }) => [estilos.botaoTag, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
            >
              <Ionicons name="scan" size={18} color="#FFFFFF" />
              <Texto peso="bold" tamanho={14}>
                Ler tag
              </Texto>
            </Pressable>
          )
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros} style={{ marginHorizontal: -20 }}>
          {FILTROS.map((f) => {
            const ativo = filtro === f.id;
            return (
              <Pressable key={f.id} onPress={() => setFiltro(f.id)} style={[estilos.filtro, ativo && estilos.filtroAtivo]}>
                <Texto peso="semibold" tamanho={14} cor={ativo ? '#FFFFFF' : cores.textoSuave}>
                  {f.rotulo}
                </Texto>
              </Pressable>
            );
          })}
        </ScrollView>
      </Cabecalho>

      <FlatList
        data={visiveis}
        keyExtractor={(p) => String(p.lixeira.id)}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 96 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoPuxar} tintColor={cores.texto} />}
        renderItem={({ item }) => (
          <CartaoPonto
            lixeira={item.lixeira}
            ordem={item.ordem}
            distancia={item.distancia}
            coletada={coletadas.has(item.lixeira.id)}
            confirmacao={confirmacoes.get(item.lixeira.id)}
            aoAlternar={() => alternarColeta(item.lixeira.id)}
          />
        )}
        ListEmptyComponent={
          carregando ? (
            <ActivityIndicator color={cores.primaria} style={{ marginTop: 40 }} />
          ) : (
            <View style={estilos.vazio}>
              <Ionicons name={erro ? 'cloud-offline-outline' : 'checkmark-done-circle-outline'} size={44} color={cores.textoFraco} />
              <Texto cor={cores.textoSuave} style={{ textAlign: 'center' }}>
                {erro ?? (filtro !== 'todas' ? 'Nenhum ponto neste filtro.' : nomeRota ? 'Esta rota não tem pontos.' : 'Nenhuma rota atribuída para hoje.')}
              </Texto>
            </View>
          )
        }
      />

      {lixeiras.length > 0 && (
        <Pressable onPress={aoFinalizar} style={({ pressed }) => [estilos.finalizar, pressed && { opacity: 0.85 }]}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          <Texto peso="bold" tamanho={14}>
            Finalizar rota · {coletadasNaRota}/{lixeiras.length}
          </Texto>
        </Pressable>
      )}
      <LeitorTag visivel={leitorAberto} aoFechar={() => setLeitorAberto(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  filtros: { gap: 8, paddingHorizontal: 20, marginTop: 16 },
  filtro: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
  },
  botaoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: cores.primaria,
  },
  filtroAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  vazio: { alignItems: 'center', gap: 10, marginTop: 48, paddingHorizontal: 24 },
  finalizar: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: cores.verde,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
