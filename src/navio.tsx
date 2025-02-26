import {Navio} from 'rn-navio';

import {PassportPhotos} from '@app/screens/passport-photos';
import {NewPhoto} from '@app/screens/new-photo';
import {Guides} from '@app/screens/guides';
import {PhotoDetails} from '@app/screens/passport-photos/photo-details';

import {useAppearance} from '@app/utils/hooks';
import {
  screenDefaultOptions,
  tabScreenDefaultOptions,
  getTabBarIcon,
  drawerScreenDefaultOptions,
} from '@app/utils/designSystem';
import {services} from '@app/services';

// NAVIO
export const navio = Navio.build({
  screens: {
    PassportPhotos,
    NewPhoto,
    Guides,
    PhotoDetails,
  },
  stacks: {
    PassportPhotosStack: ['PassportPhotos', 'PhotoDetails'],
    NewPhotoStack: ['NewPhoto'],
    GuidesStack: ['Guides'],
  },
  tabs: {
    AppTabs: {
      layout: {
        PassportPhotosTab: {
          stack: 'PassportPhotosStack',
          options: () => ({
            title: 'Passport Photos',
            tabBarIcon: getTabBarIcon('PassportPhotosTab'),
          }),
        },
        NewPhotoTab: {
          stack: 'NewPhotoStack',
          options: () => ({
            title: 'New Photo',
            tabBarIcon: getTabBarIcon('NewPhotoTab'),
          }),
        },
        GuidesTab: {
          stack: 'GuidesStack',
          options: () => ({
            title: 'Guides',
            tabBarIcon: getTabBarIcon('GuidesTab'),
          }),
        },
      },
    },
  },
  modals: {},
  root: 'tabs.AppTabs',
  hooks: [useAppearance],
  defaultOptions: {
    stacks: {
      screen: screenDefaultOptions,
    },
    tabs: {
      screen: tabScreenDefaultOptions,
    },
    drawers: {
      screen: drawerScreenDefaultOptions,
    },
  },
});

export const getNavio = () => navio;
export const NavioApp = navio.App;
