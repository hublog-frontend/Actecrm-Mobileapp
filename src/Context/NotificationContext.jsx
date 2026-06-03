import React, { createContext, useEffect, useState, useRef } from 'react';
import { DeviceEventEmitter, AppState, Linking, Alert, Platform } from 'react-native';
import { io } from 'socket.io-client';
import notifee, { AndroidImportance, AndroidVisibility, AuthorizationStatus } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, getNotifications } from '../ApiService/action';
import { CommonMessage } from '../Common/CommonMessage';
import * as RootNavigation from '../ApiService/RootNavigation';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const leadCountRef = useRef(0);
  const socketRef = useRef(null);

  const fetchNotifications = async userId => {
    const payload = {
      user_id: userId,
      page: 1,
    };
    try {
      const res = await getNotifications(payload);
      const data = res?.data?.data || [];
      setNotifications(data);

      // Calculate initial unread count
      const initialUnread = data.filter(n => n.is_read === 0).length;
      setUnreadCount(initialUnread);

      const lead_count = res?.data?.lead_count || 0;
      leadCountRef.current = lead_count;
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const playNotificationSound = () => {
    // Standard tactile mobile alert: Vibrate for 500ms
    // Vibration.vibrate(500);
    console.log('Tactile mobile alert triggered (Notification / Lead Update)');
  };

  const setupSocket = userId => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to notification socket');
      socket.emit('register', {
        userId,
        platform: 'mobile',
      });
    });

    socket.on('notification', newNotification => {
      console.log('Real-time notification received:', newNotification);

      // Add 'is_read: 0' if not present for correct count
      const notificationWithReadStatus = {
        ...newNotification,
        is_read: newNotification.is_read ?? 0,
      };

      setNotifications(prev => [notificationWithReadStatus, ...prev]);

      if (notificationWithReadStatus.is_read === 0) {
        setUnreadCount(prev => prev + 1);
      }

      // Display native status bar notification
      notifee.displayNotification({
        title: notificationWithReadStatus.title || 'New Notification',
        body: notificationWithReadStatus.message || notificationWithReadStatus.body || 'You have a new message.',
        android: {
          channelId: 'high_priority_alerts_v1',
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
          color: '#5b69ca',
          pressAction: {
            id: 'default',
          },
          fullScreenAction: {
            id: 'default',
          },
        },
      }).catch(err => console.error('Error displaying notification:', err));

      // Specifically notify listeners of a new socket notification
      DeviceEventEmitter.emit(
        'socket_notification',
        notificationWithReadStatus,
      );
    });

    socket.on('lead_update', data => {
      console.log('Lead update received:', data);
      const newCount = data.lead_count;
      if (newCount > leadCountRef.current) {
        // playNotificationSound();
      }
      leadCountRef.current = newCount;

      // Specifically notify Lead components to refresh lists
      DeviceEventEmitter.emit('refreshLiveLeads', data);
    });

    socket.on('force_logout', () => {
      console.warn('Forced logout: session taken by another device.');
      // CommonMessage(
      //   "warning",
      //   "You have been logged out because a new login was detected on another system.",
      // );
      // setTimeout(async () => {
      //   try {
      //     await AsyncStorage.removeItem("AccessToken");
      //     await AsyncStorage.removeItem("loginUserDetails");
      //     RootNavigation.navigate("Login");
      //   } catch (e) {
      //     console.error("Failed during force logout token cleanup:", e);
      //   }
      // }, 2000);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification socket');
    });

    socketRef.current = socket;
  };

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        const settings = await notifee.requestPermission();
        if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
          Alert.alert(
            'Notifications Disabled',
            'To stay updated with messages and alerts, please enable notifications in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
      } catch (error) {
        console.error('Error requesting permission:', error);
      }
    };

    const handleInit = async () => {
      try {
        await checkNotificationPermission();
        await notifee.createChannel({
          id: 'high_priority_alerts_v1',
          name: 'Important Alerts',
          importance: AndroidImportance.HIGH,
          vibration: true,
          sound: 'default',
          visibility: AndroidVisibility.PUBLIC,
        });

        const raw = await AsyncStorage.getItem('loginUserDetails');
        const user = raw ? JSON.parse(raw) : null;

        if (user?.user_id) {
          await fetchNotifications(user.user_id);
          setupSocket(user.user_id);
        }
      } catch (err) {
        console.error(
          'Error loading credentials inside NotificationProvider init:',
          err,
        );
      }
    };

    handleInit();

    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkNotificationPermission();
      }
    });

    const initListener = DeviceEventEmitter.addListener(
      'callGetNotificationApi',
      handleInit,
    );
    const logoutListener = DeviceEventEmitter.addListener(
      'manualLogout',
      logout,
    );

    return () => {
      logout();
      appStateSubscription.remove();
      initListener.remove();
      logoutListener.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        fetchNotifications,
        logout,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
