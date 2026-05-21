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
  Switch,
  ScrollView,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonMessage } from '../../Common/CommonMessage';
import { addressValidator, formatToBackendIST } from '../../Common/Validation';
import {
  getWebsiteLead,
  assignLiveLead,
  manualAssign,
  updateJunkValue,
  getPageColumns,
  updatePageColumns,
  getAllDownlineUsers,
} from '../../ApiService/action';
import styles from './LeadManagerstyles';
import CommonTextArea from '../../Common/CommonTextArea';

const LiveLeads = ({ isSubView, isActive }) => {
  const navigation = useNavigation();

  // Redux store integration
  const permissions = useSelector(state => state.userpermissions || []);

  // Screen State
  const [loginUser, setLoginUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  // Counts state
  const [counts, setCounts] = useState({
    online_count: 0,
    classroom_count: 0,
    corporate_count: 0,
  });

  // Filter & Search Config
  const [filterType, setFilterType] = useState(1); // 1: Mobile (Default), 2: Name, 3: Email, 4: Course
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Column Customization Visibility
  const [visibleColumns, setVisibleColumns] = useState([
    'Email',
    'Location',
    'Origin',
    'Training Mode',
  ]);

  // Expandable comments
  const [expandedComments, setExpandedComments] = useState([]);

  // Batch actions / Multi-select
  const [selectedIds, setSelectedIds] = useState([]);

  // Pick Lead loading state per-item
  const [pickingLeadId, setPickingLeadId] = useState(null);

  // Junk Modal State
  const [junkModalVisible, setJunkModalVisible] = useState(false);
  const [junkReason, setJunkReason] = useState('');
  const [junkReasonError, setJunkReasonError] = useState('');
  const [junkLeadIds, setJunkLeadIds] = useState([]);
  const [junkLoading, setJunkLoading] = useState(false);

  // Downlines / Assignment Modal State
  const [downlines, setDownlines] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignLeadIds, setAssignLeadIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const isFetchingRef = useRef(false);

  // Initialize and load storage values
  useEffect(() => {
    const initStorage = async () => {
      try {
        const detailsStr = await AsyncStorage.getItem('loginUserDetails');
        if (detailsStr) {
          const details = JSON.parse(detailsStr);
          setLoginUser(details);
          fetchColumns(details.user_id || details.id);
        }
      } catch (err) {
        console.error('Error fetching login details', err);
      }
    };
    initStorage();
  }, []);

  // Fetch Downline Users
  useEffect(() => {
    const fetchDownlineData = async () => {
      const userId = loginUser?.user_id || loginUser?.id;
      if (!userId) return;
      try {
        const res = await getAllDownlineUsers(userId);
        setDownlines(res?.data?.data || []);
      } catch (err) {
        console.log('Error fetching downlines:', err);
      }
    };
    if (loginUser) {
      fetchDownlineData();
    }
  }, [loginUser]);

  // Bind WebSocket trigger
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'refreshLiveLeads',
      data => {
        console.log('refreshLiveLeads event received', data);

        onRefresh?.(true);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [onRefresh]);

  // Fetch visible columns configuration
  const fetchColumns = async userId => {
    if (!userId) return;
    try {
      const res = await getPageColumns(userId);
      const cols = res?.data?.data?.column_names || res?.data?.data || [];
      if (Array.isArray(cols) && cols.length > 0) {
        setVisibleColumns(cols);
      }
    } catch (err) {
      console.log('Error fetching columns:', err);
    }
  };

  // Save/Update page columns configuration
  const handleSaveColumns = async newCols => {
    const userId = loginUser?.user_id || loginUser?.id;
    if (!userId) return;
    try {
      const payload = {
        user_id: userId,
        page_name: 'Live Leads',
        column_names: newCols,
      };
      await updatePageColumns(payload);
      setVisibleColumns(newCols);
      CommonMessage('success', 'Columns updated successfully');
    } catch (err) {
      console.error('Error updating columns:', err);
      CommonMessage('error', 'Failed to update columns');
    }
  };

  // Main Fetch Live Leads logic
  const fetchLeads = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      const userId = loginUser?.user_id || loginUser?.id;
      if (!userId) return;

      if (isFetchingRef.current && !isRefresh) return;
      isFetchingRef.current = true;
      setLoading(true);

      try {
        const payload = {
          region_type: userId,
          page: pageNum,
          limit: 10,
          ...(search && filterType === 1 ? { phone: search } : {}),
          ...(search && filterType === 2 ? { name: search } : {}),
          ...(search && filterType === 3 ? { email: search } : {}),
          ...(search && filterType === 4 ? { course: search } : {}),
        };

        const response = await getWebsiteLead(payload);
        const newLeads = response?.data?.data?.data || [];
        const leadCounts = response?.data?.data?.lead_count || {
          online_count: 0,
          classroom_count: 0,
          corporate_count: 0,
        };

        if (isRefresh) {
          setLeads(newLeads);
        } else {
          setLeads(prev => [...prev, ...newLeads]);
        }

        setCounts(leadCounts);
        setPage(pageNum);
        setHasMore(newLeads.length === 10);
      } catch (error) {
        console.error('Error fetching live leads:', error);
        CommonMessage('error', 'Failed to fetch live leads');
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [loginUser, search, filterType],
  );

  const onRefresh = useCallback(
    (is_from_notificationContext = false) => {
      setRefreshing(is_from_notificationContext ? false : true);
      fetchLeads(1, true);
    },
    [fetchLeads],
  );

  // Auto-refresh when tab becomes active
  useEffect(() => {
    if (isActive && loginUser) {
      fetchLeads(1, true);
    }
  }, [isActive, loginUser, fetchLeads]);

  // Screen focus listener
  useFocusEffect(
    useCallback(() => {
      if (loginUser) {
        fetchLeads(1, true);
      }
    }, [loginUser, fetchLeads]),
  );

  const loadMore = () => {
    if (hasMore && !loading && leads.length > 0) {
      fetchLeads(page + 1);
    }
  };

  const handleSearchChange = text => {
    setSearch(text);
    if (text.length === 0) {
      fetchLeads(1, true);
    }
  };

  // Timezone-aware elapsed time calculator (UTC to IST conditional)
  const getElapsedTime = createdDate => {
    if (!createdDate) return { label: '0h:0m', ageHours: 0 };
    let createdMoment;
    if (createdDate.includes('Z') || createdDate.includes('+')) {
      createdMoment = moment(createdDate);
    } else {
      // Treats naive string as UTC, formats to local IST (+5:30 offset)
      createdMoment = moment.utc(createdDate).local();
    }

    const now = moment();
    const diffMs = Math.max(0, now.diff(createdMoment));
    const duration = moment.duration(diffMs);
    const totalHours = duration.asHours();

    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    let label = '';
    if (days > 0) {
      label = `${days}d:${hours}h:${minutes}m`;
    } else {
      label = `${hours}h:${minutes}m`;
    }
    return { label, ageHours: totalHours };
  };

  const getElapsedColor = ageHours => {
    if (ageHours <= 1) {
      return { bg: '#E8F5E9', text: '#2E7D32' }; // <= 1h Light Green
    } else if (ageHours <= 24) {
      return { bg: '#FFF3E0', text: '#E65100' }; // 1h < age <= 24h Orange
    }
    return { bg: '#FFEBEE', text: '#C62828' }; // > 24h Red
  };

  const getTrainingModeStyles = mode => {
    const formatMode = String(mode || '').toLowerCase();
    if (formatMode === 'online') {
      return { bg: '#E8F5E9', text: '#2E7D32' };
    } else if (formatMode === 'classroom') {
      return { bg: '#E3F2FD', text: '#1565C0' };
    } else if (formatMode === 'corporate') {
      return { bg: '#ECEFF1', text: '#455A64' };
    }
    return { bg: '#F5F7FA', text: '#667C94' };
  };

  // Multi-select actions
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
    } else {
      toggleComments(item.id);
    }
  };

  const toggleComments = id => {
    setExpandedComments(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Pick Lead Action API trigger
  const handlePickLead = async lead => {
    const userId = loginUser?.user_id || loginUser?.id;
    if (!userId) return;

    setPickingLeadId(lead.id);
    try {
      const payload = {
        user_id: userId,
        lead_id: lead.id,
        is_assigned: true,
      };
      await assignLiveLead(payload);
      // CommonMessage('success', 'Lead picked successfully!');

      // Navigate to AddLead screen and pass details
      navigation.navigate('AddLead', { lead: lead, isFromLiveLeads: true });
      onRefresh();
    } catch (err) {
      console.error(err);
      CommonMessage(
        'error',
        err?.response?.data?.message || 'Failed to pick lead',
      );
    } finally {
      setPickingLeadId(null);
    }
  };

  // Junk Action Modal operations
  const openJunkModal = ids => {
    setJunkLeadIds(ids);
    setJunkReason('');
    setJunkReasonError('');
    setJunkModalVisible(true);
  };

  const handleJunkSubmit = async () => {
    const junkReasonValidate = addressValidator(junkReason);
    setJunkReasonError(junkReasonValidate);
    if (junkReasonValidate) return;

    setJunkLoading(true);
    try {
      const payload = {
        lead_ids: junkLeadIds,
        is_junk: true,
        reason: junkReason,
      };
      await updateJunkValue(payload);
      CommonMessage('success', 'Lead(s) moved to junk');
      setJunkModalVisible(false);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      console.error(err);
      CommonMessage('error', 'Failed to move lead(s) to junk');
    } finally {
      setJunkLoading(false);
    }
  };

  // Downlines Assignment Modal operations
  const openAssignModal = ids => {
    setAssignLeadIds(ids);
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async targetUserId => {
    const userId = loginUser?.user_id || loginUser?.id;
    if (!userId) return;
    setAssignLoading(true);
    try {
      const payload = {
        user_id: targetUserId,
        assigned_by: userId,
        lead_ids: assignLeadIds,
        is_assigned: true,
        assigned_date: formatToBackendIST(new Date()),
      };
      await manualAssign(payload);
      CommonMessage('success', 'Leads assigned successfully!');
      setAssignModalVisible(false);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      console.error(err);
      CommonMessage('error', 'Failed to assign leads');
    } finally {
      setAssignLoading(false);
    }
  };

  // Render individual lead card
  const renderLeadCard = ({ item }) => {
    const elapsed = getElapsedTime(item.created_date);
    const elapsedColors = getElapsedColor(elapsed.ageHours);
    const trainingModeStyles = getTrainingModeStyles(item.training_mode);
    const isNewLead = item.lead_type === 'New' || item.lead_type === null;
    const isCardSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleCardPress(item)}
        onLongPress={() => toggleSelectCard(item.id)}
        style={[styles.card, isCardSelected && localStyles.cardSelected]}
      >
        {/* Checkbox / Selection indicators */}
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
              {/* New/Existing Badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isNewLead ? '#E3F2FD' : '#FFEBEE',
                    marginRight: 6,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: isNewLead ? '#1565C0' : '#d32f2f' },
                  ]}
                >
                  {isNewLead ? 'New' : 'Existing'}
                </Text>
              </View>

              {/* Elapsed Time Pill */}
              <View
                style={[
                  localStyles.elapsedBadge,
                  { backgroundColor: elapsedColors.bg },
                ]}
              >
                <Text
                  style={[
                    localStyles.elapsedText,
                    { color: elapsedColors.text },
                  ]}
                >
                  {elapsed.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Card Body details */}
          <View style={styles.cardBody}>
            {/* Course */}
            <View style={styles.detailRow}>
              <Icon name="book-outline" size={14} color="#667C94" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.course || 'No course specified'}
              </Text>
            </View>

            {/* Email (Conditional on Manage Columns) */}
            {visibleColumns.includes('Email') && item.email && (
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

            {/* Mobile / Dial clickable */}
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

            {/* Location (Conditional on Manage Columns) */}
            {visibleColumns.includes('Location') && item.location && (
              <View style={styles.detailRow}>
                <Icon name="location-outline" size={14} color="#667C94" />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
            )}

            {/* Training Mode (Conditional on Manage Columns) */}
            {visibleColumns.includes('Training Mode') && item.training_mode && (
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
                    {item.training_mode}
                  </Text>
                </View>
              </View>
            )}

            {/* Domain Origin (Conditional on Column & Permission check) */}
            {permissions.includes('Show Origin in Live Leads') &&
              item.domain_origin && (
                <View style={styles.detailRow}>
                  <Icon name="globe-outline" size={14} color="#667C94" />
                  <Text style={styles.detailText}>
                    {item.domain_origin || item.source_origin}
                  </Text>
                </View>
              )}

            {/* Expandable comments toggle */}
            {item.comments && (
              // <View style={localStyles.commentWrapper}>
              //   <TouchableOpacity
              //     onPress={() => toggleComments(item.id)}
              //     style={localStyles.commentsToggleRow}
              //   >
              //     <Text style={localStyles.commentsToggleText}>
              //       {expandedComments.includes(item.id)
              //         ? 'Hide Comments'
              //         : 'Show Comments'}
              //     </Text>
              //     <Icon
              //       name={
              //         expandedComments.includes(item.id)
              //           ? 'chevron-up'
              //           : 'chevron-down'
              //       }
              //       size={14}
              //       color="#5D6AD1"
              //     />
              //   </TouchableOpacity>
              //   {expandedComments.includes(item.id) && (
              //     <View style={localStyles.commentsBox}>
              //       <Text style={localStyles.commentsText}>
              //         {item.comments}
              //       </Text>
              //     </View>
              //   )}
              // </View>
              <Text
                style={[
                  styles.detailText,
                  { fontStyle: 'italic', flex: 1, marginTop: 6 },
                ]}
                numberOfLines={1}
              >
                Comment: {item.comments || 'No comments'}
              </Text>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.cardFooter}>
            {/* Pick Lead Action */}
            <TouchableOpacity
              disabled={pickingLeadId !== null}
              onPress={() => handlePickLead(item)}
              style={[
                styles.actionButton,
                pickingLeadId !== null && pickingLeadId !== item.id
                  ? { opacity: 0.5 }
                  : {},
              ]}
            >
              {pickingLeadId === item.id ? (
                <ActivityIndicator
                  size="small"
                  color="#5D6AD1"
                  style={{ marginRight: 6 }}
                />
              ) : (
                <Icon name="hand-left-outline" size={18} color="#5D6AD1" />
              )}

              <Text style={styles.actionText}>Pick Lead</Text>
            </TouchableOpacity>

            {/* Move to Junk */}
            <TouchableOpacity
              onPress={() => openJunkModal([item.id])}
              style={styles.actionButton}
            >
              <Icon name="trash-outline" size={18} color="#E74C3C" />
              <Text style={[styles.actionText, { color: '#E74C3C' }]}>
                Junk
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
      {/* Sticky Header Section */}
      <View style={localStyles.stickyHeader}>
        {/* Today's Summary Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.summaryScroll}
        >
          {/* Online count */}
          <View style={localStyles.summaryCard}>
            <View
              style={[localStyles.summaryDot, { backgroundColor: '#3c9111' }]}
            />
            <Text style={localStyles.summaryTitle}>Online</Text>
            <Text style={localStyles.summaryVal}>
              {counts.online_count || 0}
            </Text>
          </View>

          {/* Classroom count */}
          <View style={localStyles.summaryCard}>
            <View
              style={[localStyles.summaryDot, { backgroundColor: '#1e90ff' }]}
            />
            <Text style={localStyles.summaryTitle}>Classroom</Text>
            <Text style={localStyles.summaryVal}>
              {counts.classroom_count || 0}
            </Text>
          </View>

          {/* Corporate count */}
          <View style={localStyles.summaryCard}>
            <View
              style={[localStyles.summaryDot, { backgroundColor: '#607d8b' }]}
            />
            <Text style={localStyles.summaryTitle}>Corporate</Text>
            <Text style={localStyles.summaryVal}>
              {counts.corporate_count || 0}
            </Text>
          </View>

          {/* Total Sum */}
          <View style={localStyles.summaryCard}>
            <View
              style={[localStyles.summaryDot, { backgroundColor: '#5b69ca' }]}
            />
            <Text style={localStyles.summaryTitle}>Total</Text>
            <Text style={localStyles.summaryVal}>
              {Number(counts?.online_count || 0) +
                Number(counts?.classroom_count || 0) +
                Number(counts?.corporate_count || 0)}
            </Text>
          </View>
        </ScrollView>

        {/* Search & Action filters */}
        <View style={{ paddingHorizontal: 16 }}>
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

            {/* Filter options modal switch */}
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setFilterModalVisible(true)}
            >
              <Icon name="filter" size={20} color="#5D6AD1" />
            </TouchableOpacity>
          </View>
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
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#5D6AD1']}
            />
          }
          ListFooterComponent={
            leads.length > 0 && loading ? (
              <View style={localStyles.footerLoader}>
                <ActivityIndicator size="small" color="#5D6AD1" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={localStyles.emptyContainer}>
              <Icon name="documents-outline" size={40} color="#A0AEC0" />
              <Text style={localStyles.emptyText}>No live leads available</Text>
            </View>
          }
        />
      )}

      {/* Batch footer actions overlay */}
      {selectedIds.length > 0 && (
        <View style={localStyles.batchFooter}>
          <Text style={localStyles.batchFooterText}>
            {selectedIds.length} Selected
          </Text>
          <View style={localStyles.batchFooterBtns}>
            {/* {permissions.includes('Assign Lead') && (
              <TouchableOpacity
                onPress={() => openAssignModal(selectedIds)}
                style={localStyles.batchBtnOutline}
              >
                <Icon name="person-add-outline" size={16} color="#5D6AD1" />
                <Text style={localStyles.batchBtnOutlineText}>Assign</Text>
              </TouchableOpacity>
            )} */}
            <TouchableOpacity
              onPress={() => openJunkModal(selectedIds)}
              style={localStyles.batchBtnSolid}
            >
              <Icon name="trash-outline" size={16} color="#FFFFFF" />
              <Text style={localStyles.batchBtnSolidText}>Junk</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FILTER OPTION Bottom Sheet (Modal implementation) */}
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
                  setFilterModalVisible(false);
                  fetchLeads(1, true);
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

      {/* MOVE TO JUNK Comment input Modal */}
      <Modal
        visible={junkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!junkLoading) setJunkModalVisible(false);
        }}
      >
        <View style={localStyles.modalOverlayBg}>
          <View style={localStyles.dialogBox}>
            <Text style={localStyles.dialogTitle}>Move to Junk</Text>
            <Text style={localStyles.dialogSubTitle}>
              Please input the reason or comment for junking lead(s):
            </Text>

            <CommonTextArea
              label={'Comments'}
              placeholder="Input reason here..."
              style={localStyles.modalInput}
              value={junkReason}
              onChangeText={value => {
                setJunkReason(value);
                setJunkReasonError(addressValidator(value));
              }}
              error={junkReasonError}
            />

            <View style={localStyles.dialogButtons}>
              <TouchableOpacity
                disabled={junkLoading}
                onPress={() => setJunkModalVisible(false)}
                style={localStyles.dialogCancelBtn}
              >
                <Text style={localStyles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={junkLoading}
                onPress={handleJunkSubmit}
                style={localStyles.dialogSaveBtn}
              >
                {junkLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={localStyles.dialogSaveBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN LEADS Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!assignLoading) setAssignModalVisible(false);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          disabled={assignLoading}
          onPress={() => setAssignModalVisible(false)}
          style={localStyles.modalOverlay}
        >
          <View style={localStyles.bottomSheetContainerLarge}>
            <View style={localStyles.modalDragHandle} />
            <Text style={localStyles.modalTitle}>Assign Leads</Text>
            <Text style={localStyles.modalSubTitle}>
              Select a downline user to assign leads
            </Text>

            {assignLoading ? (
              <View style={localStyles.centeredSmall}>
                <ActivityIndicator size="large" color="#5D6AD1" />
              </View>
            ) : (
              <FlatList
                data={downlines}
                keyExtractor={item => item.user_id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                  <Text style={localStyles.emptyDownline}>
                    No downline users available
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleAssignSubmit(item.user_id)}
                    style={localStyles.downlineItem}
                  >
                    <Icon
                      name="person-circle-outline"
                      size={32}
                      color="#5D6AD1"
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={localStyles.downlineName}>
                        {item.username || item.name}
                      </Text>
                      <Text style={localStyles.downlineSub}>
                        {item.role_name || 'Downline User'}
                      </Text>
                    </View>
                    <Icon
                      name="chevron-forward"
                      size={16}
                      color="#A0AEC0"
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
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
  summaryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 8,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredSmall: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignRight: 10,
    marginRight: 12,
  },
  cardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  elapsedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  elapsedText: {
    fontSize: 9,
    fontWeight: 'bold',
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
  commentWrapper: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  commentsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsToggleText: {
    fontSize: 12,
    color: '#5D6AD1',
    fontWeight: '500',
    marginRight: 4,
  },
  commentsBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentsText: {
    fontSize: 12,
    color: '#475569',
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
  bottomSheetContainerLarge: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    height: '60%',
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
  modalSubTitle: {
    fontSize: 13,
    color: '#64748B',
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
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  dialogSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  dialogCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  dialogCancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  dialogSaveBtn: {
    backgroundColor: '#5D6AD1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  dialogSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#334155',
    textAlignVertical: 'top',
    height: 80,
  },
  emptyDownline: {
    textAlign: 'center',
    color: '#94A3B8',
    paddingVertical: 30,
  },
  downlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  downlineName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  downlineSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default LiveLeads;
