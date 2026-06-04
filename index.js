/**
 * @format
 */
import 'react-native-gesture-handler';

if (__DEV__) {
  require('./ReactotronConfig');
}

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
