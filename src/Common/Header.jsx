import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  DeviceEventEmitter,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { NotificationContext } from '../Context/NotificationContext';
import * as RootNavigation from '../ApiService/RootNavigation';
import moment from 'moment';

const { width } = Dimensions.get('window');
const drawerWidth = width * 0.78;

const Header = () => {
  const { notifications, unreadCount, setUnreadCount } =
    useContext(NotificationContext);
  const [loginUser, setLoginUser] = useState(null);
  const [userName, setUserName] = useState('User');
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  // Left Drawer States
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Fetch logged-in user details
  const fetchUser = async () => {
    try {
      const detailsStr = await AsyncStorage.getItem('loginUserDetails');
      if (detailsStr) {
        const details = JSON.parse(detailsStr);
        setLoginUser(details);
        // Fallbacks to handle various backend key conventions
        const name =
          details?.user_name ||
          details?.name ||
          details?.first_name ||
          details?.user_id ||
          'User';
        setUserName(name);
      }
    } catch (err) {
      console.error('Error fetching user details in Header:', err);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for login/initialization event to refresh username instantly
    const subscription = DeviceEventEmitter.addListener(
      'callGetNotificationApi',
      fetchUser,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const getInitials = name => {
    if (!name) return 'U';
    const cleaned = name.trim();
    if (cleaned.length === 0) return 'U';
    const parts = cleaned.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleaned[0].toUpperCase();
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    // Optionally trigger an API call to mark all as read
  };

  // Left Side Drawer Open/Close Animations
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
    });
  };

  // Logout trigger
  const handleLogout = async () => {
    try {
      closeDrawer();
      DeviceEventEmitter.emit('manualLogout');
      await AsyncStorage.removeItem('AccessToken');
      await AsyncStorage.removeItem('loginUserDetails');
      RootNavigation.navigate('Login');
    } catch (err) {
      console.error('Error logging out from Drawer:', err);
    }
  };

  const renderNotificationItem = ({ item }) => {
    const timeLabel = item.created_date
      ? moment(item.created_date).fromNow()
      : 'Just now';

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationIconBg}>
          <Icon name="information-circle" size={22} color="#5D6AD1" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            {item.message || 'New update received.'}
          </Text>
          <Text style={styles.notificationTime}>{timeLabel}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* Left Side: Avatar and Welcome Greeting (Interactive to open Left Drawer) */}
        <TouchableOpacity
          style={styles.leftContainer}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.greetingText}>Hi, {userName}</Text>
            <Text style={styles.subText}>Welcome back</Text>
          </View>
        </TouchableOpacity>

        {/* Right Side: Notification Icon */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setNotificationModalVisible(true)}
          activeOpacity={0.7}
        >
          <Icon name="notifications-outline" size={20} color="#1A3353" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 1. Left Side Menu Drawer Modal overlay */}
      {drawerVisible && (
        <View style={[StyleSheet.absoluteFill, styles.drawerOverlay]}>
          {/* Fading Backdrop */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#1A3353',
                opacity: backdropOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4],
                }),
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>

          {/* Sliding Drawer Sidebar Container */}
          <Animated.View
            style={[
              styles.drawerContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <SafeAreaView style={styles.drawerSafeArea}>
              <ScrollView
                contentContainerStyle={styles.drawerScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Header Card */}
                <View style={styles.drawerProfileHeader}>
                  <View style={styles.largeAvatarContainer}>
                    <View style={styles.largeAvatarCircle}>
                      <Text style={styles.largeAvatarText}>
                        {getInitials(userName)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.avatarPlusIcon}
                      activeOpacity={0.8}
                    >
                      <Icon name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.drawerProfileName}>
                    {`${loginUser?.user_id} | ${userName}`}
                  </Text>
                  <View style={styles.drawerProfileRole}>
                    <Icon name="call" size={14} color="#667C94" />
                    <Text style={styles.phoneText}>
                      {loginUser?.phone || '-'}
                    </Text>
                  </View>
                  <Text style={styles.drawerProfileLocation}>
                    {loginUser?.location ||
                      loginUser?.branch_name ||
                      'Chennai, Tamil Nadu, India'}
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.drawerDivider} />

                {/* Main Menu Options */}
                <View style={styles.drawerMenuContainer}></View>

                {/* Settings & Bottom Profile Details Section */}
                <View style={styles.bottomSection}>
                  {/* <TouchableOpacity
                    style={styles.settingsItem}
                    activeOpacity={0.7}
                  >
                    <Icon name="settings-outline" size={20} color="#1A3353" />
                    <Text style={styles.settingsText}>Settings</Text>
                  </TouchableOpacity> */}

                  {/* Profile Details Card on bottom */}
                  {/* <View style={styles.profileDetailsCard}>
                    <Text style={styles.detailsCardTitle}>Profile Details</Text>

                    {loginUser?.email && (
                      <View style={styles.detailCardRow}>
                        <Icon name="mail-outline" size={14} color="#7D8DA1" />
                        <Text style={styles.detailCardText}>
                          {loginUser.email}
                        </Text>
                      </View>
                    )}

                    {loginUser?.phone && (
                      <View style={styles.detailCardRow}>
                        <Icon name="call-outline" size={14} color="#7D8DA1" />
                        <Text style={styles.detailCardText}>
                          {loginUser.phone}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailCardRow}>
                      <Icon
                        name="finger-print-outline"
                        size={14}
                        color="#7D8DA1"
                      />
                      <Text style={styles.detailCardText}>
                        User ID: {loginUser?.user_id || 'ACTE-1024'}
                      </Text>
                    </View>
                  </View> */}

                  {/* Logout Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.logoutBtn,
                      pressed && styles.logoutBtnPressed,
                    ]}
                    onPress={handleLogout}
                  >
                    {({ pressed }) => (
                      <>
                        <Icon
                          name="log-out-outline"
                          size={20}
                          color={pressed ? '#FFFFFF' : '#E74C3C'}
                        />
                        <Text
                          style={[
                            styles.logoutBtnText,
                            pressed && styles.logoutBtnTextPressed,
                          ]}
                        >
                          Logout
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

      {/* 2. Notifications Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllRead}
                    style={styles.markReadBtn}
                  >
                    <Text style={styles.markReadText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setNotificationModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Icon name="close" size={24} color="#1A3353" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            {notifications && notifications.length > 0 ? (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item, index) =>
                  item.id?.toString() || index.toString()
                }
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Icon
                    name="notifications-off-outline"
                    size={48}
                    color="#7D8DA1"
                  />
                </View>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  You have no new notifications right now.
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 35,
    height: 35,
    borderRadius: 21,
    backgroundColor: '#5D6AD1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D6AD1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  textContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3353',
  },
  subText: {
    fontSize: 10,
    color: '#7D8DA1',
    fontWeight: '500',
    marginTop: 1,
  },
  notificationButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#E74C3C',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Left side slide Drawer Styles
  drawerOverlay: {
    zIndex: 1000,
    flexDirection: 'row',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: drawerWidth,
    backgroundColor: '#FFFFFF',
    zIndex: 1001,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#1A3353',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerScrollView: {
    flexGrow: 1,
  },
  drawerProfileHeader: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'flex-start',
  },
  largeAvatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  largeAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E8EE',
  },
  largeAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5D6AD1',
  },
  avatarPlusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5D6AD1',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  drawerProfileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3353',
  },
  drawerProfileRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  phoneText: {
    fontSize: 14,
    color: '#667C94',
    fontWeight: '500',
    marginLeft: 4,
  },
  drawerProfileLocation: {
    fontSize: 13,
    color: '#7D8DA1',
    marginTop: 4,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F0F3F7',
    marginVertical: 18,
  },
  drawerMenuContainer: {
    paddingHorizontal: 24,
  },
  drawerMenuItem: {
    paddingVertical: 14,
  },
  drawerMenuText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3353',
  },
  bottomSection: {
    paddingHorizontal: 24,
    marginTop: 'auto',
    paddingBottom: 30,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  settingsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3353',
    marginLeft: 12,
  },
  profileDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 20,
  },
  detailsCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7D8DA1',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  detailCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailCardText: {
    fontSize: 13,
    color: '#1A3353',
    fontWeight: '600',
    marginLeft: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#d32f2f',
    borderRadius: 14,
    height: 50,
  },
  logoutBtnPressed: {
    backgroundColor: '#d32f2f',
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnText: {
    color: '#d32f2f',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  logoutBtnTextPressed: {
    color: '#FFFFFF',
  },

  // Notifications Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 51, 83, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3353',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadBtn: {
    marginRight: 16,
  },
  markReadText: {
    fontSize: 13,
    color: '#5D6AD1',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F3F7',
  },
  notificationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#1A3353',
    lineHeight: 20,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 11,
    color: '#7D8DA1',
    marginTop: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3353',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#7D8DA1',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default Header;
