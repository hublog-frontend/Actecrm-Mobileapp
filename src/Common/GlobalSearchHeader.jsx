import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const GlobalSearchHeader = ({ 
  placeholder = "Search...", 
  value, 
  onChangeText, 
  onSubmitEditing,
  onFilterPress,
  onUserPress
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.globalSearchRow}>
        <TouchableOpacity style={styles.userIconContainer} onPress={onUserPress}>
          <Icon name="person-circle" size={32} color="#5D6AD1" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#667C94" />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
          />
          {value?.length > 0 && (
            <TouchableOpacity onPress={() => onChangeText('')}>
              <Icon name="close-circle" size={18} color="#A0AEC0" />
            </TouchableOpacity>
          )}
          {onFilterPress && (
            <TouchableOpacity onPress={onFilterPress}>
              <Icon name="filter-outline" size={22} color="#5D6AD1" style={styles.filterIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
    zIndex: 100,
  },
  globalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
    color: '#1A3353',
    padding: 0,
  },
  filterIcon: {
    marginLeft: 8,
  }
});

export default GlobalSearchHeader;
