import React, { useState, useRef } from 'react';
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
  Keyboard,
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
    Keyboard.dismiss();
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
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => {
                    handleLeadPress(item);
                  }}
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
              <View style={styles.dragIndicator} />
              <View style={styles.headerRow}>
                <Text style={styles.detailsTitle}>Lead Details</Text>
                <TouchableOpacity
                  onPress={() => setDetailsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#1A3353" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              contentContainerStyle={styles.detailsContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedLead && (
                <View>
                  <Text style={styles.sectionHeading}>Basic Information</Text>
                  <View style={styles.card}>
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
                      hideBorder
                    />
                    <DetailRow
                      icon="person-add-outline"
                      label="Is Customer"
                      value={selectedLead.is_customer_reg == 1 ? 'Yes' : 'No'}
                      isHighlight={selectedLead.is_customer_reg != 1}
                      hideBorder
                    />
                  </View>

                  <Text style={styles.sectionHeading}>Course Details</Text>
                  <View style={styles.card}>
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
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value, isHighlight, hideBorder }) => (
  <View style={[styles.detailRow, hideBorder && { borderBottomWidth: 0 }]}>
    <View style={styles.detailLabelContainer}>
      {icon && (
        <View style={styles.iconWrapper}>
          <Icon name={icon} size={16} color="#5D6AD1" />
        </View>
      )}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <View style={styles.detailValueContainer}>
      <Text
        style={[styles.detailValue, isHighlight && styles.highlightValue]}
        selectable={true}
      >
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
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#EEF2FF',
    padding: 6,
    borderRadius: 20,
  },
  detailsHeader: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF0F6',
    shadowColor: '#1A3353',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3353',
  },
  detailsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D6AD1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#1A3353',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAF0F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F3F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#667C94',
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
    fontWeight: '600',
  },
  highlightValue: {
    color: '#E53E3E',
    fontWeight: '700',
  },
});

export default SearchScreen;
