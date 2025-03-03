import React, {useRef, useState} from 'react';
import {View, Text, Card, Colors} from 'react-native-ui-lib';
import {Screen} from '@app/components/screen';
import {ScrollView, Linking, StyleSheet, useWindowDimensions, Platform} from 'react-native';
import {Image} from 'expo-image';
// import {BannerAd, BannerAdSize, TestIds, useForeground} from 'react-native-google-mobile-ads';

// const adUnitId = __DEV__
//   ? TestIds.ADAPTIVE_BANNER
//   : Platform.OS === 'ios'
//     ? process.env.EXPO_PUBLIC_IOS_ADS_BANNER_UNIT_ID ?? ''
//     : process.env.EXPO_PUBLIC_ANDROID_ADS_BANNER_UNIT_ID ?? '';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const PADDING = 32; // total horizontal padding (16 * 2 for container padding-s4)
const IMAGE_PADDING = 24; // total padding in Card (12 * 2 for padding-s3)

export function Guides() {
  // const bannerRef = useRef<BannerAd>(null);

  // useForeground(() => {
  //   Platform.OS === 'ios' && bannerRef.current?.load();
  // });
  const {width: windowWidth} = useWindowDimensions();
  const [imageSize, setImageSize] = useState({width: 0, height: 0});

  const handleLinkPress = () => {
    Linking.openURL('https://digitalpassportphoto.online/');
  };

  // Calculate container width considering padding
  const containerWidth = windowWidth - PADDING - IMAGE_PADDING;

  // Calculate height based on original image ratio once we have the dimensions
  const imageHeight = imageSize.width ? (containerWidth * imageSize.height) / imageSize.width : 200;

  return (
    <Screen unsafe>
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <View flex padding-s4>
          <Text text40BO marginB-s4>
            Photo Guidelines
          </Text>
          <Text text65 marginB-s4>
            Follow these guidelines to ensure your passport or ID photo meets official requirements.
          </Text>

          {/* Example Photos */}
          <Card marginB-s3>
            <View padding-s3>
              <Text text60BO marginB-s2 style={{color: Colors.primary}}>
                Example Photos
              </Text>
              <Image
                source={require('../../assets/images/passport_photo_guides.jpg')}
                style={{
                  width: containerWidth,
                  height: imageHeight,
                  borderRadius: 8,
                }}
                onLoad={e => {
                  const {width, height} = e.source;
                  setImageSize({width, height});
                }}
                placeholder={blurhash}
                contentFit="contain"
                transition={200}
              />
              <Text text70 marginT-s2 style={{color: Colors.grey30}}>
                Examples of acceptable and unacceptable passport photos
              </Text>
            </View>
          </Card>

          {/* Lighting Section */}
          <Card marginB-s3>
            <View padding-s3>
              <Text text60BO marginB-s2 style={{color: Colors.primary}}>
                I. Lighting
              </Text>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Even Lighting
                </Text>
                <Text text70>
                  • Face should be evenly illuminated{'\n'}• No shadows or glare{'\n'}• Natural
                  daylight is best (avoid direct sunlight){'\n'}• If using artificial light, ensure
                  it's soft and diffused{'\n'}• Avoid flash reflections on the face
                </Text>
              </View>
              <View>
                <Text text70BO marginB-s2>
                  No Shadows
                </Text>
                <Text text70>• Ensure no shadows on face, background, or shoulders</Text>
              </View>
            </View>
          </Card>

          {/* Pose and Expression Section */}
          <Card marginB-s3>
            <View padding-s3>
              <Text text60BO marginB-s2 style={{color: Colors.primary}}>
                II. Pose and Expression
              </Text>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Facing Forward
                </Text>
                <Text text70>
                  • Face camera directly{'\n'}• Head straight, not tilted{'\n'}• Eyes looking at
                  camera
                </Text>
              </View>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Neutral Expression
                </Text>
                <Text text70>
                  • Neutral facial expression required{'\n'}• No smiling, frowning, or grimacing
                  {'\n'}• Mouth should be closed
                </Text>
              </View>
              <View>
                <Text text70BO marginB-s2>
                  Eyes Open
                </Text>
                <Text text70>
                  • Eyes must be open and clearly visible{'\n'}• If wearing glasses, eyes must be
                  visible through lenses
                </Text>
              </View>
            </View>
          </Card>

          {/* Attire and Accessories Section */}
          <Card marginB-s3>
            <View padding-s3>
              <Text text60BO marginB-s2 style={{color: Colors.primary}}>
                III. Attire and Accessories
              </Text>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Normal Attire
                </Text>
                <Text text70>
                  • Wear typical daily clothing{'\n'}• Uniforms not allowed (except religious
                  attire)
                </Text>
              </View>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Religious Attire
                </Text>
                <Text text70>
                  • Religious head coverings permitted{'\n'}• Must not obscure face{'\n'}• Facial
                  features must be clearly visible
                </Text>
              </View>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Glasses
                </Text>
                <Text text70>
                  • Must be clear, not tinted{'\n'}• Frames should not obstruct eyes{'\n'}• No glare
                  on lenses{'\n'}• Best to remove if possible
                </Text>
              </View>
              <View marginB-s3>
                <Text text70BO marginB-s2>
                  Jewelry
                </Text>
                <Text text70>
                  • Minimal jewelry acceptable{'\n'}• Should not obscure face or cause reflections
                </Text>
              </View>
              <View>
                <Text text70BO marginB-s2>
                  Hair
                </Text>
                <Text text70>
                  • Pull back hair from face{'\n'}• Facial features must be clearly visible{'\n'}•
                  Hair should not cover eyes or eyebrows
                </Text>
              </View>
            </View>
          </Card>

          {/* External Link Section */}
          <View center marginT-24 marginB-16>
            <Text text70 grey30 marginB-8>
              Need to create a passport photo on website?
            </Text>
            <Text text70BO style={styles.link} onPress={handleLinkPress}>
              digitalpassportphoto.online
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
