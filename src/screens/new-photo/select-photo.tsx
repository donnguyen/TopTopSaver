import React, {useCallback, useRef, useState} from 'react';
import {StyleSheet, View, Image, Alert, Platform} from 'react-native';
import {Text, Button, Colors, Card} from 'react-native-ui-lib';
import {Screen} from '@app/components/screen';
import * as ImagePicker from 'expo-image-picker';
import {DocumentType} from '@app/utils/types/document';
import {getCountryFlag} from '@app/utils/document';
import {useNavigation} from '@react-navigation/native';
import {photoApi} from '@app/services/api/photo';
import {usePhotosDatabase} from '@app/services/db/photo';
import {useServices} from '@app/services';
import {useStores} from '@app/stores';
import {observer} from 'mobx-react';
// import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';

// const adUnitId = __DEV__
//   ? TestIds.ADAPTIVE_BANNER
//   : Platform.OS === 'ios'
//     ? process.env.EXPO_PUBLIC_IOS_ADS_BANNER_UNIT_ID ?? ''
//     : process.env.EXPO_PUBLIC_ANDROID_ADS_BANNER_UNIT_ID ?? '';

interface SelectPhotoProps {
  documentType: DocumentType;
  onBack: () => void;
}

interface PhotoPickerResult {
  uri: string;
  type: string;
  name: string;
}

const DocumentInfo = ({documentType}: {documentType: DocumentType}) => (
  <Card style={styles.documentCard}>
    <Text text65M>
      {getCountryFlag(documentType.country)} {documentType.country} - {documentType.document_type}
    </Text>
    <Text text80 grey30 marginT-4>
      {documentType.dimension} ({documentType.background} background)
    </Text>
  </Card>
);

const PhotoPreview = ({uri, onChooseDifferent}: {uri: string; onChooseDifferent: () => void}) => (
  <View style={styles.photoContainer}>
    <Image source={{uri}} style={styles.photo} />
    <Button
      label="Choose Different Photo"
      onPress={onChooseDifferent}
      marginT-16
      outlineColor={Colors.primary}
      outline
    />
  </View>
);

const PhotoButtons = ({
  onPickImage,
  onTakePhoto,
}: {
  onPickImage: () => void;
  onTakePhoto: () => void;
}) => (
  <View style={styles.buttonContainer}>
    <Button
      label="Choose from Library"
      onPress={onPickImage}
      backgroundColor={Colors.primary}
      marginB-16
    />
    <Button label="Take Photo" onPress={onTakePhoto} outlineColor={Colors.primary} outline />
  </View>
);

const Footer = ({
  onBack,
  onSubmit,
  isSubmitting,
  hasPhoto,
}: {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasPhoto: boolean;
}) => (
  <View style={styles.footer}>
    <Button
      label="Back"
      onPress={onBack}
      outlineColor={Colors.primary}
      outline
      marginR-16
      style={styles.backButton}
      disabled={isSubmitting}
    />
    <Button
      label={isSubmitting ? 'Uploading...' : 'Submit'}
      onPress={onSubmit}
      disabled={!hasPhoto || isSubmitting}
      backgroundColor={hasPhoto && !isSubmitting ? Colors.primary : Colors.grey40}
      style={styles.submitButton}
    />
  </View>
);

async function requestCameraPermission(): Promise<boolean> {
  const {granted} = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    Alert.alert('Permission Required', 'You need to enable camera permission to take a photo');
  }
  return granted;
}

async function createFormDataFile(uri: string): Promise<PhotoPickerResult> {
  const response = await fetch(uri);
  await response.blob(); // Ensure the file exists and is accessible
  return {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  };
}

export const SelectPhoto = observer(({documentType, onBack}: SelectPhotoProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const {navio} = useServices();
  const {newPhoto, photos: photosStore} = useStores();
  const photosDb = usePhotosDatabase();
  // const bannerRef = useRef<BannerAd>(null);

  // useForeground(() => {
  //   Platform.OS === 'ios' && bannerRef.current?.load();
  // });

  React.useLayoutEffect(() => {
    navigation.setOptions({title: 'Take Photo'});
  }, [navigation]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        mediaTypes: ['images'],
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!photo) return;

    try {
      setIsSubmitting(true);
      const formDataFile = await createFormDataFile(photo);
      const result = await photoApi.upload(formDataFile as any, documentType.slug);

      const photoWithDocInfo = {
        ...result,
        country: documentType.country,
        documentType: documentType.document_type,
        dimension: documentType.dimension,
      };

      await photosDb.savePhoto(photoWithDocInfo);
      photosStore.addPhoto(photoWithDocInfo);

      setPhoto(null);
      setIsSubmitting(false);
      newPhoto.reset();
      navio.tabs.jumpTo('PassportPhotosTab');
      navio.push('PhotoDetails', {photo: photoWithDocInfo, showInterstitialAds: true});
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload photo',
      );
      setIsSubmitting(false);
    }
  }, [photo, documentType, navio, photosDb, newPhoto, photosStore]);

  return (
    <Screen unsafe>
      <View style={styles.container}>
        <View style={styles.content}>
          <DocumentInfo documentType={documentType} />
          {photo ? (
            <PhotoPreview uri={photo} onChooseDifferent={pickImage} />
          ) : (
            <PhotoButtons onPickImage={pickImage} onTakePhoto={takePhoto} />
          )}
        </View>
        <Footer
          onBack={onBack}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hasPhoto={!!photo}
        />
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
  documentCard: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: Colors.grey70,
  },
  photoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: Colors.grey60,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.grey60,
    backgroundColor: Colors.white,
    justifyContent: 'flex-end',
  },
  backButton: {
    width: '30%',
  },
  submitButton: {
    width: '65%',
  },
});
