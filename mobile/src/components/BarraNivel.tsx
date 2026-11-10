import { View } from 'react-native';
import { cores } from '@/theme';

export function BarraNivel({ pct, cor, altura = 6 }: { pct: number; cor: string; altura?: number }) {
  const largura = `${Math.min(100, Math.max(0, pct))}%` as const;
  return (
    <View style={{ height: altura, borderRadius: altura, backgroundColor: cores.borda, overflow: 'hidden' }}>
      <View style={{ width: largura, height: '100%', borderRadius: altura, backgroundColor: cor }} />
    </View>
  );
}
