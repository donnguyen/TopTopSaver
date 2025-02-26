import React, {useRef, useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Dimensions, Alert, Platform, StatusBar} from 'react-native';
import {View, Text, Button, Colors} from 'react-native-ui-lib';
import * as MediaLibrary from 'expo-media-library';
import {Image} from 'expo-image';
import * as FileSystem from 'expo-file-system';
import {PhotoResponse} from '@app/utils/types/api';
import {useServices} from '@app/services';
import {NavioScreen} from 'rn-navio';
import {observer} from 'mobx-react';
import {useStores} from '@app/stores';
import {usePhotosDatabase} from '@app/services/db/photo';
import {getCountryFlag} from '@app/utils/document';
import {Screen} from '@app/components/screen';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_IOS_ADS_BANNER_UNIT_ID ?? ''
    : process.env.EXPO_PUBLIC_ANDROID_ADS_BANNER_UNIT_ID ?? '';

const adInterstitialUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_IOS_ADS_INTERSTITIAL_UNIT_ID ?? ''
    : process.env.EXPO_PUBLIC_ANDROID_ADS_INTERSTITIAL_UNIT_ID ?? '';

const interstitial = InterstitialAd.createForAdRequest(adInterstitialUnitId, {});

const {width} = Dimensions.get('window');
const IMAGE_WIDTH = width - 32; // 16px padding on each side
const IMAGE_HEIGHT = (IMAGE_WIDTH * 4) / 3; // 4:3 aspect ratio
const POLLING_INTERVAL = 10000; // 10 seconds

const STATUS_COLORS = {
  processing: Colors.yellow30,
  completed: Colors.green30,
  failed: Colors.red30,
} as const;

const STATUS_LABELS = {
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
} as const;

type Params = {
  photo: PhotoResponse;
  showInterstitialAds: boolean;
};

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export const PhotoDetails: NavioScreen = observer(() => {
  const {t, navio} = useServices();
  const params = navio.useParams<Params>();
  const {photos: photosStore} = useStores();
  const photosDb = usePhotosDatabase();
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();
  const imageRef = useRef<Image>(null);
  const bannerRef = useRef<BannerAd>(null);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
      if (Platform.OS === 'ios') {
        // Prevent the close button from being unreachable by hiding the status bar on iOS
        StatusBar.setHidden(true);
      }
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      if (Platform.OS === 'ios') {
        StatusBar.setHidden(false);
      }
    });

    // Start loading the interstitial straight away
    interstitial.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
    };
  }, []);

  useEffect(() => {
    if (loaded && params.showInterstitialAds) {
      interstitial.show();
    }
  }, [loaded, params.showInterstitialAds]);

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  // Get the photo from store instead of params to ensure reactivity
  const photo = photosStore.photos.find(p => p.id === params.photo.id) ?? params.photo;

  const checkPhotoStatus = useCallback(async () => {
    try {
      const response = await fetch(photo.url);
      const updatedPhoto: PhotoResponse = await response.json();

      if (updatedPhoto.status !== photo.status) {
        // Update store for UI
        photosStore.updatePhoto(photo.id, updatedPhoto);

        // Update database
        try {
          await photosDb.updatePhoto(photo.id, {
            status: updatedPhoto.status,
            updatedAt: updatedPhoto.updatedAt,
            resultHdUrl: updatedPhoto.resultHdUrl,
          });
        } catch (error) {
          console.error('Failed to update photo in database:', error);
          // Revert UI update if database update fails
          photosStore.updatePhoto(photo.id, photo);
        }
      }

      return updatedPhoto.status;
    } catch (error) {
      console.error('Failed to check photo status:', error);
      return photo.status;
    }
  }, [photo.url, photo.status, photo.id, photosStore, photosDb]);

  useEffect(() => {
    const startPolling = () => {
      if (photo.status === 'processing') {
        pollingTimeoutRef.current = setTimeout(async () => {
          const newStatus = await checkPhotoStatus();
          if (newStatus === 'processing') {
            startPolling(); // Continue polling if still processing
          }
        }, POLLING_INTERVAL);
      }
    };

    if (photo.status === 'processing') {
      startPolling();
    }

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [photo.status, checkPhotoStatus]);

  const handleSaveToGallery = async () => {
    try {
      // Request media library permissions
      const {status: mediaStatus} = await MediaLibrary.requestPermissionsAsync();

      if (mediaStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save photos to your gallery.',
          [{text: 'OK'}],
        );
        return;
      }

      // Get the cached file path
      let localUri = await Image.getCachePathAsync(photo.resultHdUrl);

      if (!localUri) {
        throw new Error('Image not found in cache');
      }

      // On Android, ensure the URI starts with file:///
      if (Platform.OS === 'android' && !localUri.startsWith('file:///')) {
        localUri = `file://${localUri}`;
      }

      const filename = `${photo.preset}-${photo.id}.jpg`;
      const tempUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.copyAsync({
        from: localUri,
        to: tempUri,
      });

      // Save the file to gallery
      const asset = await MediaLibrary.createAssetAsync(tempUri);

      // Clean up the temporary file
      await FileSystem.deleteAsync(tempUri, {idempotent: true});

      if (asset) {
        Alert.alert('Success', 'Photo saved to gallery successfully');
      }
    } catch (error) {
      console.error('Failed to save image:', error);
      Alert.alert('Save Failed', 'Failed to save the photo to your gallery. Please try again.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await photosDb.deletePhoto(photo.id);
              photosStore.deletePhoto(photo.id);
              navio.goBack();
            } catch (error) {
              console.error('Failed to delete photo:', error);
              // TODO: Show error toast
            }
          },
        },
      ],
    );
  };

  return (
    <Screen unsafe style={styles.container}>
      <ScrollView>
        <View padding-16>
          {photo.status === 'completed' ? (
            <>
              <Image
                ref={imageRef}
                source={photo.resultHdUrl}
                style={styles.mainImage}
                placeholder={blurhash}
                contentFit="contain"
                transition={200}
              />
              <Button label="Save to Gallery" onPress={handleSaveToGallery} marginV-16 />
            </>
          ) : photo.status === 'processing' ? (
            <View style={styles.processingContainer}>
              <Text text70 style={{color: STATUS_COLORS.processing}} marginB-8>
                Your photo is being processed
              </Text>
              <Text text80 grey30 center>
                This usually takes a few minutes. You'll be able to see and save the result once
                it's ready.
              </Text>
            </View>
          ) : null}

          <View style={styles.infoGrid}>
            <InfoItem
              label="Status"
              value={STATUS_LABELS[photo.status]}
              valueColor={STATUS_COLORS[photo.status]}
            />
            <InfoItem label="Country" value={`${getCountryFlag(photo.country)} ${photo.country}`} />
            <InfoItem label="Document" value={photo.documentType} />
            <InfoItem label="Dimensions" value={photo.dimension} />
            <InfoItem label="Created" value={new Date(photo.createdAt).toLocaleDateString()} />
          </View>

          <View marginT-16>
            <Text text70 marginB-8>
              Original Photo:
            </Text>
            <Image
              source={photo.originalUrl}
              style={styles.thumbnailImage}
              placeholder={blurhash}
              contentFit="contain"
              transition={200}
            />
          </View>

          <Text text70 style={styles.deleteLink} onPress={handleDelete}>
            Delete photo
          </Text>
        </View>
      </ScrollView>
      <BannerAd ref={bannerRef} unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </Screen>
  );
});

PhotoDetails.options = {
  title: 'Photo Details',
};

function InfoItem({label, value, valueColor}: {label: string; value: string; valueColor?: string}) {
  return (
    <View style={styles.infoItem}>
      <Text text80 grey30>
        {label}
      </Text>
      <Text text70 marginT-4 style={valueColor ? {color: valueColor} : undefined}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  mainImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.grey70,
  },
  thumbnailImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 0.75,
    backgroundColor: Colors.grey70,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  infoItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 16,
  },
  deleteLink: {
    color: Colors.red30,
    marginTop: 24,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  processingContainer: {
    backgroundColor: Colors.yellow70,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
});
