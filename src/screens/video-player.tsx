import React, {useEffect, useState, useCallback, useRef} from 'react';
import {StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import {View, Text, Colors, Button} from 'react-native-ui-lib';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {VideoRecord} from '@app/utils/types/api';
import {useVideoPlayer, VideoView, VideoPlayer as ExpoVideoPlayer} from 'expo-video';
import {useEvent} from 'expo';
import {Ionicons} from '@expo/vector-icons';
import {useVideosStore} from '@app/stores/videos.store';
import {observer} from 'mobx-react-lite';

export const VideoPlayer = observer(() => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {videos} = useVideosStore();
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get the video ID from the route params
  const videoId = route.params?.videoId;

  // Initialize player with a ref to avoid conditional hook calls
  const playerRef = useRef<ExpoVideoPlayer | null>(null);

  // Initialize the video player with the video URI (using empty string as fallback)
  const player = useVideoPlayer(videoUri || '', player => {
    if (videoUri && !loading && !error) {
      playerRef.current = player;
      player.play();
    }
  });

  // Get the playing state from the player
  const {isPlaying} = useEvent(player, 'playingChange', {isPlaying: player.playing});

  // Auto-hide overlay after 3 seconds
  useEffect(() => {
    // Function to start the timer
    const startOverlayTimer = () => {
      // Clear any existing timer
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }

      // Set a new timer to hide the overlay after 3 seconds
      overlayTimerRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
    };

    // Start timer when overlay is shown
    if (showOverlay) {
      startOverlayTimer();
    }

    // Clean up timer on unmount
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, [showOverlay]);

  const findVideo = useCallback(
    (id: string) => {
      return videos.find(v => v.id === id) || null;
    },
    [videos],
  );

  useEffect(() => {
    const loadVideo = async () => {
      if (videoId) {
        const foundVideo = findVideo(videoId);
        if (foundVideo) {
          setVideo(foundVideo);

          // Check if the video has a local URI
          if (foundVideo.local_uri) {
            // Use the stored local URI
            setVideoUri(foundVideo.local_uri);
          } else {
            // If no local URI, use the streaming URL
            setVideoUri(foundVideo.hdplay);
          }
        } else {
          setError('Video not found');
        }
        setLoading(false);
      } else {
        setError('No video ID provided');
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, findVideo]);

  // Effect to handle player when videoUri changes
  useEffect(() => {
    if (videoUri && playerRef.current && !loading && !error) {
      playerRef.current.play();
    }
  }, [videoUri, loading, error]);

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

  if (error || !video || !videoUri) {
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

  return (
    <Screen>
      <View style={styles.fullScreenContainer}>
        <View style={styles.videoContainer}>
          <TouchableOpacity
            style={styles.touchableVideo}
            activeOpacity={1}
            onPress={() => setShowOverlay(true)}
          >
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              contentFit="contain"
              nativeControls
            />
          </TouchableOpacity>

          {/* Back button overlay - always visible */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Title overlay at bottom left */}
          {showOverlay && (
            <View style={styles.titleOverlay}>
              <Text text80 white numberOfLines={2}>
                {video.title}
              </Text>
              <Text text90 white marginT-5>
                {video.author_nickname} (@{video.author_unique_id})
              </Text>
            </View>
          )}
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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.black,
  },
  touchableVideo: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    zIndex: 10,
  },
});
