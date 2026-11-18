import { Tabs } from "expo-router";
import { Home, Map, BookOpen, User, Camera } from "lucide-react-native";
import { View } from "react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingTop: 5,
          overflow: "visible",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Bản đồ",
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
  name="camera"
  options={{
    title: "",
    tabBarLabel: () => null,
    tabBarIcon: () => (
      <View
        style={{
          width: 66,
          height: 66,
          borderRadius: 33,
          backgroundColor: "#207A35",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -18,
          borderWidth: 4,
          borderColor: "#FFFFFF",
          elevation: 5,
          shadowColor: "#14532D",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
        }}
      >
        <Camera size={31} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    ),
  }}
/>

<Tabs.Screen
  name="leaderboard"
  options={{
    href: null,
  }}
/>

      <Tabs.Screen
        name="education"
        options={{
          title: "Kiến thức",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
