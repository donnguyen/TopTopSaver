import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {View, Text, TextField, Button, Colors, Dialog} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {useVideosDatabase} from '@app/services/db';
import {APIError} from '@app/services/api/tiktok';
import {useVideosStore} from '@app/stores/videos.store';
import {requestTrackingPermissionsAsync} from 'expo-tracking-transparency';
import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_IOS_ADS_BANNER_UNIT_ID ?? ''
    : process.env.EXPO_PUBLIC_ANDROID_ADS_BANNER_UNIT_ID ?? '';

// Define TikTok URL patterns
const TIKTOK_URL_PATTERNS = [
  // vt.tiktok.com short links
  /https?:\/\/vt\.tiktok\.com\/[A-Za-z0-9]+\/?/,
  // vm.tiktok.com short links
  /https?:\/\/vm\.tiktok\.com\/[A-Za-z0-9]+\/?/,
  // Standard web URLs
  /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+/,
  // Mobile URLs
  /https?:\/\/m\.tiktok\.com\/v\/(\d+)\.html/,
  // Just the video ID (numeric only)
  /\b\d{19}\b/,
];

export const Download = () => {
  const {t, api} = useServices();
  const navigation = useNavigation();
  const {saveVideo} = useVideosStore();
  const videosDb = useVideosDatabase();
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingVideo, setExistingVideo] = useState<null | {id: string}>(null);
  const [showExistingDialog, setShowExistingDialog] = useState(false);
  const bannerRef = useRef<BannerAd>(null);

  useEffect(() => {
    (async () => {
      const {status} = await requestTrackingPermissionsAsync();
      if (status === 'granted') {
        console.log('Yay! I have user permission to track data');
      }
    })();
  }, []);

  useForeground(() => {
    Platform.OS === 'ios' && bannerRef.current?.load();
  });

  const handleDownload = async () => {
    // Reset error state
    setError('');
    setExistingVideo(null);

    // Basic URL validation
    if (!tiktokUrl) {
      setError('Please enter a TikTok URL');
      return;
    }

    // Check if the URL is a valid TikTok URL using the same patterns
    const isValidTikTokUrl = TIKTOK_URL_PATTERNS.some(pattern => pattern.test(tiktokUrl));

    if (!isValidTikTokUrl) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setIsLoading(true);

    try {
      // Call the TikTok API to download the video
      const response = await api.tiktok.downloadVideo(tiktokUrl);

      if (response.code !== 0 || !response.data) {
        setError('Unable to download this video. Please try a different link.');
        setIsLoading(false);
        return;
      }

      // Check if the video already exists in the database
      const existingVideo = await videosDb.getVideoById(response.data.id);

      if (existingVideo) {
        setExistingVideo(existingVideo);
        setShowExistingDialog(true);
        setIsLoading(false);
        return;
      }

      // Save the video metadata to the database and update the store
      // Wait for the saveVideo function to complete, which persists to the database
      await saveVideo(response.data);

      // Reset the form after successful download
      setTiktokUrl('');
      setIsLoading(false);

      // Navigate to Library after the video has been persisted to the database
      // The download process will continue in the background
      // @ts-ignore - Using string navigation with Navio
      navigation.navigate('LibraryTab');
    } catch (err) {
      console.error('Download error:', err);

      if (err instanceof APIError) {
        setError(`Download failed: ${err.message}`);
      } else {
        setError('Failed to download video. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleViewExistingVideo = () => {
    setShowExistingDialog(false);
    setTiktokUrl('');
    // @ts-ignore - Using string navigation with Navio
    navigation.navigate('LibraryTab');
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        // Try each pattern and use the first match found
        for (const pattern of TIKTOK_URL_PATTERNS) {
          const match = text.match(pattern);
          if (match && match[0]) {
            setTiktokUrl(match[0]);
            return;
          }
        }

        // If no patterns match, use the original text
        setTiktokUrl(text);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard', err);
    }
  };

  const renderTrailingAccessory = () => {
    if (tiktokUrl) {
      return (
        <View style={styles.pasteButtonWrapper}>
          <TouchableWithoutFeedback onPress={() => setTiktokUrl('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={Colors.grey40}
              style={styles.accessoryIcon}
            />
          </TouchableWithoutFeedback>
        </View>
      );
    }

    return (
      <View style={styles.pasteButtonWrapper}>
        <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
          <Text text80 color={Colors.primary}>
            Paste
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Screen>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text text70 marginB-15 style={styles.instructionText}>
              Paste a TikTok video URL below
            </Text>

            <View style={styles.inputWrapper}>
              <TextField
                placeholder="https://www.tiktok.com/@username/video/1234567890"
                value={tiktokUrl}
                onChangeText={setTiktokUrl}
                fieldStyle={styles.fieldStyle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholderTextColor={Colors.grey40}
                trailingAccessory={renderTrailingAccessory()}
                multiline={false}
                maxLength={200}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              label={isLoading ? 'Downloading...' : 'Download Video'}
              onPress={handleDownload}
              disabled={isLoading || !tiktokUrl}
              style={styles.button}
              backgroundColor={Colors.primary}
              disabledBackgroundColor={Colors.grey50}
              marginT-20
            />
            <Text text90 marginT-5 style={styles.subtitleText}>
              without watermark
            </Text>

            {/* User Guide */}
            <View style={styles.guideContainer}>
              <Text text80 style={styles.guideTitle}>
                How to use:
              </Text>
              <View style={styles.guideStep}>
                <Text text80 style={styles.guideNumber}>
                  1.
                </Text>
                <Text text80 style={styles.guideText}>
                  While watching a TikTok video, tap the Share button
                </Text>
              </View>
              <View style={styles.guideStep}>
                <Text text80 style={styles.guideNumber}>
                  2.
                </Text>
                <Text text80 style={styles.guideText}>
                  Tap "Copy link"
                </Text>
              </View>
              <View style={styles.guideStep}>
                <Text text80 style={styles.guideNumber}>
                  3.
                </Text>
                <Text text80 style={styles.guideText}>
                  Open this app and tap the Paste button in the input field above
                </Text>
              </View>
              <Image
                source={require('../../assets/images/copy-link.jpg')}
                style={styles.guideImage}
                resizeMode="contain"
              />
            </View>

            <Text text80 marginT-30 style={styles.disclaimer}>
              This app allows you to download TikTok videos without watermarks for personal use
              only. Please respect copyright and intellectual property rights.
            </Text>
          </View>
        </ScrollView>

        {/* Dialog for existing video */}
        <Dialog
          visible={showExistingDialog}
          onDismiss={() => setShowExistingDialog(false)}
          containerStyle={styles.dialogContainer}
        >
          <View padding-20>
            <Text text70 marginB-10 style={styles.dialogTitle}>
              Video Already in Library
            </Text>
            <Text text80 marginB-20>
              This video is already in your library. Would you like to view it?
            </Text>
            <View row spread>
              <Button
                label="Cancel"
                link
                color={Colors.grey30}
                onPress={() => {
                  setShowExistingDialog(false);
                  setTiktokUrl('');
                }}
              />
              <Button
                label="View in Library"
                backgroundColor={Colors.primary}
                onPress={handleViewExistingVideo}
              />
            </View>
          </View>
        </Dialog>
        <BannerAd ref={bannerRef} unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </Screen>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  instructionText: {
    fontWeight: '500',
    color: Colors.grey10,
  },
  inputWrapper: {
    width: '100%',
  },
  fieldStyle: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.grey60,
    paddingHorizontal: 16,
    height: 48,
  },
  accessoryIcon: {
    padding: 4,
  },
  pasteButtonWrapper: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pasteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: Colors.grey70,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
  },
  subtitleText: {
    color: Colors.grey30,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.red30,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  disclaimer: {
    textAlign: 'center',
    color: Colors.grey40,
    maxWidth: '90%',
  },
  guideContainer: {
    marginTop: 30,
    width: '100%',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.grey80,
    borderRadius: 12,
  },
  guideTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.grey10,
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  guideNumber: {
    fontWeight: '600',
    marginRight: 8,
    color: Colors.primary,
    width: 20,
  },
  guideText: {
    color: Colors.grey20,
    flex: 1,
  },
  guideImage: {
    width: '100%',
    height: 280,
    marginTop: 12,
    borderRadius: 8,
  },
  dialogContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '85%',
  },
  dialogTitle: {
    fontWeight: '600',
    color: Colors.grey10,
  },
});
