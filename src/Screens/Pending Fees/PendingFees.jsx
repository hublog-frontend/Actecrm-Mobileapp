import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TodayPendingFeesCustomers from './TodayPendingFeesCustomers';
import OverallPendingFeesCustomers from './OverallPendingFeesCustomers';
import UrgentPendingFeesCustomers from './UrgentPendingFeesCustomers';
import Header from '../../Common/Header';
import { useTheme } from '../../Context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
const { width } = Dimensions.get('window');

const PendingFees = ({ isSubView, navigation }) => {
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState('Today');

  // Track visited tabs
  const [loadedTabs, setLoadedTabs] = useState({
    Today: true,
  });

  const tabs = [
    { id: 'Today', label: 'Today' },
    { id: 'Overall', label: 'Overall' },
    { id: 'Urgent', label: 'Urgent' },
  ];

  const handleTabPress = tabId => {
    setActiveTab(tabId);

    setLoadedTabs(prev => ({
      ...prev,
      [tabId]: true,
    }));
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Lead Manager');
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const renderContent = () => {
    return (
      <View style={{ flex: 1 }}>
        {/* Today */}
        {loadedTabs.Today && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'Today' ? 'flex' : 'none',
            }}
          >
            <TodayPendingFeesCustomers />
          </View>
        )}

        {/* Overall */}
        {loadedTabs.Overall && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'Overall' ? 'flex' : 'none',
            }}
          >
            <OverallPendingFeesCustomers isSubView={true} />
          </View>
        )}

        {/* Urgent */}
        {loadedTabs.Urgent && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'Urgent' ? 'flex' : 'none',
            }}
          >
            <UrgentPendingFeesCustomers />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        !isSubView && styles.container,
        { backgroundColor: theme.background },
      ]}
      edges={['left', 'right']}
    >
      {!isSubView && <Header />}

      <View
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderLight,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                activeTab === tab.id && styles.activeTabItem,
              ]}
              onPress={() => handleTabPress(tab.id)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: theme.textSecondary },
                  activeTab === tab.id && {
                    color: theme.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {tab.label}
              </Text>

              {activeTab === tab.id && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },

  tabBar: {
    paddingHorizontal: 10,
    height: 50,
    alignItems: 'center',
  },

  tabItem: {
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  activeTabItem: {},

  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },

  activeTabLabel: {
    color: '#5D6AD1',
    fontWeight: '700',
  },

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#5D6AD1',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  contentContainer: {
    flex: 1,
  },
});

export default PendingFees;
