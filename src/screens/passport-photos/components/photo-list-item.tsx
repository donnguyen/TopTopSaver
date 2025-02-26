import React, {useMemo, useEffect, useCallback, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, Colors, Card, Button} from 'react-native-ui-lib';
import {Image} from 'expo-image';
import {PhotoResponse} from '@app/utils/types/api';
import {getCountryFlag} from '@app/utils/document';
import {format} from 'date-fns';
import {useStores} from '@app/stores';
import {usePhotosDatabase} from '@app/services/db/photo';

const POLLING_INTERVAL = 10000; // 10 seconds

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

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

interface PhotoListItemProps {
  photo: PhotoResponse;
  onPress?: () => void;
}

export const PhotoListItem = React.memo(({photo, onPress}: PhotoListItemProps) => {
  const {photos} = useStores();
  const db = usePhotosDatabase();
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();

  const formattedDate = useMemo(
    () => format(new Date(photo.createdAt), 'MMM d, yyyy'),
    [photo.createdAt],
  );

  const countryWithFlag = useMemo(
    () => `${getCountryFlag(photo.country)} ${photo.country}`,
    [photo.country],
  );

  const imageSource = useMemo(() => {
    if (photo.status === 'completed' && photo.resultHdUrl) {
      return photo.resultHdUrl;
    }
    return photo.originalUrl;
  }, [photo.status, photo.resultHdUrl, photo.originalUrl]);

  const checkPhotoStatus = useCallback(async () => {
    try {
      const response = await fetch(photo.url);
      const updatedPhoto: PhotoResponse = await response.json();

      if (updatedPhoto.status !== photo.status) {
        // Update store for UI
        photos.updatePhoto(photo.id, updatedPhoto);

        // Update database
        try {
          await db.updatePhoto(photo.id, {
            status: updatedPhoto.status,
            updatedAt: updatedPhoto.updatedAt,
            resultHdUrl: updatedPhoto.resultHdUrl,
          });
        } catch (error) {
          console.error('Failed to update photo in database:', error);
          // Revert UI update if database update fails
          photos.updatePhoto(photo.id, photo);
        }
      }

      return updatedPhoto.status;
    } catch (error) {
      console.error('Failed to check photo status:', error);
      return photo.status;
    }
  }, [photo, photos, db]);

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

  return (
    <Card style={styles.photoCard} onPress={onPress}>
      <View style={styles.photoContent}>
        <Image
          source={imageSource}
          style={styles.photoThumbnail}
          placeholder={blurhash}
          contentFit="cover"
          transition={200}
          recyclingKey={photo.id.toString() + photo.status}
        />
        <View style={styles.photoInfo}>
          <View style={styles.photoHeader}>
            <Text text65M numberOfLines={1}>
              {countryWithFlag}
            </Text>
            <Text text90 grey30>
              {formattedDate}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, {backgroundColor: STATUS_COLORS[photo.status]}]} />
            <Text text80 style={{color: STATUS_COLORS[photo.status]}}>
              {STATUS_LABELS[photo.status]}
            </Text>
          </View>
          <Text text80 grey40>
            {photo.documentType}
          </Text>
          <Text text80 grey40>
            {photo.dimension}
          </Text>
        </View>
      </View>
    </Card>
  );
});

PhotoListItem.displayName = 'PhotoListItem';

const styles = StyleSheet.create({
  photoCard: {
    marginBottom: 16,
    padding: 12,
  },
  photoContent: {
    flexDirection: 'row',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.grey60,
  },
  photoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
