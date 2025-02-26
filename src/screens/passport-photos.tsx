import React, {useCallback, useMemo, useEffect, useRef} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {Screen} from '@app/components/screen';
import {PhotoResponse} from '@app/utils/types/api';
import {PhotoListItem} from '@app/screens/passport-photos/components/photo-list-item';
import {EmptyState} from '@app/screens/passport-photos/components/empty-state';
import {useStores} from '@app/stores';
import {usePhotosDatabase} from '@app/services/db/photo';
import {observer} from 'mobx-react';
import {useServices} from '@app/services';
import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_IOS_ADS_BANNER_UNIT_ID ?? ''
    : process.env.EXPO_PUBLIC_ANDROID_ADS_BANNER_UNIT_ID ?? '';

export const PassportPhotos = observer(() => {
  const {photos: photosStore} = useStores();
  const photosDb = usePhotosDatabase();
  const navigation = useNavigation();
  const {navio} = useServices();
  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Passport Photos',
    });
  }, [navigation]);

  const loadPhotos = useCallback(async () => {
    if (photosStore.isLoading) return;

    try {
      photosStore.setIsLoading(true);
      const result = await photosDb.getPhotos();
      photosStore.setPhotos(result);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      photosStore.setIsLoading(false);
    }
  }, []); // Remove dependencies since they are stable references

  useEffect(() => {
    loadPhotos();
  }, []); // Only run on mount

  const handlePhotoPress = useCallback(
    (photo: PhotoResponse) => {
      navio.push('PhotoDetails', {photo});
    },
    [navio],
  );

  const renderItem = useCallback(
    ({item}: {item: PhotoResponse}) => (
      <PhotoListItem key={item.id} photo={item} onPress={() => handlePhotoPress(item)} />
    ),
    [handlePhotoPress],
  );

  const keyExtractor = useCallback((item: PhotoResponse) => item.id.toString(), []);

  const listProps = useMemo(
    () => ({
      data: photosStore.photos,
      renderItem,
      keyExtractor,
      estimatedItemSize: 120,
      contentContainerStyle: styles.listContent,
      refreshing: photosStore.isLoading,
      onRefresh: loadPhotos,
    }),
    [photosStore.photos, photosStore.isLoading, renderItem, keyExtractor, loadPhotos],
  );

  if (photosStore.photos.length === 0) {
    return (
      <Screen unsafe>
        <EmptyState />
        <BannerAd ref={bannerRef} unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </Screen>
    );
  }

  return (
    <Screen unsafe>
      <FlashList {...listProps} />
      <BannerAd ref={bannerRef} unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </Screen>
  );
});

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});
