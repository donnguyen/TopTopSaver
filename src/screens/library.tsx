import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import {View, Text, Colors} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {FlashList} from '@shopify/flash-list';
import {VideoRecord} from '@app/utils/types/api';
import {formatFileSize, formatDuration} from '../utils/formatters';
import {useVideosStore} from '@app/stores/videos.store';
import {observer} from 'mobx-react-lite';
import {Image} from 'expo-image';
import {Ionicons} from '@expo/vector-icons';
import CircularProgressIndicator from 'react-native-circular-progress-indicator';

// Define a blurhash for placeholder images
const PLACEHOLDER_BLURHASH =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

// Create an observer component for rendering video items
const VideoItem = observer(
  ({
    item,
    onPlay,
    onRetry,
  }: {
    item: VideoRecord;
    onPlay: (id: string) => void;
    onRetry?: (id: string) => void;
  }) => {
    // Create the full thumbnail URL by prefixing with TikWm host
    const thumbnailUrl = item.cover.startsWith('http')
      ? item.cover
      : `https://www.tikwm.com${item.cover}`;

    const isDownloading = item.status === 'downloading';
    const isDownloaded = item.status === 'downloaded';
    const isFailed = item.status === 'failed';

    // Use the download_percentage from the store
    const downloadPercent = item.download_percentage ?? 0;

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => isDownloaded && onPlay(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{uri: thumbnailUrl}}
            style={styles.thumbnail}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={300}
            cachePolicy="memory-disk"
          />

          {/* Overlay for better visibility of progress indicator */}
          {isDownloading && (
            <View style={styles.thumbnailOverlay}>
              <CircularProgressIndicator
                value={downloadPercent}
                radius={30}
                activeStrokeWidth={5}
                inActiveStrokeWidth={5}
                activeStrokeColor={Colors.white}
                inActiveStrokeColor={'rgba(255, 255, 255, 0.3)'}
                progressValueColor={Colors.white}
                valueSuffix={'%'}
                progressValueStyle={{fontWeight: 'bold', fontSize: 14}}
                progressFormatter={value => {
                  'worklet';
                  return Math.round(value).toString();
                }}
                duration={250}
              />
            </View>
          )}

          {/* Play icon for downloaded videos */}
          {isDownloaded && (
            <View style={styles.playIconContainer}>
              <Ionicons name="play-circle" size={60} color={Colors.white} />
            </View>
          )}

          {/* Retry button for failed downloads */}
          {isFailed && onRetry && (
            <View style={styles.thumbnailOverlay}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => onRetry(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-circle" size={60} color={Colors.white} />
                <Text style={styles.retryText}>Retry Download</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View padding-10>
          <Text text70 numberOfLines={1}>
            {item.title}
          </Text>
          <View row spread marginT-5>
            <Text text80 grey40>
              {formatDuration(item.duration)}
            </Text>
            <Text text80 grey40>
              {formatFileSize(item.size)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

export const Library = observer(() => {
  const {t} = useServices();
  const navigation = useNavigation();
  const {videos, isLoading, loadVideos, deleteVideo, startDownload} = useVideosStore();
  const [initialLoading, setInitialLoading] = useState(true);

  // Load videos only once when component mounts
  useEffect(() => {
    const loadData = async () => {
      await loadVideos();
      setInitialLoading(false);
    };
    loadData();
  }, []); // Empty dependency array means this runs once on mount

  const handlePlayVideo = useCallback(
    (videoId: string) => {
      // Navigate to the VideoPlayer screen with the video ID
      // @ts-ignore - Using string navigation with Navio
      navigation.navigate('VideoPlayer', {videoId});
    },
    [navigation],
  );

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      await deleteVideo(videoId);
    },
    [deleteVideo],
  );

  const handleDownloadVideo = useCallback(
    async (videoId: string) => {
      await startDownload(videoId);
    },
    [startDownload],
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Image
          source={require('../../assets/images/empty-videos.png')}
          style={styles.emptyImage}
          contentFit="contain"
        />
        <Text text50 marginB-20>
          No Videos Yet
        </Text>
        <Text text70 marginB-30 center>
          Videos you download will appear here.
        </Text>
        <Text
          text70
          color={Colors.primary}
          style={styles.downloadLink}
          onPress={() => {
            // @ts-ignore - Using string navigation with Navio
            navigation.navigate('DownloadTab');
          }}
        >
          Go to Download
        </Text>
      </View>
    ),
    [navigation],
  );

  const renderVideoItem = useCallback(
    ({item}: {item: VideoRecord}) => {
      return <VideoItem item={item} onPlay={handlePlayVideo} onRetry={handleDownloadVideo} />;
    },
    [handlePlayVideo, handleDownloadVideo],
  );

  // Show loading indicator when initially loading
  if (initialLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text text60 marginB-20>
            Loading Videos...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {videos.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <View style={styles.listContainer}>
            <FlashList
              data={videos}
              renderItem={renderVideoItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              estimatedItemSize={250}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              ItemSeparatorComponent={() => <View style={{width: columnGap}} />}
            />
          </View>
        )}
      </View>
    </Screen>
  );
});

export const getStatusColor = (status: VideoRecord['status']) => {
  switch (status) {
    case 'downloaded':
      return Colors.green30;
    case 'downloading':
      return Colors.yellow30;
    case 'failed':
      return Colors.red30;
    default:
      return Colors.grey40;
  }
};

const {width} = Dimensions.get('window');
const columnGap = 10; // Gap between columns
const cardWidth = (width - 30 - columnGap) / 2; // Account for padding and gap between columns

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 5,
  },
  videoCard: {
    width: cardWidth,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: Colors.grey40,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    height: (cardWidth * 16) / 9, // 9:16 aspect ratio
    width: '100%',
  },
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  downloadLink: {
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
});
