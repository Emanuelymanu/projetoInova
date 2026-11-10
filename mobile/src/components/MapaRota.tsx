import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import type { Lixeira } from '@/services/tipos';
import { cores } from '@/theme';
import { ESTILO_PRIORIDADE, prioridadeDe, type Prioridade } from '@/utils/formatar';
import { Texto } from './Texto';

const MARGEM = 22;
const RAIO = 7;

/**
 * Mapa esquemático: posiciona as lixeiras pela latitude/longitude dentro do quadro,
 * sobre uma malha de ruas desenhada. Não usa tiles, então funciona no Expo Go e offline.
 */
export function MapaRota({ lixeiras, coletadas, altura = 160 }: { lixeiras: Lixeira[]; coletadas: Set<number>; altura?: number }) {
  const [largura, setLargura] = useState(0);
  const aoMedir = (e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width);

  const lats = lixeiras.map((l) => l.latitude);
  const lngs = lixeiras.map((l) => l.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const faixaLat = maxLat - minLat || 1;
  const faixaLng = maxLng - minLng || 1;

  const posicionar = (l: Lixeira) => ({
    x: lixeiras.length === 1 ? largura / 2 : MARGEM + ((l.longitude - minLng) / faixaLng) * (largura - MARGEM * 2),
    // Latitude cresce para o norte, a tela cresce para baixo.
    y: lixeiras.length === 1 ? altura / 2 : MARGEM + ((maxLat - l.latitude) / faixaLat) * (altura - MARGEM * 2 - 18),
  });

  const ruasV = Array.from({ length: 9 }, (_, i) => ((i + 1) * largura) / 10);
  const ruasH = Array.from({ length: 5 }, (_, i) => ((i + 1) * altura) / 6);

  return (
    <View style={[estilos.quadro, { height: altura }]} onLayout={aoMedir}>
      {largura > 0 && (
        <Svg width={largura} height={altura}>
          <Rect width={largura} height={altura} fill="#0F1F3A" />
          {ruasV.map((x, i) => (
            <Line key={`v${i}`} x1={x} y1={0} x2={x + (i % 2 ? 6 : -4)} y2={altura} stroke="#1B3260" strokeWidth={i % 3 === 0 ? 2 : 1} />
          ))}
          {ruasH.map((y, i) => (
            <Line key={`h${i}`} x1={0} y1={y} x2={largura} y2={y + (i % 2 ? -5 : 4)} stroke="#1B3260" strokeWidth={i % 2 === 0 ? 2 : 1} />
          ))}
          {lixeiras.map((l) => {
            const { x, y } = posicionar(l);
            const coletada = coletadas.has(l.id);
            const cor = coletada ? cores.textoFraco : ESTILO_PRIORIDADE[prioridadeDe(l)].cor;
            return <Circle key={l.id} cx={x} cy={y} r={RAIO} fill={cor} stroke="#FFFFFF" strokeWidth={2} />;
          })}
        </Svg>
      )}

      {/* Caminhão no centro do quadro, como referência de posição. */}
      <View style={[estilos.caminhao, { left: largura / 2 - 13, top: altura / 2 - 13 }]}>
        <Ionicons name="bus" size={13} color="#FFFFFF" />
      </View>

      <View style={estilos.legenda}>
        {(['alta', 'media', 'baixa'] as Prioridade[]).map((p) => (
          <View key={p} style={estilos.itemLegenda}>
            <View style={[estilos.bolinha, { backgroundColor: ESTILO_PRIORIDADE[p].cor }]} />
            <Texto tamanho={11} cor={cores.texto}>
              {ESTILO_PRIORIDADE[p].legenda}
            </Texto>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  quadro: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: '#0F1F3A',
  },
  caminhao: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: cores.primaria,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legenda: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(10,18,32,0.85)',
  },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bolinha: { width: 7, height: 7, borderRadius: 4 },
});
