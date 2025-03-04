import React, {useEffect, useState, useCallback} from 'react';
import {StyleSheet, ActivityIndicator} from 'react-native';
import {View, Text, Colors, Button} from 'react-native-ui-lib';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {VideoRecord} from '@app/utils/types/api';
import {useVideoPlayer, VideoView} from 'expo-video';
import {useEvent} from 'expo';
import {Ionicons} from '@expo/vector-icons';
import {useVideosStore} from '@app/stores/videos.store';
import {observer} from 'mobx-react-lite';

export const VideoPlayer = observer(() => {
  const {t} = useServices();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {videos} = useVideosStore();
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the video ID from the route params
  const videoId = route.params?.videoId;

  const findVideo = useCallback(
    (id: string) => {
      return videos.find(v => v.id === id) || null;
    },
    [videos],
  );

  useEffect(() => {
    if (videoId) {
      const foundVideo = findVideo(videoId);
      if (foundVideo) {
        setVideo(foundVideo);
      } else {
        setError('Video not found');
      }
      setLoading(false);
    } else {
      setError('No video ID provided');
      setLoading(false);
    }
  }, [videoId, findVideo]);

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text text70 marginT-10>
            Loading video...
          </Text>
        </View>
      </Screen>
    );
  }

  if (error || !video) {
    return (
      <Screen>
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.red30} />
          <Text text70 marginT-10 style={{color: Colors.red30}}>
            {error || 'Video not available'}
          </Text>
          <Button label="Go Back" marginT-20 onPress={handleBack} backgroundColor={Colors.blue30} />
        </View>
      </Screen>
    );
  }

  // Initialize the video player with the video URL
  const player = useVideoPlayer(video.hdplay, player => {
    player.play();
  });

  // Get the playing state from the player
  const {isPlaying} = useEvent(player, 'playingChange', {isPlaying: player.playing});

  return (
    <Screen>
      <View style={styles.header}>
        <Button
          iconSource={() => <Ionicons name="arrow-back" size={24} color={Colors.white} />}
          link
          onPress={handleBack}
        />
        <Text text60 white marginL-10 style={{flex: 1}} numberOfLines={1}>
          {video.title}
        </Text>
      </View>

      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          contentFit="contain"
          nativeControls
        />
      </View>

      <View style={styles.infoContainer}>
        <Text text60 marginB-10>
          {video.title}
        </Text>

        <View row marginB-10>
          <View style={styles.authorContainer}>
            <Text text80 grey40>
              Author: {video.author_nickname} (@{video.author_unique_id})
            </Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <Button
            label={isPlaying ? 'Pause' : 'Play'}
            backgroundColor={isPlaying ? Colors.orange30 : Colors.green30}
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else {
                player.play();
              }
            }}
          />
        </View>
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.primary,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16, // TikTok videos are typically in portrait mode
    backgroundColor: Colors.black,
  },
  video: {
    flex: 1,
  },
  infoContainer: {
    padding: 15,
  },
  authorContainer: {
    flex: 1,
  },
  controlsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
