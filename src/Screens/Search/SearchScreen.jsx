import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  FlatList,
  Text,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length > 2) {
      // Perform global search logic here
      // For now, it's a UI placeholder
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <View style={styles.inputContainer}>
            <Icon name="search" size={20} color="#A0AEC0" />
            <TextInput
              autoFocus
              style={styles.input}
              placeholder="Search across leads, phone..."
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
          {loading ? (
            <ActivityIndicator size="large" color="#5D6AD1" style={{marginTop: 50}} />
          ) : query.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={80} color="#F0F3F7" />
              <Text style={styles.emptyTitle}>Global Search</Text>
              <Text style={styles.emptySubtitle}>Search across all modules and leads</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem}>
                  <View style={styles.iconCircle}>
                    <Icon name="person" size={20} color="#5D6AD1" />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    <Text style={styles.resultSubtitle}>{item.details}</Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color="#CBD5E0" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.noResultsContainer}>
                   <Text style={styles.noResultsText}>No results found for "{query}"</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A3353',
    marginLeft: 10,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A3353',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    flex: 1,
    marginLeft: 15,
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
  noResultsContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#718096',
    fontSize: 15,
  }
});

export default SearchScreen;
