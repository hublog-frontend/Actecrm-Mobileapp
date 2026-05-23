/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
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
import { ThemeProvider, useTheme } from './src/Context/ThemeContext';

import { View, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDownline, getUserPermissions } from './src/ApiService/action';
import {
  storeChildUsers,
  storeDownlineUsers,
  storeUserPermissions,
} from './src/Redux/Slice';
import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import BootSplash from 'react-native-bootsplash';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      console.log('BootSplash has been hidden successfully');
    });
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('AccessToken');
        const userDetailsStr = await AsyncStorage.getItem('loginUserDetails');
        if (token && userDetailsStr) {
          const userDetails = JSON.parse(userDetailsStr);
          const userIdVal = userDetails?.user_id || userDetails?.id;
          if (userIdVal) {
            // Fetch downline
            const response = await getUserDownline(userIdVal);
            const child_users = response?.data?.data?.child_users || [];
            const downline_users = response?.data?.data?.downline_users || [];
            const user_roles = response?.data?.data?.roles || [];

            dispatch(storeChildUsers(child_users));
            dispatch(storeDownlineUsers(downline_users));

            // Fetch permissions
            const permissionsResponse = await getUserPermissions({
              role_ids: user_roles,
            });
            const permissions = permissionsResponse?.data?.data || [];
            if (permissions.length >= 1) {
              const updateData = permissions.map(item => item.permission_name);
              dispatch(storeUserPermissions(updateData));
            }

            DeviceEventEmitter.emit('callGetNotificationApi');
            setInitialRoute('MainTabs');
          }
        }
      } catch (error) {
        console.log('Error restoring session in App.jsx', error);
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          await AsyncStorage.removeItem('AccessToken');
          await AsyncStorage.removeItem('loginUserDetails');
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AddLead" component={AddLead} />
    </Stack.Navigator>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <NotificationProvider>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
          </NotificationProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { theme } = useTheme();
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.statusBarBg}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default App;
