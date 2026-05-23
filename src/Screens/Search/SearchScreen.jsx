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
  Keyboard,
  Pressable,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalFilter } from '../../ApiService/action';
import { useTheme } from '../../Context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

const SearchScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectionKey, setSelectionKey] = useState(0);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={styles.container}>
        {/* Search Header */}
        <View
          style={[
            styles.searchHeader,
            { borderBottomColor: theme.borderLight },
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Icon name="search" size={20} color={theme.textMuted} />
            <TextInput
              autoFocus
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="Search across leads, phone..."
              value={query}
              onChangeText={handleSearch}
              placeholderTextColor={theme.textMuted}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Icon name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={styles.loader}
            />
          ) : query.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={80} color={theme.borderLight} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                Global Search
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}
              >
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
                  style={[
                    styles.resultItem,
                    { borderBottomColor: theme.borderLight },
                  ]}
                  onPress={() => handleLeadPress(item)}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Icon name="person" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.resultText}>
                    <Text
                      style={[styles.resultTitle, { color: theme.textPrimary }]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.resultSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {[item.email, item.phone].filter(Boolean).join(' | ')}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={16} color={theme.border} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.noResultsContainer}>
                  <Text
                    style={[
                      styles.noResultsText,
                      { color: theme.textSecondary },
                    ]}
                  >
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
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDetailsModalVisible(false)}
          />
          <View
            style={[
              styles.detailsModalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.detailsHeader,
                {
                  backgroundColor: theme.surface,
                  borderBottomColor: theme.borderLight,
                },
              ]}
            >
              <View
                style={[
                  styles.dragIndicator,
                  { backgroundColor: theme.border },
                ]}
              />
              <View style={styles.headerRow}>
                <Text
                  style={[styles.detailsTitle, { color: theme.textPrimary }]}
                >
                  Lead Details
                </Text>
                <TouchableOpacity
                  onPress={() => setDetailsModalVisible(false)}
                  style={[
                    styles.closeButton,
                    { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <Icon name="close" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              contentContainerStyle={styles.detailsContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedLead && (
                <Pressable onPress={() => setSelectionKey(prev => prev + 1)}>
                  <Text
                    style={[styles.sectionHeading, { color: theme.primary }]}
                  >
                    Basic Information
                  </Text>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <DetailRow
                      icon="person-outline"
                      label="Name"
                      value={selectedLead.name}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="mail-outline"
                      label="Email"
                      value={selectedLead.email}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="call-outline"
                      label="Mobile"
                      value={selectedLead.phone}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="logo-whatsapp"
                      label="Whatsapp"
                      value={selectedLead.whatsapp}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="location-outline"
                      label="Area"
                      value={selectedLead.area_id}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="person-circle-outline"
                      label="Lead Executive"
                      selectionKey={selectionKey}
                      theme={theme}
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
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="calendar-outline"
                      label="Next Followup"
                      value={selectedLead.next_follow_up_date}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="chatbox-ellipses-outline"
                      label="Comments"
                      value={selectedLead.comments}
                      hideBorder
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                  </View>

                  <Text
                    style={[styles.sectionHeading, { color: theme.primary }]}
                  >
                    Course Details
                  </Text>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <DetailRow
                      icon="book-outline"
                      label="Course"
                      value={selectedLead.primary_course}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="cash-outline"
                      label="Course Fees"
                      selectionKey={selectionKey}
                      theme={theme}
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
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="business-outline"
                      label="Branch"
                      value={selectedLead.branch_name}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="time-outline"
                      label="Batch Track"
                      value={selectedLead.batch_track}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="funnel-outline"
                      label="Lead Source"
                      value={selectedLead.lead_type}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="star-outline"
                      label="Lead Status"
                      value={selectedLead.lead_status}
                      selectionKey={selectionKey}
                      theme={theme}
                    />
                    <DetailRow
                      icon="person-add-outline"
                      label="Is Customer"
                      selectionKey={selectionKey}
                      theme={theme}
                      value={selectedLead.is_customer_reg === 1 ? 'Yes' : 'No'}
                      isHighlight={selectedLead.is_customer_reg !== 1}
                      hideBorder
                    />
                  </View>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const DetailRow = ({
  icon,
  label,
  value,
  isHighlight,
  hideBorder,
  selectionKey,
  theme,
}) => {
  return (
    <View
      style={[
        styles.detailRow,
        hideBorder && styles.noBorder,
        { borderBottomColor: theme.borderLight },
      ]}
    >
      <View style={styles.detailLabelContainer}>
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Icon name={icon} size={16} color={theme.primary} />
          </View>
        )}
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.detailValueContainer}>
        <Pressable onPress={() => {}} style={styles.valuePressable}>
          <Text
            key={selectionKey}
            style={[
              styles.detailValue,
              { color: theme.textPrimary },
              isHighlight && { color: theme.error, fontWeight: '700' },
            ]}
            selectable={true}
          >
            {value || '-'}
          </Text>
        </Pressable>
      </View>
    </View>
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
  loader: {
    marginTop: 50,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  // valuePressable: {
  //   flex: 1,
  //   alignItems: 'flex-end',
  //   justifyContent: 'center',
  //   minHeight: 28,
  // },
});

export default SearchScreen;
