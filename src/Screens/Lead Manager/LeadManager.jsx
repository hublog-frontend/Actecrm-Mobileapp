import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Followup from './Followup';
import Leads from './Leads';
import LiveLeads from './LiveLeads';
import Junk from './Junk';
import Header from '../../Common/Header';
import { useTheme } from '../../Context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const LeadManager = ({ isSubView }) => {
  const filterValuesFromRedux = useSelector(state => state.leadfiltervalues);

  const permissions = useSelector(state => state.userpermissions) || [];

  const { theme } = useTheme();

  const defaultTab = filterValuesFromRedux?.call_get_leads_api
    ? 'Leads'
    : 'Followup';

  const [activeTab, setActiveTab] = useState(defaultTab);

  const [loadedTabs, setLoadedTabs] = useState({
    [defaultTab]: true,
  });

  const tabs = [
    { id: 'Followup', label: 'Followup' },
    { id: 'Leads', label: 'Leads' },

    ...(permissions?.includes('Show Live Leads and Junk in the Mobile App')
      ? [
          { id: 'LiveLeads', label: 'Live Leads' },
          { id: 'Junk', label: 'Junk' },
        ]
      : []),
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
      let backPressed = false;

      const onBackPress = () => {
        if (backPressed) {
          BackHandler.exitApp();
          return true;
        }

        backPressed = true;

        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

        setTimeout(() => {
          backPressed = false;
        }, 2000);

        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      if (filterValuesFromRedux?.call_get_leads_api) {
        console.log(
          'Hiiiiiiiiiiiiiiii',
          filterValuesFromRedux?.call_get_leads_api,
        );

        setActiveTab('Leads');

        setLoadedTabs(prev => ({
          ...prev,
          Leads: true,
        }));
      }
    }, [filterValuesFromRedux?.call_get_leads_api]),
  );

  const renderContent = () => {
    return (
      <View style={{ flex: 1 }}>
        {/* Followup */}
        {loadedTabs.Followup && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'Followup' ? 'flex' : 'none',
            }}
          >
            <Followup isSubView={true} isActive={activeTab === 'Followup'} />
          </View>
        )}

        {/* Leads */}
        {loadedTabs.Leads && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'Leads' ? 'flex' : 'none',
            }}
          >
            <Leads isSubView={true} isActive={activeTab === 'Leads'} />
          </View>
        )}

        {/* Live Leads */}
        {loadedTabs.LiveLeads && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'LiveLeads' ? 'flex' : 'none',
            }}
          >
            <LiveLeads isSubView={true} isActive={activeTab === 'LiveLeads'} />
          </View>
        )}

        {/* Junk */}
        {loadedTabs.Junk && (
          <View
            style={{
              flex: 1,
              display: activeTab === 'Junk' ? 'flex' : 'none',
            }}
          >
            <Junk isSubView={true} isActive={activeTab === 'Junk'} />
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
                    {
                      backgroundColor: theme.primary,
                    },
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

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  contentContainer: {
    flex: 1,
  },
});

export default LeadManager;
