/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { navigationRef } from './src/ApiService/RootNavigation';
import Login from './src/Login/Login';
import TabNavigator from './src/Navigation/TabNavigator';
import AddLead from './src/Screens/Lead Manager/AddLead';
import store from './src/Redux/Store';
import { NotificationProvider } from './src/Context/NotificationContext';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <NotificationProvider>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#000' : '#fff'}
              />
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="AddLead" component={AddLead} />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </NotificationProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
