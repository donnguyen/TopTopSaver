import React, {useState, useEffect} from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback, TouchableOpacity} from 'react-native';
import {View, Text, TextField, Button, Colors} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {useVideosDatabase} from '@app/services/db';
import {APIError} from '@app/services/api/tiktok';
import {useVideosStore} from '@app/stores/videos.store';

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
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    // Reset error state
    setError('');

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

      // Save the video metadata to the database and update the store
      await saveVideo(response.data);

      // Reset the form after successful download
      setTiktokUrl('');
      setIsLoading(false);

      // Navigate to Library after successful download
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
        <TouchableWithoutFeedback onPress={() => setTiktokUrl('')}>
          <Ionicons
            name="close-circle"
            size={20}
            color={Colors.grey40}
            style={styles.accessoryIcon}
          />
        </TouchableWithoutFeedback>
      );
    }

    return (
      <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
        <Text text80 color={Colors.primary}>
          Paste
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Screen>
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
          <Text text80 marginT-5 style={styles.subtitleText}>
            without watermark
          </Text>

          <Text text80 marginT-30 style={styles.disclaimer}>
            This app allows you to download TikTok videos without watermarks for personal use only.
            Please respect copyright and intellectual property rights.
          </Text>
        </View>
      </Screen>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  pasteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: Colors.grey70,
    marginRight: 4,
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
});
