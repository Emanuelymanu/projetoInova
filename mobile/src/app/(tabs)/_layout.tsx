import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { cores, fontes } from '@/theme';

type NomeIcone = keyof typeof Ionicons.glyphMap;

function IconeAba({ nome, color }: { nome: NomeIcone; color: ColorValue }) {
  // As cores da barra são definidas abaixo como strings.
  return <Ionicons name={nome} size={23} color={color as string} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primariaSuave,
        tabBarInactiveTintColor: cores.textoFraco,
        tabBarStyle: {
          backgroundColor: cores.fundoTopo,
          borderTopColor: cores.borda,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fontes.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => <IconeAba nome={focused ? 'home' : 'home-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rota"
        options={{
          title: 'Rota',
          tabBarIcon: ({ color, focused }) => <IconeAba nome={focused ? 'location' : 'location-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, focused }) => <IconeAba nome={focused ? 'clipboard' : 'clipboard-outline'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <IconeAba nome={focused ? 'person' : 'person-outline'} color={color} />,
        }}
      />
    </Tabs>
  );
}
