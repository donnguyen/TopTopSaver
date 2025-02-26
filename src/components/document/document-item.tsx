import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text, Card, Colors} from 'react-native-ui-lib';
import {DocumentType} from '@app/utils/types/document';
import {getCountryFlag} from '@app/utils/document';

interface DocumentItemProps {
  item: DocumentType;
  isSelected: boolean;
  onSelect: () => void;
}

export const DocumentItem = React.memo(({item, isSelected, onSelect}: DocumentItemProps) => {
  const flag = getCountryFlag(item.country);

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
      <Card
        style={[styles.card, isSelected && styles.selectedCard]}
        enableShadow={false}
        borderRadius={8}
        backgroundColor={isSelected ? Colors.primary : Colors.grey70}
        row
        centerV
        padding-12
        marginB-8
      >
        <View style={styles.cardContent}>
          <Text text65M numberOfLines={1} color={isSelected ? Colors.white : Colors.black}>
            {flag} {item.country} - {item.document_type}
          </Text>
          <Text text80 color={isSelected ? Colors.white : Colors.grey30} marginT-4>
            {item.dimension} ({item.background} background)
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.grey60,
  },
  selectedCard: {
    borderColor: Colors.primary,
  },
  cardContent: {
    flex: 1,
  },
});
