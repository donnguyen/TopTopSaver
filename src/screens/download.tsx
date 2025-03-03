import React, {useState} from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback} from 'react-native';
import {View, Text, TextField, Button, Colors} from 'react-native-ui-lib';
import {useNavigation} from '@react-navigation/native';
import {Screen} from '@app/components/screen';
import {useServices} from '@app/services';

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
          <Text text50 marginB-20>
            Download TikTok Videos
          </Text>

          <Text text70 marginB-10>
            Paste a TikTok video URL below
          </Text>

          <TextField
            placeholder="https://www.tiktok.com/@username/video/1234567890"
            value={tiktokUrl}
            onChangeText={setTiktokUrl}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            label={isLoading ? 'Downloading...' : 'Download Video'}
            onPress={handleDownload}
            disabled={isLoading || !tiktokUrl}
            style={styles.button}
            backgroundColor={Colors.blue30}
            disabledBackgroundColor={Colors.blue60}
            marginT-20
          />

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
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.grey50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.red30,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  disclaimer: {
    textAlign: 'center',
    color: Colors.grey40,
    maxWidth: '90%',
  },
});
