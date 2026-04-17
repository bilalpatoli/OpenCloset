import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
