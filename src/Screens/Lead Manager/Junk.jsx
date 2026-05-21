import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { CommonMessage } from '../../Common/CommonMessage';
import { getCurrentandPreviousweekDate } from '../../Common/Validation';
import {
  getJunkLeads,
  deleteJunkLeads,
  updateJunkValue,
} from '../../ApiService/action';
import { storeJunkLeadFilterValues } from '../../Redux/Slice';
import CommonMuiCustomDatePicker from '../../Common/CommonMuiCustomDatePicker';
import styles from './LeadManagerstyles';

const Junk = ({ isSubView, isActive, setJunkLeadCount }) => {
  const dispatch = useDispatch();

  // Redux Permissions & Filter Config
  const permissions = useSelector(state => state.userpermissions || []);
  const filterValues = useSelector(state => state.junkleadfiltervalues || {});

  // Date Range Presets
  const previousAndCurrent = getCurrentandPreviousweekDate();
  const startDate = filterValues.start_date || previousAndCurrent[0];
  const endDate = filterValues.end_date || previousAndCurrent[1];

  // Local State Configuration
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState(filterValues.searchValue || '');
  const [filterType, setFilterType] = useState(filterValues.filterType || 1); // 1: Mobile, 2: Name, 3: Email, 4: Course
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Batch Multi-select IDs
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Single Lead Target IDs
  const [leadId, setLeadId] = useState(null);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const isFetchingRef = useRef(false);

  // Main Junk Leads fetch operation
  const fetchLeads = useCallback(
    async (pageNum = 1, isRefresh = false, searchText = search) => {
      if (isFetchingRef.current && !isRefresh) return;
      isFetchingRef.current = true;
      setLoading(true);

      try {
        const payload = {
          start_date: startDate,
          end_date: endDate,
          page: pageNum,
          limit: 10,
          ...(searchText && filterType == 1 ? { phone: searchText } : {}),
          ...(searchText && filterType == 2 ? { name: searchText } : {}),
          ...(searchText && filterType == 3 ? { email: searchText } : {}),
          ...(searchText && filterType == 4 ? { course: searchText } : {}),
        };

        const response = await getJunkLeads(payload);
        const newLeads = response?.data?.data?.data || [];
        const paginations = response?.data?.data?.pagination || {};

        if (isRefresh) {
          setLeads(newLeads);
        } else {
          setLeads(prev => [...prev, ...newLeads]);
        }

        // Keep parent component updated of the Junk count if callback exists
        if (typeof setJunkLeadCount === 'function') {
          setJunkLeadCount(paginations.total || 0);
        }

        setPage(pageNum);
        setHasMore(newLeads.length === 10);
      } catch (error) {
        console.error('Error fetching junk leads:', error);
        CommonMessage('error', 'Failed to fetch junk leads');
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [startDate, endDate, search, filterType],
  );

  // Focus effect for tab transitions
  useFocusEffect(
    useCallback(() => {
      fetchLeads(1, true);
    }, [fetchLeads]),
  );

  // Tab active parameter effect
  useEffect(() => {
    if (isActive) {
      fetchLeads(1, true);
    }
  }, [isActive, fetchLeads]);

  // Pull to refresh trigger
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeads(1, true);
  }, [fetchLeads]);

  // Pagination trigger
  const loadMore = () => {
    if (hasMore && !loading && leads.length > 0) {
      fetchLeads(page + 1);
    }
  };

  // Search input typing handler
  const handleSearchChange = text => {
    setSearch(text);
    dispatch(
      storeJunkLeadFilterValues({
        searchValue: text,
      }),
    );
    if (text.length === 0) {
      fetchLeads(1, true, '');
    }
  };

  // Checkbox multi-selection mechanics
  const toggleSelectCard = id => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCardPress = item => {
    if (selectedIds.length > 0) {
      toggleSelectCard(item.id);
    }
  };

  // Move leads to live API handler (revert operation)
  const handleRevertSubmit = async () => {
    setButtonLoading(true);
    const ids = leadId ? [leadId] : selectedIds;
    const payload = {
      lead_ids: ids,
      is_junk: false,
    };
    try {
      await updateJunkValue(payload);
      CommonMessage('success', 'Updated');
      setMoveModalVisible(false);
      setLeadId(null);
      setSelectedIds([]);
      fetchLeads(1, true);
    } catch (err) {
      console.error(err);
      CommonMessage(
        'error',
        err?.response?.data?.details || 'Something went wrong. Try again later',
      );
    } finally {
      setButtonLoading(false);
    }
  };

  // Delete leads permanently API handler
  const handleDeleteSubmit = async () => {
    setButtonLoading(true);
    const ids = leadId ? [leadId] : selectedIds;
    const payload = {
      lead_ids: ids,
    };
    try {
      await deleteJunkLeads(payload);
      CommonMessage('success', 'Updated');
      setDeleteModalVisible(false);
      setLeadId(null);
      setSelectedIds([]);
      fetchLeads(1, true);
    } catch (err) {
      console.error(err);
      CommonMessage(
        'error',
        err?.response?.data?.details || 'Something went wrong. Try again later',
      );
    } finally {
      setButtonLoading(false);
    }
  };

  // Color mapping configurations for training mode pills
  const getTrainingModeStyles = mode => {
    const formatMode = String(mode || '').toLowerCase();
    if (formatMode.includes('online')) {
      return { bg: '#E8F5E9', text: '#2E7D32' };
    } else if (formatMode.includes('classroom')) {
      return { bg: '#E3F2FD', text: '#1565C0' };
    } else if (formatMode.includes('corporate')) {
      return { bg: '#ECEFF1', text: '#455A64' };
    }
    return { bg: '#F5F7FA', text: '#667C94' };
  };

  // Custom Lead Card renderer
  const renderLeadCard = ({ item, index }) => {
    const isCardSelected = selectedIds.includes(item.id);
    const trainingModeStyles = getTrainingModeStyles(
      item.training || item.training_mode,
    );
    const slNo = (page - 1) * 10 + (index + 1);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleCardPress(item)}
        onLongPress={() => toggleSelectCard(item.id)}
        style={[styles.card, isCardSelected && localStyles.cardSelected]}
      >
        {/* Checkbox indicator */}
        {selectedIds.length > 0 && (
          <View style={localStyles.checkboxContainer}>
            <Icon
              name={isCardSelected ? 'checkbox' : 'square-outline'}
              size={22}
              color="#5D6AD1"
            />
          </View>
        )}

        <View style={{ flex: 1 }}>
          {/* Card Top Row */}
          <View style={styles.cardHeader}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Sl. No Badge */}
              <View style={localStyles.slNoBadge}>
                <Text style={localStyles.slNoText}>Sl. No: {slNo}</Text>
              </View>

              {/* Created Date formatted */}
              <View style={localStyles.dateBadge}>
                <Icon name="calendar-outline" size={10} color="#667C94" />
                <Text style={localStyles.dateText}>
                  {moment(item.created_date).format('MM/DD/YYYY')}
                </Text>
              </View>
            </View>
          </View>

          {/* Card Details Body */}
          <View style={styles.cardBody}>
            {/* Course */}
            <View style={styles.detailRow}>
              <Icon name="book-outline" size={14} color="#667C94" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.course || 'No course specified'}
              </Text>
            </View>

            {/* Email (clickable mailto) */}
            {item.email && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${item.email}`)}
                style={styles.detailRow}
              >
                <Icon name="mail-outline" size={14} color="#5D6AD1" />
                <Text
                  style={[styles.detailText, localStyles.linkText]}
                  selectable={true}
                >
                  {item.email}
                </Text>
              </TouchableOpacity>
            )}

            {/* Mobile / Phone (clickable call) */}
            {item.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
                style={styles.detailRow}
              >
                <Icon name="call-outline" size={14} color="#5D6AD1" />
                <Text
                  style={[styles.detailText, localStyles.linkText]}
                  selectable={true}
                >
                  {item.phone}
                </Text>
              </TouchableOpacity>
            )}

            {/* Location */}
            {item.location && (
              <View style={styles.detailRow}>
                <Icon name="location-outline" size={14} color="#667C94" />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
            )}

            {/* Training Mode Pill */}
            {(item.training || item.training_mode) && (
              <View style={styles.detailRow}>
                <Icon name="ribbon-outline" size={14} color="#667C94" />
                <View
                  style={[
                    localStyles.modeBadge,
                    { backgroundColor: trainingModeStyles.bg },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.modeText,
                      { color: trainingModeStyles.text },
                    ]}
                  >
                    {item.training || item.training_mode}
                  </Text>
                </View>
              </View>
            )}

            {/* Comments Section */}
            {item.comments && (
              <View style={[localStyles.notesContainer, { marginTop: 6 }]}>
                <Icon
                  name="chatbox-ellipses-outline"
                  size={13}
                  color="#667C94"
                />
                <Text
                  style={[styles.detailText, { fontStyle: 'italic', flex: 1 }]}
                  numberOfLines={2}
                >
                  Comment: {item.comments}
                </Text>
              </View>
            )}

            {/* Junk Reason Section */}
            {item.junk_reason && (
              <View style={[localStyles.reasonContainer, { marginTop: 6 }]}>
                <Icon name="warning-outline" size={13} color="#D32F2F" />
                <Text
                  style={[
                    styles.detailText,
                    { color: '#D32F2F', fontWeight: '500', flex: 1 },
                  ]}
                  numberOfLines={2}
                >
                  Junk Reason: {item.junk_reason}
                </Text>
              </View>
            )}
          </View>

          {/* Individual Action Row */}
          <View style={styles.cardFooter}>
            {/* Revert / Move to Live (Conditional on Permission) */}
            {permissions.includes('Revert to Live Leads') ? (
              <TouchableOpacity
                onPress={() => {
                  setLeadId(item.id);
                  setMoveModalVisible(true);
                }}
                style={styles.actionButton}
              >
                <Icon name="refresh-outline" size={18} color="#5b69ca" />
                <Text style={[styles.actionText, { color: '#5b69ca' }]}>
                  Revert
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {/* Delete Lead */}
            <TouchableOpacity
              onPress={() => {
                setLeadId(item.id);
                setDeleteModalVisible(true);
              }}
              style={styles.actionButton}
            >
              <Icon name="trash-outline" size={18} color="#d32f2f" />
              <Text style={[styles.actionText, { color: '#d32f2f' }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isSubView && { backgroundColor: 'transparent' },
      ]}
    >
      {/* Search Header */}
      <View style={localStyles.stickyHeader}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={
                filterType === 1
                  ? 'Search By Mobile...'
                  : filterType === 2
                  ? 'Search By Name...'
                  : filterType === 3
                  ? 'Search By Email...'
                  : 'Search By Course...'
              }
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={() => fetchLeads(1, true)}
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <Icon name="close-circle" size={18} color="#A0AEC0" />
              </TouchableOpacity>
            )}

            {/* Filter Toggle Dialog */}
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setFilterModalVisible(true)}
            >
              <Icon name="filter" size={20} color="#5D6AD1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Date Range Picker */}
        <View style={{ backgroundColor: '#FFFFFF', paddingTop: 10 }}>
          <CommonMuiCustomDatePicker
            value={[
              filterValues.start_date || getCurrentandPreviousweekDate()[0],
              filterValues.end_date || getCurrentandPreviousweekDate()[1],
            ]}
            onDateChange={range => {
              dispatch(
                storeJunkLeadFilterValues({
                  start_date: range[0],
                  end_date: range[1],
                }),
              );
            }}
          />
        </View>
      </View>

      {/* Leads List container */}
      {loading && leads.length === 0 ? (
        <View style={localStyles.centered}>
          <ActivityIndicator size="large" color="#5D6AD1" />
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLeadCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: selectedIds.length > 0 ? 90 : 20 },
          ]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={localStyles.emptyContainer}>
              <Icon name="trash-bin-outline" size={48} color="#CBD5E1" />
              <Text style={localStyles.emptyText}>No junk leads found</Text>
            </View>
          }
          ListFooterComponent={
            loading && leads.length > 0 ? (
              <View style={localStyles.footerLoader}>
                <ActivityIndicator size="small" color="#5D6AD1" />
              </View>
            ) : null
          }
        />
      )}

      {/* BATCH ACTIONS STICKY FOOTER */}
      {selectedIds.length > 0 && (
        <View style={localStyles.batchFooter}>
          <Text style={localStyles.batchFooterText}>
            {selectedIds.length} Selected
          </Text>
          <View style={localStyles.batchFooterBtns}>
            {permissions.includes('Revert to Live Leads') && (
              <TouchableOpacity
                onPress={() => {
                  setLeadId(null);
                  setMoveModalVisible(true);
                }}
                style={localStyles.batchBtnOutline}
              >
                <Icon name="refresh-outline" size={16} color="#5D6AD1" />
                <Text style={localStyles.batchBtnOutlineText}>Revert</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setLeadId(null);
                setDeleteModalVisible(true);
              }}
              style={localStyles.batchBtnSolid}
            >
              <Icon name="trash-outline" size={16} color="#FFFFFF" />
              <Text style={localStyles.batchBtnSolidText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FILTER SEARCH OPTION BOTTOM SHEET */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
          style={localStyles.modalOverlay}
        >
          <View style={localStyles.bottomSheetContainer}>
            <View style={localStyles.modalDragHandle} />
            <Text style={localStyles.modalTitle}>Search Filter Option</Text>

            {[
              { id: 1, label: 'Search by Mobile' },
              { id: 2, label: 'Search by Name' },
              { id: 3, label: 'Search by Email' },
              { id: 4, label: 'Search by Course' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={localStyles.radioOption}
                onPress={() => {
                  setFilterType(opt.id);
                  setSearch('');
                  dispatch(
                    storeJunkLeadFilterValues({
                      filterType: opt.id,
                      searchValue: '',
                    }),
                  );
                  setFilterModalVisible(false);
                  fetchLeads(1, true, '');
                }}
              >
                <Icon
                  name={
                    filterType === opt.id
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={20}
                  color="#5D6AD1"
                />
                <Text style={localStyles.radioLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* REVERT/MOVE CONFIRMATION DIALOG */}
      <Modal
        visible={moveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setMoveModalVisible(false);
          setLeadId(null);
        }}
      >
        <View style={localStyles.modalOverlayBg}>
          <View style={localStyles.dialogBox}>
            <View style={localStyles.modalIconContainer}>
              <Icon name="refresh-circle-outline" size={40} color="#5D6AD1" />
            </View>
            <Text style={localStyles.dialogTitle}>Move to Live Lead</Text>
            <Text style={localStyles.dialogSubTitle}>
              Are you sure want to move the Leads to Live Leads?
            </Text>
            <View style={localStyles.dialogButtons}>
              <TouchableOpacity
                onPress={() => {
                  setMoveModalVisible(false);
                  setLeadId(null);
                }}
                style={localStyles.dialogCancelBtn}
              >
                <Text style={localStyles.dialogCancelBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={buttonLoading}
                onPress={handleRevertSubmit}
                style={[
                  localStyles.dialogSaveBtn,
                  buttonLoading && { opacity: 0.7 },
                ]}
              >
                {buttonLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={localStyles.dialogSaveBtnText}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PERMANENT DELETION CONFIRMATION DIALOG */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setLeadId(null);
        }}
      >
        <View style={localStyles.modalOverlayBg}>
          <View style={localStyles.dialogBox}>
            <View style={localStyles.modalIconContainer}>
              <Icon name="trash-bin-outline" size={40} color="#D32F2F" />
            </View>
            <Text style={localStyles.dialogTitle}>Delete Lead</Text>
            <Text style={localStyles.dialogSubTitle}>
              Are you sure want to delete the Lead?
            </Text>
            <View style={localStyles.dialogButtons}>
              <TouchableOpacity
                onPress={() => {
                  setDeleteModalVisible(false);
                  setLeadId(null);
                }}
                style={localStyles.dialogCancelBtn}
              >
                <Text style={localStyles.dialogCancelBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={buttonLoading}
                onPress={handleDeleteSubmit}
                style={[
                  localStyles.dialogSaveBtn,
                  { backgroundColor: '#D32F2F' },
                  buttonLoading && { opacity: 0.7 },
                ]}
              >
                {buttonLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={localStyles.dialogSaveBtnText}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    justifyContent: 'center',
    marginRight: 12,
  },
  cardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  slNoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ECEFF1',
    marginRight: 6,
  },
  slNoText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#455A64',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F5F7FA',
  },
  dateText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#667C94',
    marginLeft: 3,
  },
  linkText: {
    color: '#5D6AD1',
    textDecorationLine: 'underline',
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFEBEE',
    paddingTop: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  batchFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  batchFooterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  batchFooterBtns: {
    flexDirection: 'row',
  },
  batchBtnOutline: {
    borderWidth: 1,
    borderColor: '#5D6AD1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  batchBtnOutlineText: {
    color: '#5D6AD1',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  batchBtnSolid: {
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchBtnSolidText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  radioLabel: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 12,
  },
  modalOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  dialogSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  dialogButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginRight: 8,
  },
  dialogCancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  dialogSaveBtn: {
    flex: 1,
    backgroundColor: '#5D6AD1',
    borderRadius: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dialogSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Junk;
