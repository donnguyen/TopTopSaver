import React, {useCallback, useMemo, useRef} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {Text, TextField, Colors, Button} from 'react-native-ui-lib';
import {useServices} from '@app/services';
import {useStores} from '@app/stores';
import {Screen} from '@app/components/screen';
import {FlashList} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import {observer} from 'mobx-react';

// Import the document types data
import allDocumentTypes from '../../assets/all-type-documents.json';
import {DocumentType} from '@app/utils/types/document';
import {DocumentItem} from '@app/components/document/document-item';
import {sortDocuments} from '@app/utils/document';
import {SelectPhoto} from './new-photo/select-photo';
// import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';

// Ensure the imported data is typed correctly and sorted
const documentTypes: DocumentType[] = sortDocuments(allDocumentTypes);
// const adUnitId = __DEV__
//   ? TestIds.ADAPTIVE_BANNER
//   : Platform.OS === 'ios'
//     ? process.env.EXPO_PUBLIC_IOS_ADS_BANNER_UNIT_ID ?? ''
//     : process.env.EXPO_PUBLIC_ANDROID_ADS_BANNER_UNIT_ID ?? '';

const SearchField = observer(
  ({value, onChange}: {value: string; onChange: (text: string) => void}) => (
    <TextField
      placeholder="Search for the country you need"
      onChangeText={onChange}
      value={value}
      style={styles.searchInput}
      enableErrors={false}
      fieldStyle={styles.searchField}
      migrate
      placeholderTextColor={Colors.grey30}
    />
  ),
);

const EmptyState = () => (
  <Screen>
    <View style={styles.container}>
      <Text text60>No document types available</Text>
    </View>
  </Screen>
);

const DocumentList = observer(
  ({
    documents,
    selectedId,
    onSelect,
  }: {
    documents: DocumentType[];
    selectedId: number | null;
    onSelect: (document: DocumentType) => void;
  }) => {
    const renderItem = useCallback(
      ({item}: {item: DocumentType}) => (
        <DocumentItem
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={() => onSelect(item)}
        />
      ),
      [selectedId, onSelect],
    );

    return (
      <FlashList
        data={documents}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        estimatedItemSize={88}
        contentContainerStyle={styles.listContent}
        extraData={selectedId}
      />
    );
  },
);

const Footer = observer(({hasSelection, onNext}: {hasSelection: boolean; onNext: () => void}) => (
  <View style={styles.footer}>
    <Button
      label="Next"
      disabled={!hasSelection}
      onPress={onNext}
      size={Button.sizes.large}
      backgroundColor={hasSelection ? Colors.primary : Colors.grey40}
      style={styles.nextButton}
    />
  </View>
));

export const NewPhoto = observer(() => {
  const {t} = useServices();
  const {newPhoto} = useStores();
  const navigation = useNavigation();
  // const bannerRef = useRef<BannerAd>(null);

  // useForeground(() => {
  //   Platform.OS === 'ios' && bannerRef.current?.load();
  // });

  // Set navigation options
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: newPhoto.currentStep === 'select-document' ? 'Select Document Type' : 'Take Photo',
    });
  }, [navigation, newPhoto.currentStep]);

  const filteredDocuments = useMemo(() => {
    if (!newPhoto.searchQuery.trim()) return documentTypes;

    const query = newPhoto.searchQuery.toLowerCase().trim();
    const filtered = documentTypes.filter(
      doc =>
        doc.country.toLowerCase().includes(query) ||
        doc.document_type.toLowerCase().includes(query),
    );

    return filtered;
  }, [newPhoto.searchQuery]);

  const handleSelectDocument = useCallback(
    (document: DocumentType) => {
      newPhoto.setSelectedDocument(newPhoto.selectedDocument?.id === document.id ? null : document);
    },
    [newPhoto],
  );

  const handleNext = useCallback(() => {
    if (newPhoto.selectedDocument) {
      newPhoto.goToSelectPhoto();
    }
  }, [newPhoto]);

  if (!documentTypes?.length) {
    return <EmptyState />;
  }

  if (newPhoto.currentStep === 'select-photo' && newPhoto.selectedDocument) {
    return (
      <SelectPhoto documentType={newPhoto.selectedDocument} onBack={newPhoto.goToSelectDocument} />
    );
  }

  return (
    <Screen unsafe>
      <View style={styles.container}>
        <View style={styles.content}>
          <SearchField value={newPhoto.searchQuery} onChange={newPhoto.setSearchQuery} />
          <DocumentList
            documents={filteredDocuments}
            selectedId={newPhoto.selectedDocument?.id ?? null}
            onSelect={handleSelectDocument}
          />
        </View>
        <Footer hasSelection={!!newPhoto.selectedDocument} onNext={handleNext} />
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingVertical: 16,
  },
  searchInput: {},
  searchField: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.grey60,
    paddingHorizontal: 16,
    height: 48,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.grey60,
    backgroundColor: Colors.white,
  },
  nextButton: {
    height: 48,
  },
});
