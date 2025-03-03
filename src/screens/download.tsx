import React, {useState} from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback} from 'react-native';
import {View, Text, TextField, Button, Colors} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';
import {Ionicons} from '@expo/vector-icons';

export const Download = () => {
  const {t} = useServices();
  const navigation = useNavigation();
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

    if (!tiktokUrl.includes('tiktok.com')) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setIsLoading(true);

    try {
      // Here we would implement the actual download logic
      // For now, we'll just simulate a download with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Reset the form after successful download
      setTiktokUrl('');
      setIsLoading(false);

      // Navigate to Library after successful download
      // @ts-ignore - Using string navigation with Navio
      navigation.navigate('LibraryTab');
    } catch (err) {
      setError('Failed to download video. Please try again.');
      setIsLoading(false);
    }
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
              trailingAccessory={
                tiktokUrl ? (
                  <TouchableWithoutFeedback onPress={() => setTiktokUrl('')}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={Colors.grey40}
                      style={styles.clearIcon}
                    />
                  </TouchableWithoutFeedback>
                ) : undefined
              }
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
  clearIcon: {
    padding: 4,
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
