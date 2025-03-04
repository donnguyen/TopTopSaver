import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View} from 'react-native-ui-lib';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  unsafe?: boolean;
}

export function Screen({children, style, unsafe = true}: ScreenProps) {
  const Container = unsafe ? View : SafeAreaView;

  return (
    <Container style={[styles.container, style]} edges={['top', 'bottom']}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
