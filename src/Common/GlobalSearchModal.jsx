import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  FlatList,
  Text 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const GlobalSearchModal = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (text) => {
    setQuery(text);
    // Logic for global search across different modules
    // e.g. Leads, Followups, Payments etc.
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#1A3353" />
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              <TextInput
                autoFocus
                style={styles.input}
                placeholder="Search leads, courses, phone..."
                value={query}
                onChangeText={handleSearch}
                placeholderTextColor="#A0AEC0"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Icon name="close-circle" size={18} color="#A0AEC0" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.content}>
            {query.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="search" size={60} color="#E2E8F0" />
                <Text style={styles.emptyText}>Search across everything</Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem}>
                    <Icon name="person-outline" size={20} color="#5D6AD1" />
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle}>{item.name}</Text>
                      <Text style={styles.resultSubtitle}>{item.type}</Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color="#A0AEC0" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResults}>No matches found for "{query}"</Text>
                }
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A3353',
    padding: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3353',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 40,
    color: '#718096',
    fontSize: 15,
  }
});

export default GlobalSearchModal;
