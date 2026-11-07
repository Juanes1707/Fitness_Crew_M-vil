import { Tabs } from "expo-router";
import { Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";
export default function TabLayout() {
  const t = useTheme();
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: 64 + Math.max(0, fontScale - 1) * 40 + insets.bottom,
        },
        tabBarItemStyle: { minHeight: 48 },
        tabBarLabel: ({ children, color }) => (
          <Text style={{ color, fontSize: 12, textAlign: "center" }}>
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Gimnasios",
          tabBarIcon: ({ color }) => (
            <Text
              accessible={false}
              allowFontScaling={false}
              style={{ color, fontSize: 24 }}
            >
              ⌂
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Reportar",
          tabBarIcon: ({ color }) => (
            <Text
              accessible={false}
              allowFontScaling={false}
              style={{ color, fontSize: 24 }}
            >
              ＋
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Mi crew",
          tabBarIcon: ({ color }) => (
            <Text
              accessible={false}
              allowFontScaling={false}
              style={{ color, fontSize: 24 }}
            >
              ◎
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Text
              accessible={false}
              allowFontScaling={false}
              style={{ color, fontSize: 24 }}
            >
              ☺
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
