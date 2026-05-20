// import Reactotron from 'reactotron-react-native';

// Reactotron.configure({
//   host: '192.168.1.5',
// })
//   .useReactNative()
//   .connect();

// console.tron = Reactotron;

// export default Reactotron;

import Reactotron from 'reactotron-react-native';
import { NativeModules } from 'react-native';

let scriptHostname;
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode.scriptURL;
  if (scriptURL) {
    scriptHostname = scriptURL.split('://')[1].split(':')[0];
  }
}

const tron = Reactotron.configure({
  host: scriptHostname || 'localhost',
})
  // .useReactNative({
  //   networking: {
  //     ignoreUrls: /symbolicate/,
  //   },
  // })
  .useReactNative({
    networking: true, // 👈 THIS MUST BE TRUE OR EXPLICITLY PASSED
    ignoreUrls: /symbolicate/,
  })
  .connect();

console.tron = tron;

export default tron;
