import React, {useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, Colors} from 'react-native-ui-lib';
import {Image} from 'expo-image';
import {useServices} from '@app/services';

interface EmptyStateProps {
  onNewPhotoPress?: () => void;
}

export const EmptyState = ({onNewPhotoPress}: EmptyStateProps) => {
  const {navio} = useServices();

  const handleNewPhotoPress = useCallback(() => {
    if (onNewPhotoPress) {
      onNewPhotoPress();
    } else {
      navio.tabs.jumpTo('NewPhotoTab');
    }
  }, [navio.tabs, onNewPhotoPress]);

  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../../../assets/images/empty-photos.png')}
        style={styles.emptyStateImage}
        contentFit="contain"
        transition={300}
      />
      <Text text65M center marginT-24 marginB-8>
        No Photos Yet
      </Text>
      <Text text80 grey30 center>
        You can use New Photo tab or{' '}
        <Text text80 primary onPress={handleNewPhotoPress} style={styles.linkText} underline>
          click here
        </Text>{' '}
        to take your first passport photo
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateImage: {
    width: 240,
    height: 240,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
