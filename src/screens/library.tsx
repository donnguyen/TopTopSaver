import React, {useCallback} from 'react';
import {StyleSheet, Dimensions} from 'react-native';
import {View, Text, Card, Colors, Image, Button} from 'react-native-ui-lib';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {FlashList} from '@shopify/flash-list';
import {VideoRecord} from '@app/utils/types/api';
import {formatFileSize, formatDuration} from '../utils/formatters';
import {useVideosStore} from '@app/stores/videos.store';
import {observer} from 'mobx-react-lite';

export const Library = observer(() => {
  const {t} = useServices();
  const navigation = useNavigation();
  const {videos, isLoading, loadVideos, deleteVideo} = useVideosStore();

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [loadVideos]),
  );

  const handlePlayVideo = (videoId: string) => {
    // Navigate to the VideoPlayer screen with the video ID
    // @ts-ignore - Using string navigation with Navio
    navigation.navigate('VideoPlayer', {videoId});
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo(videoId);
  };

  const handleRefresh = useCallback(() => {
    loadVideos();
  }, [loadVideos]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text text50 marginB-20>
        No Videos Yet
      </Text>
      <Text text70 marginB-30 center>
        Videos you download will appear here.
      </Text>
      <Button
        label="Go to Download"
        onPress={() => {
          // @ts-ignore - Using string navigation with Navio
          navigation.navigate('DownloadTab');
        }}
        backgroundColor={Colors.blue30}
        borderRadius={8}
      />
    </View>
  );

  const renderVideoItem = ({item}: {item: VideoRecord}) => (
    <Card
      style={styles.videoCard}
      onPress={() => item.status === 'downloaded' && handlePlayVideo(item.id)}
    >
      <Image source={{uri: item.cover}} style={styles.thumbnail} cover />
      <View padding-10>
        <Text text70 numberOfLines={1}>
          {item.title}
        </Text>
        <View row spread marginT-5>
          <Text text80 grey40>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text text80 grey40>
            {formatFileSize(item.hd_size)}
          </Text>
        </View>
        <View row spread marginT-5>
          <Text text80 grey40>
            {formatDuration(item.duration)}
          </Text>
          <Text text80 grey40 style={{color: getStatusColor(item.status)}}>
            {item.status}
          </Text>
        </View>
        <View row right marginT-10>
          <Button
            size="small"
            label="Play"
            backgroundColor={Colors.green30}
            marginR-10
            onPress={() => handlePlayVideo(item.id)}
            disabled={item.status !== 'downloaded'}
          />
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
              onRefresh={handleRefresh}
              refreshing={isLoading}
            />
          </View>
        )}
      </View>
    </Screen>
  );
});

const {width} = Dimensions.get('window');
const cardWidth = width * 0.9;

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
  },
  videoCard: {
    width: cardWidth,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  thumbnail: {
    height: 180,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
