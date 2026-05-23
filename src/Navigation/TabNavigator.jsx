import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import LeadManager from '../Screens/Lead Manager/LeadManager';
import SearchScreen from '../Screens/Search/SearchScreen';
import AddLead from '../Screens/Lead Manager/AddLead';
import PendingFees from '../Screens/Pending Fees/PendingFees';
import Dashboard from '../Screens/Dashboard/Dashboard';
import { useTheme } from '../Context/ThemeContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Lead Manager"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Lead Manager') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'Add Lead') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Pending Fees') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: {
          color: theme.textSecondary,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Lead Manager" component={LeadManager} />
      <Tab.Screen name="Add Lead" component={AddLead} />
      <Tab.Screen name="Pending Fees" component={PendingFees} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
