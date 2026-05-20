import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Followup from './Followup';
import Leads from './Leads';
import LiveLeads from './LiveLeads';
import Junk from './Junk';
import GlobalSearchHeader from '../../Common/GlobalSearchHeader';
import Header from '../../Common/Header';

const { width } = Dimensions.get('window');

const LeadManager = ({ isSubView }) => {
  const [activeTab, setActiveTab] = useState('Followup');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const tabs = [
    { id: 'Followup', label: 'Followup' },
    { id: 'Leads', label: 'Leads' },
    { id: 'LiveLeads', label: 'Live Leads' },
    { id: 'Junk', label: 'Junk' },
  ];

  const renderContent = () => {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: activeTab === 'Followup' ? 'flex' : 'none' }}>
          <Followup isSubView={true} isActive={activeTab === 'Followup'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Leads' ? 'flex' : 'none' }}>
          <Leads isSubView={true} isActive={activeTab === 'Leads'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'LiveLeads' ? 'flex' : 'none' }}>
          <LiveLeads isSubView={true} isActive={activeTab === 'LiveLeads'} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'Junk' ? 'flex' : 'none' }}>
          <Junk isSubView={true} isActive={activeTab === 'Junk'} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={!isSubView && styles.container}>
      {!isSubView && <Header />}
      <View style={styles.tabBarContainer}>
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
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && <View style={styles.activeIndicator} />}
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
  activeTabItem: {
    // Optional background for active tab
  },
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

export default LeadManager;
