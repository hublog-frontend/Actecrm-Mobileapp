import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalFilter } from '../../ApiService/action';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const handleLeadPress = lead => {
    setSelectedLead(lead);
    setDetailsModalVisible(true);
  };

  const handleSearch = text => {
    setQuery(text);
    if (text.length > 2) {
      getAllLeadData(text);
    } else {
      setResults([]);
    }
  };

  const getAllLeadData = async searchvalue => {
    setLoading(true);
    try {
      const response = await globalFilter(searchvalue);
      console.log('global lead response', response);
      setResults(response?.data?.result || []);
    } catch (error) {
      setResults([]);
      console.log('get leads error');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
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
            <ActivityIndicator
              size="large"
              color="#5D6AD1"
              style={{ marginTop: 50 }}
            />
          ) : query.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={80} color="#F0F3F7" />
              <Text style={styles.emptyTitle}>Global Search</Text>
              <Text style={styles.emptySubtitle}>
                Search across all modules and leads
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleLeadPress(item)}
                >
                  <View style={styles.iconCircle}>
                    <Icon name="person" size={20} color="#5D6AD1" />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>{item.name}</Text>
                    <Text style={styles.resultSubtitle}>
                      {[item.email, item.phone].filter(Boolean).join(' | ')}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color="#CBD5E0" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    No results found for "{query}"
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Lead Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDetailsModalVisible(false)}
          />
          <View style={styles.detailsModalContainer}>
            {/* Header */}
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Lead Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Icon name="close" size={24} color="#1A3353" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.detailsContent}>
              {selectedLead && (
                <View>
                  <DetailRow
                    icon="person-outline"
                    label="Name"
                    value={selectedLead.name}
                  />
                  <DetailRow
                    icon="mail-outline"
                    label="Email"
                    value={selectedLead.email}
                  />
                  <DetailRow
                    icon="call-outline"
                    label="Mobile"
                    value={selectedLead.phone}
                  />
                  <DetailRow
                    icon="logo-whatsapp"
                    label="Whatsapp"
                    value={selectedLead.whatsapp}
                  />
                  <DetailRow
                    icon="location-outline"
                    label="Area"
                    value={selectedLead.area_id}
                  />
                  <DetailRow
                    icon="person-circle-outline"
                    label="Lead Executive"
                    value={
                      selectedLead.lead_assigned_to_name
                        ? `${selectedLead.lead_assigned_to_id} (${selectedLead.lead_assigned_to_name})`
                        : selectedLead.lead_assigned_to_id
                    }
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Created At"
                    value={selectedLead.created_date}
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Next Followup"
                    value={selectedLead.next_follow_up_date}
                  />
                  <DetailRow
                    icon="chatbox-ellipses-outline"
                    label="Comments"
                    value={selectedLead.comments}
                  />

                  <View style={styles.divider} />

                  <DetailRow
                    icon="book-outline"
                    label="Course"
                    value={selectedLead.primary_course}
                  />
                  <DetailRow
                    icon="cash-outline"
                    label="Course Fees"
                    value={
                      selectedLead.primary_fees
                        ? `₹${selectedLead.primary_fees}`
                        : null
                    }
                  />
                  <DetailRow
                    icon="map-outline"
                    label="Region"
                    value={selectedLead.region_name}
                  />
                  <DetailRow
                    icon="business-outline"
                    label="Branch"
                    value={selectedLead.branch_name}
                  />
                  <DetailRow
                    icon="time-outline"
                    label="Batch Track"
                    value={selectedLead.batch_track}
                  />
                  <DetailRow
                    icon="funnel-outline"
                    label="Lead Source"
                    value={selectedLead.lead_type}
                  />
                  <DetailRow
                    icon="star-outline"
                    label="Lead Status"
                    value={selectedLead.lead_status}
                  />
                  <DetailRow
                    icon="person-add-outline"
                    label="Is Customer"
                    value={selectedLead.is_customer_reg == 1 ? 'Yes' : 'No'}
                    isHighlight={selectedLead.is_customer_reg != 1}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value, isHighlight }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelContainer}>
      {icon && (
        <Icon name={icon} size={18} color="#7D8DA1" style={styles.detailIcon} />
      )}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <View style={styles.detailValueContainer}>
      <Text style={[styles.detailValue, isHighlight && styles.highlightValue]}>
        {value || '-'}
      </Text>
    </View>
  </View>
);

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
  },
  modalOverlay: {
    flexGrow: 1,
    backgroundColor: 'rgba(26, 51, 83, 0.4)',
    justifyContent: 'flex-end',
  },
  detailsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3353',
  },
  detailsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 10,
    width: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  detailValueContainer: {
    flex: 1.2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A3353',
    textAlign: 'right',
    fontWeight: '500',
  },
  highlightValue: {
    color: '#E53E3E',
    fontWeight: '700',
  },
  divider: {
    height: 8,
    backgroundColor: '#F0F3F7',
    marginVertical: 10,
    marginHorizontal: -20,
  },
});

export default SearchScreen;
