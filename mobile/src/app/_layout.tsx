import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RotaProvider } from '@/contexts/RotaContext';
import { SessaoProvider, useSessao } from '@/contexts/SessaoContext';
import { cores } from '@/theme';

function Navegacao() {
  const { carregando, sessao } = useSessao();

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    );
  }

  // A key recria o RotaProvider ao trocar de usuário, sem herdar dados do anterior.
  return (
    <RotaProvider key={sessao ? `${sessao.demo}-${sessao.usuario.id}` : 'anonimo'}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Protected guard={!!sessao}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!sessao}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </RotaProvider>
  );
}

export default function RootLayout() {
  const [fontesCarregadas] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {fontesCarregadas ? (
        <SessaoProvider>
          <Navegacao />
        </SessaoProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: cores.fundo }} />
      )}
    </SafeAreaProvider>
  );
}
