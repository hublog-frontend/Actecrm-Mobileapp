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
import { useTheme } from '../../Context/ThemeContext';

const Junk = ({ isSubView, isActive, setJunkLeadCount }) => {
  const { theme } = useTheme();
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
        style={[
          styles.card,
          { backgroundColor: theme.surface },
          isCardSelected && {
            backgroundColor: theme.primaryLight,
            borderColor: theme.primary,
            borderWidth: 1,
          },
        ]}
      >
        {selectedIds.length > 0 && (
          <View style={localStyles.checkboxContainer}>
            <Icon
              name={isCardSelected ? 'checkbox' : 'square-outline'}
              size={22}
              color={theme.primary}
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text
              style={[styles.name, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  localStyles.slNoBadge,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Text
                  style={[localStyles.slNoText, { color: theme.textSecondary }]}
                >
                  Sl. No: {slNo}
                </Text>
              </View>
              <View
                style={[
                  localStyles.dateBadge,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Icon
                  name="calendar-outline"
                  size={10}
                  color={theme.textSecondary}
                />
                <Text
                  style={[localStyles.dateText, { color: theme.textSecondary }]}
                >
                  {moment(item.created_date).format('MM/DD/YYYY')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.detailRow}>
              <Icon name="book-outline" size={14} color={theme.textSecondary} />
              <Text
                style={[styles.detailText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {item.course || 'No course specified'}
              </Text>
            </View>
            {item.email && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${item.email}`)}
                style={styles.detailRow}
              >
                <Icon name="mail-outline" size={14} color={theme.primary} />
                <Text
                  style={[
                    styles.detailText,
                    { color: theme.primary, textDecorationLine: 'underline' },
                  ]}
                  selectable={true}
                >
                  {item.email}
                </Text>
              </TouchableOpacity>
            )}
            {item.phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
                style={styles.detailRow}
              >
                <Icon name="call-outline" size={14} color={theme.primary} />
                <Text
                  style={[
                    styles.detailText,
                    { color: theme.primary, textDecorationLine: 'underline' },
                  ]}
                  selectable={true}
                >
                  {item.phone}
                </Text>
              </TouchableOpacity>
            )}
            {item.location && (
              <View style={styles.detailRow}>
                <Icon
                  name="location-outline"
                  size={14}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.detailText, { color: theme.textSecondary }]}
                >
                  {item.location}
                </Text>
              </View>
            )}
            {(item.training || item.training_mode) && (
              <View style={styles.detailRow}>
                <Icon
                  name="ribbon-outline"
                  size={14}
                  color={theme.textSecondary}
                />
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
            {item.comments && (
              <View
                style={[
                  localStyles.notesContainer,
                  { marginTop: 6, borderTopColor: theme.borderLight },
                ]}
              >
                <Icon
                  name="chatbox-ellipses-outline"
                  size={13}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.detailText,
                    {
                      color: theme.textSecondary,
                      fontStyle: 'italic',
                      flex: 1,
                    },
                  ]}
                  numberOfLines={2}
                >
                  Comment: {item.comments}
                </Text>
              </View>
            )}
            {item.junk_reason && (
              <View
                style={[
                  localStyles.reasonContainer,
                  { marginTop: 6, borderTopColor: '#FFEBEE' },
                ]}
              >
                <Icon name="warning-outline" size={13} color={theme.error} />
                <Text
                  style={[
                    styles.detailText,
                    { color: theme.error, fontWeight: '500', flex: 1 },
                  ]}
                  numberOfLines={2}
                >
                  Junk Reason: {item.junk_reason}
                </Text>
              </View>
            )}
          </View>
          <View
            style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}
          >
            {permissions.includes('Revert to Live Leads') ? (
              <TouchableOpacity
                onPress={() => {
                  setLeadId(item.id);
                  setMoveModalVisible(true);
                }}
                style={styles.actionButton}
              >
                <Icon name="refresh-outline" size={18} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>
                  Revert
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity
              onPress={() => {
                setLeadId(item.id);
                setDeleteModalVisible(true);
              }}
              style={styles.actionButton}
            >
              <Icon name="trash-outline" size={18} color={theme.error} />
              <Text style={[styles.actionText, { color: theme.error }]}>
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
        { backgroundColor: theme.background },
        isSubView && { backgroundColor: 'transparent' },
      ]}
    >
      {/* Search Header */}
      <View
        style={[
          localStyles.stickyHeader,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
                borderWidth: 0.5,
              },
            ]}
          >
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={
                filterType === 1
                  ? 'Search By Mobile...'
                  : filterType === 2
                  ? 'Search By Name...'
                  : filterType === 3
                  ? 'Search By Email...'
                  : 'Search By Course...'
              }
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={() => fetchLeads(1, true)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <Icon name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setFilterModalVisible(true)}
            >
              <Icon name="filter" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ backgroundColor: theme.surface, paddingTop: 10 }}>
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

      {loading && leads.length === 0 ? (
        <View style={localStyles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
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
              <Icon name="trash-bin-outline" size={48} color={theme.border} />
              <Text style={[localStyles.emptyText, { color: theme.textMuted }]}>
                No junk leads found
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && leads.length > 0 ? (
              <View style={localStyles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* BATCH ACTIONS FOOTER */}
      {selectedIds.length > 0 && (
        <View
          style={[
            localStyles.batchFooter,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <Text
            style={[localStyles.batchFooterText, { color: theme.textPrimary }]}
          >
            {selectedIds.length} Selected
          </Text>
          <View style={localStyles.batchFooterBtns}>
            {permissions.includes('Revert to Live Leads') && (
              <TouchableOpacity
                onPress={() => {
                  setLeadId(null);
                  setMoveModalVisible(true);
                }}
                style={[
                  localStyles.batchBtnOutline,
                  { borderColor: theme.primary },
                ]}
              >
                <Icon name="refresh-outline" size={16} color={theme.primary} />
                <Text
                  style={[
                    localStyles.batchBtnOutlineText,
                    { color: theme.primary },
                  ]}
                >
                  Revert
                </Text>
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

      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
          style={[localStyles.modalOverlay, { backgroundColor: theme.overlay }]}
        >
          <View
            style={[
              localStyles.bottomSheetContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <View
              style={[
                localStyles.modalDragHandle,
                { backgroundColor: theme.border },
              ]}
            />
            <Text
              style={[localStyles.modalTitle, { color: theme.textPrimary }]}
            >
              Search Filter Option
            </Text>
            {[
              { id: 1, label: 'Search by Mobile' },
              { id: 2, label: 'Search by Name' },
              { id: 3, label: 'Search by Email' },
              { id: 4, label: 'Search by Course' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  localStyles.radioOption,
                  { borderBottomColor: theme.borderLight },
                ]}
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
                  color={theme.primary}
                />
                <Text
                  style={[localStyles.radioLabel, { color: theme.textPrimary }]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* REVERT MODAL */}
      <Modal
        visible={moveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setMoveModalVisible(false);
          setLeadId(null);
        }}
      >
        <View
          style={[
            localStyles.modalOverlayBg,
            { backgroundColor: theme.overlay },
          ]}
        >
          <View
            style={[localStyles.dialogBox, { backgroundColor: theme.surface }]}
          >
            <View style={localStyles.modalIconContainer}>
              <Icon
                name="refresh-circle-outline"
                size={40}
                color={theme.primary}
              />
            </View>
            <Text
              style={[localStyles.dialogTitle, { color: theme.textPrimary }]}
            >
              Move to Live Lead
            </Text>
            <Text
              style={[
                localStyles.dialogSubTitle,
                { color: theme.textSecondary },
              ]}
            >
              Are you sure want to move the Leads to Live Leads?
            </Text>
            <View style={localStyles.dialogButtons}>
              <TouchableOpacity
                onPress={() => {
                  setMoveModalVisible(false);
                  setLeadId(null);
                }}
                style={[
                  localStyles.dialogCancelBtn,
                  { borderColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    localStyles.dialogCancelBtnText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={buttonLoading}
                onPress={handleRevertSubmit}
                style={[
                  localStyles.dialogSaveBtn,
                  { backgroundColor: theme.primary },
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

      {/* DELETE MODAL */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setLeadId(null);
        }}
      >
        <View
          style={[
            localStyles.modalOverlayBg,
            { backgroundColor: theme.overlay },
          ]}
        >
          <View
            style={[localStyles.dialogBox, { backgroundColor: theme.surface }]}
          >
            <View style={localStyles.modalIconContainer}>
              <Icon name="trash-bin-outline" size={40} color={theme.error} />
            </View>
            <Text
              style={[localStyles.dialogTitle, { color: theme.textPrimary }]}
            >
              Delete Lead
            </Text>
            <Text
              style={[
                localStyles.dialogSubTitle,
                { color: theme.textSecondary },
              ]}
            >
              Are you sure want to delete the Lead?
            </Text>
            <View style={localStyles.dialogButtons}>
              <TouchableOpacity
                onPress={() => {
                  setDeleteModalVisible(false);
                  setLeadId(null);
                }}
                style={[
                  localStyles.dialogCancelBtn,
                  { borderColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    localStyles.dialogCancelBtnText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={buttonLoading}
                onPress={handleDeleteSubmit}
                style={[
                  localStyles.dialogSaveBtn,
                  { backgroundColor: theme.error },
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
