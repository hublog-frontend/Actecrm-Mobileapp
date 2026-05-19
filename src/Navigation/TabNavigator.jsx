import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import LeadManager from '../Screens/Lead Manager/LeadManager';
import SearchScreen from '../Screens/Search/SearchScreen';
import AddLead from '../Screens/Lead Manager/AddLead';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Lead Manager') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'Add Lead') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Junk') {
            iconName = focused ? 'trash' : 'trash-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5D6AD1',
        tabBarInactiveTintColor: '#7D8DA1',
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen name="Lead Manager" component={LeadManager} />
      <Tab.Screen name="Add Lead" component={AddLead} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
