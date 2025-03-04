import React, {useCallback, useEffect} from 'react';
import {StyleSheet, Dimensions} from 'react-native';
import {View, Text, Card, Colors, Button} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {FlashList} from '@shopify/flash-list';
import {VideoRecord} from '@app/utils/types/api';
import {formatFileSize, formatDuration} from '../utils/formatters';
import {useVideosStore} from '@app/stores/videos.store';
import {observer} from 'mobx-react-lite';
import {Image} from 'expo-image';

// Define a blurhash for placeholder images
const PLACEHOLDER_BLURHASH =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export const Library = observer(() => {
  const {t} = useServices();
  const navigation = useNavigation();
  const {videos, isLoading, loadVideos, deleteVideo} = useVideosStore();

  // Load videos only once when component mounts
  useEffect(() => {
    loadVideos();
  }, []); // Empty dependency array means this runs once on mount

  const handlePlayVideo = (videoId: string) => {
    // Navigate to the VideoPlayer screen with the video ID
    // @ts-ignore - Using string navigation with Navio
    navigation.navigate('VideoPlayer', {videoId});
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId);
  };

  const renderEmptyState = () => (
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
  );

  const renderVideoItem = ({item}: {item: VideoRecord}) => {
    // Create the full thumbnail URL by prefixing with TikWm host
    const thumbnailUrl = item.cover.startsWith('http')
      ? item.cover
      : `https://www.tikwm.com${item.cover}`;

    return (
      <Card
        style={styles.videoCard}
        onPress={() => item.status === 'downloaded' && handlePlayVideo(item.id)}
      >
        <Image
          source={{uri: thumbnailUrl}}
          style={styles.thumbnail}
          contentFit="cover"
          placeholder={PLACEHOLDER_BLURHASH}
          transition={300}
          cachePolicy="memory-disk"
        />
        <View padding-10>
          <Text text70 numberOfLines={1}>
            {item.title}
          </Text>
          <View row spread marginT-5>
            <Text text80 grey40>
              {formatDuration(item.duration)}
            </Text>
            <Text text80 grey40 style={{color: getStatusColor(item.status)}}>
              {item.status}
            </Text>
          </View>
          <View row spread marginT-5>
            <Text text80 grey40>
              {formatFileSize(item.size)}
            </Text>
            <Button
              size="small"
              label="Delete"
              backgroundColor={Colors.red30}
              onPress={() => handleDeleteVideo(item.id)}
            />
          </View>
        </View>
      </Card>
    );
  };

  const getStatusColor = (status: VideoRecord['status']) => {
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
  },
  thumbnail: {
    height: (cardWidth * 16) / 9, // 9:16 aspect ratio
    width: '100%',
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
});
