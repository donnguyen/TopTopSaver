import React, {useState} from 'react';
import {StyleSheet, FlatList, Dimensions} from 'react-native';
import {View, Text, Card, Colors, Image, Button} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';

// Define the video item type
interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  size: string;
  duration: string;
}

// Mock data for downloaded videos
const MOCK_VIDEOS: VideoItem[] = [
  {
    id: '1',
    title: 'TikTok Video 1',
    thumbnail: 'https://via.placeholder.com/150',
    date: '2023-06-15',
    size: '12.5 MB',
    duration: '00:30',
  },
  {
    id: '2',
    title: 'TikTok Video 2',
    thumbnail: 'https://via.placeholder.com/150',
    date: '2023-06-14',
    size: '8.2 MB',
    duration: '00:15',
  },
  // Add more mock videos as needed
];

export const Library = () => {
  const {t} = useServices();
  const navigation = useNavigation();
  const [videos, setVideos] = useState<VideoItem[]>(MOCK_VIDEOS);

  const handlePlayVideo = (videoId: string) => {
    // Implement video playback functionality
    console.log(`Playing video with ID: ${videoId}`);
  };

  const handleDeleteVideo = (videoId: string) => {
    // Filter out the deleted video
    setVideos(videos.filter(video => video.id !== videoId));
  };

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

  const renderVideoItem = ({item}: {item: VideoItem}) => (
    <Card style={styles.videoCard} onPress={() => handlePlayVideo(item.id)}>
      <Image source={{uri: item.thumbnail}} style={styles.thumbnail} cover />
      <View padding-10>
        <Text text70 numberOfLines={1}>
          {item.title}
        </Text>
        <View row spread marginT-5>
          <Text text80 grey40>
            {item.date}
          </Text>
          <Text text80 grey40>
            {item.size}
          </Text>
        </View>
        <View row right marginT-10>
          <Button
            size="small"
            label="Play"
            backgroundColor={Colors.green30}
            marginR-10
            onPress={() => handlePlayVideo(item.id)}
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

  return (
    <Screen>
      <View style={styles.container}>
        <Text text50 marginB-20 marginT-20>
          Your Library
        </Text>

        {videos.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
};

const {width} = Dimensions.get('window');
const cardWidth = width * 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  videoCard: {
    width: cardWidth,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
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
