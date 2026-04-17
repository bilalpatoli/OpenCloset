import React from 'react';
import { View, Text } from 'react-native';

export default function ItemTag({ label }: { label: string }) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}
