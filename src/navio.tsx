import {Navio} from 'rn-navio';

import {Download} from '@app/screens/download';
import {Library} from '@app/screens/library';
import {VideoPlayer} from '@app/screens/video-player';

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
    Download,
    Library,
    VideoPlayer: {
      component: VideoPlayer,
      options: props => ({
        title: 'ThreeOne',
        headerShown: false,
        statusBarHidden: true,
      }),
    },
  },
  stacks: {
    DownloadStack: ['Download'],
    LibraryStack: ['Library', 'VideoPlayer'],
  },
  tabs: {
    AppTabs: {
      screenOptions: {
        headerShown: false,
      },
      initialRouteName: 'DownloadTab',
      layout: {
        DownloadTab: {
          stack: 'DownloadStack',
          options: () => ({
            title: 'Download',
            tabBarIcon: getTabBarIcon('DownloadTab'),
          }),
        },
        LibraryTab: {
          stack: 'LibraryStack',
          options: () => ({
            title: 'Library',
            tabBarIcon: getTabBarIcon('LibraryTab'),
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
