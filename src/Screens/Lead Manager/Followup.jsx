import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../Context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import styles from './LeadManagerstyles';
import {
  getLeadFollowUps,
  updateFollowUp,
  getAllDownlineUsers,
} from '../../ApiService/action';
import {
  storeFollowUpFilterValues,
  storeFollowupStatusCounts,
} from '../../Redux/Slice';
import { CommonMessage } from '../../Common/CommonMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonMuiCustomDatePicker from '../../Common/CommonMuiCustomDatePicker';
import GlobalSearchHeader from '../../Common/GlobalSearchHeader';
import { formatToBackendIST } from '../../Common/Validation';

const Followup = ({ isSubView }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const filterValuesFromRedux = useSelector(
    state => state.followupfiltervalues,
  );
  const statusCountsFromRedux = useSelector(
    state => state.followupstatuscounts,
  );

  const [isFocused, setIsFocused] = useState(false);
  const [followUpData, setFollowUpData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allDownliners, setAllDownliners] = useState([]);
  const [followupCount, setFollowupCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const followupSheetRef = useRef(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [comment, setComment] = useState('');
  const [nextDate, setNextDate] = useState(new Date());
  const [actionId, setActionId] = useState(1);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filterType, setFilterType] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const actionOptions = [
    { id: 1, name: 'Hot Follow Up' },
    { id: 7, name: 'Cold Follow Up' },
    { id: 8, name: 'Interested' },
    { id: 9, name: 'Only Enquiry' },
    { id: 10, name: 'Hold' },
    { id: 11, name: 'No Response' },
    { id: 6, name: 'Others' },
  ];

  const getRecommendedDates = () => {
    const today = moment().startOf('day');
    let dates = [
      today.clone(),
      today.clone().add(1, 'days'),
      today.clone().add(3, 'days'),
      today.clone().add(5, 'days'),
      today.clone().add(7, 'days'),
    ];

    // Replace Sunday with Monday
    return dates.map(d => {
      if (d.day() === 0) {
        return d.add(1, 'days');
      }
      return d;
    });
  };

  const recommendedDates = getRecommendedDates();

  const isDateAllowed = date => {
    return recommendedDates.some(d => d.isSame(moment(date), 'day'));
  };

  // Logic: Get Downline Users first, then fetch Follow-ups
  const getAllDownlineUsersData = useCallback(
    async user_id => {
      try {
        const response = await getAllDownlineUsers(user_id);
        const downliners = response?.data?.data || [];
        const downliners_ids = downliners.map(u => u.user_id);
        setAllDownliners(downliners_ids);
        const followUpFilterValues = {
          searchValue: null,
          filterType: 1,
          start_date: moment().subtract(6, 'days').format('YYYY-MM-DD'),
          end_date: moment().format('YYYY-MM-DD'),
          user_id: null,
          status_id: null,
          status_name: null,
          pageNumber: 1,
          pageLimit: 10,
        };
        dispatch(storeFollowUpFilterValues(followUpFilterValues));
        getLeadFollowUpsData(
          null,
          followUpFilterValues.start_date,
          followUpFilterValues.end_date,
          downliners_ids,
          1,
          10,
          null,
        );
      } catch (error) {
        console.log('all downlines error', error);
      }
    },
    [filterValuesFromRedux, dispatch],
  );

  const getLeadFollowUpsData = async (
    searchvalue,
    startDate,
    endDate,
    downliners,
    pageNumber,
    limit,
    statusId,
    isAppend = false,
  ) => {
    setLoading(true);
    console.log(searchvalue, filterType);

    const payload = {
      ...(searchvalue && filterType == 1 ? { phone: searchvalue } : {}),
      ...(searchvalue && filterType == 2 ? { name: searchvalue } : {}),
      ...(searchvalue && filterType == 3 ? { email: searchvalue } : {}),
      ...(searchvalue && filterType == 4 ? { course: searchvalue } : {}),
      from_date: startDate,
      to_date: endDate,
      user_ids: downliners,
      page: pageNumber,
      limit: limit,
      lead_action_id: statusId,
    };

    try {
      const response = await getLeadFollowUps(payload);
      const followup_data = response?.data?.data?.data || [];
      const paginationData = response?.data?.data?.pagination || {};
      const statusCounts = response?.data?.data?.statusCounts || {};

      const requiredOrder = [
        'Hot Follow Up',
        'Cold Follow Up',
        'Interested',
        'Only Enquiry',
        'Hold',
        'No Response',
      ];

      const formattedData = requiredOrder.map(key => ({
        name: key,
        count: statusCounts[key] || 0,
        id: getStatusIdByName(key),
      }));

      dispatch(storeFollowupStatusCounts(formattedData));

      const updatedData = followup_data.map((item, index) => ({
        ...item,
        row_num: (pageNumber - 1) * limit + index + 1,
      }));

      if (isAppend) {
        setFollowUpData(prev => [...prev, ...updatedData]);
      } else {
        setFollowUpData(updatedData);
      }
      setFollowupCount(paginationData.total || 0);
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        totalPages: paginationData.totalPages,
      });

      dispatch(
        storeFollowUpFilterValues({
          pageNumber: paginationData.page,
          pageLimit: paginationData.limit,
        }),
      );
    } catch (error) {
      setFollowUpData([]);
      setFollowupCount(0);
      console.log('get followup error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIdByName = name => {
    switch (name) {
      case 'Hot Follow Up':
        return 1;
      case 'Cold Follow Up':
        return 7;
      case 'Interested':
        return 8;
      case 'Only Enquiry':
        return 9;
      case 'Hold':
        return 10;
      case 'No Response':
        return 11;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const getLoginUserDetails = await AsyncStorage.getItem(
        'loginUserDetails',
      );
      console.log('getLoginUserDetails', getLoginUserDetails);
      getLeadFollowUpsData(
        filterValuesFromRedux.searchValue,
        filterValuesFromRedux.start_date,
        filterValuesFromRedux.end_date,
        allDownliners,
        1,
        10,
        filterValuesFromRedux.status_id,
      );
    };
    fetchUserData();
  }, [
    filterValuesFromRedux.status_id,
    filterValuesFromRedux.start_date,
    filterValuesFromRedux.end_date,
    // filterType,
  ]);

  const handleSearch = text => {
    setSearchValue(text);
    if (text.length === 0) {
      getLeadFollowUpsData(
        '',
        filterValuesFromRedux.start_date,
        filterValuesFromRedux.end_date,
        allDownliners,
        1,
        10,
        filterValuesFromRedux.status_id,
        false,
      );
    }
  };

  const executeSearch = () => {
    getLeadFollowUpsData(
      searchValue,
      filterValuesFromRedux.start_date,
      filterValuesFromRedux.end_date,
      allDownliners,
      1,
      10,
      filterValuesFromRedux.status_id,
      false,
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const getLoginUserDetails = await AsyncStorage.getItem('loginUserDetails');
    if (getLoginUserDetails) {
      const convertAsJson = JSON.parse(getLoginUserDetails);
      getAllDownlineUsersData(convertAsJson?.user_id);
    } else {
      setRefreshing(false);
    }
  };

  const renderFollowupCard = ({ item }) => {
    const isOverdue = moment(item.next_follow_up_date).isBefore(
      moment(),
      'day',
    );

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={() => {
          console.log('selected lead item', item);
          setSelectedLead(item);
          setActionId(item.lead_action_id || 1);
          setNextDate(new Date());
          followupSheetRef.current?.expand();
        }}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.textPrimary }]}>
              {item.candidate_name}
            </Text>
            <Text style={{ fontSize: 10, color: theme.textSecondary }}>
              #{item.row_num}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.statusText, { color: '#1976D2' }]}>
              {item.action_name}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            Course: {item.primary_course}
          </Text>
          <View style={[styles.detailRow, { marginTop: 8 }]}>
            <Icon
              name="time-outline"
              size={14}
              color={isOverdue ? '#D32F2F' : theme.textSecondary}
            />
            <Text
              style={[
                styles.detailText,
                { color: theme.textSecondary },
                isOverdue && styles.overdueText,
              ]}
            >
              Next: {moment(item.next_follow_up_date).format('DD MMM YYYY')}
            </Text>
          </View>
        </View>

        <View
          style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}
        >
          <Text
            style={[
              styles.detailText,
              { color: theme.textSecondary, fontStyle: 'italic', flex: 1 },
            ]}
            numberOfLines={1}
          >
            Latest: {item.comments || 'No comments'}
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedLead(item);
              setActionId(item.lead_action_id || 1);
              setNextDate(new Date());
              followupSheetRef.current?.expand();
            }}
          >
            <Icon name="add-circle-outline" size={20} color={theme.primary} />
            <Text style={styles.actionText}>Update</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleNextPrev = direction => {
    const currentIndex = followUpData.findIndex(
      item => item.id === selectedLead.id,
    );
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < followUpData.length) {
      setSelectedLead(followUpData[newIndex]);
    }
  };

  const handleLoadMore = () => {
    if (
      !loading &&
      followUpData.length > 0 &&
      followUpData.length < followupCount
    ) {
      const nextPage = (filterValuesFromRedux.pageNumber || 1) + 1;
      const nextLimit = (filterValuesFromRedux.pageLimit || 10) + 10;
      dispatch(
        storeFollowUpFilterValues({
          pageNumber: nextPage,
          pageLimit: nextLimit,
        }),
      );

      getLeadFollowUpsData(
        filterValuesFromRedux.searchValue,
        filterValuesFromRedux.start_date,
        filterValuesFromRedux.end_date,
        allDownliners,
        nextPage,
        10, // Fetch next 10
        filterValuesFromRedux.status_id,
        true,
      );
    }
  };

  const handleUpdate = async () => {
    Keyboard.dismiss();
    if (!comment) {
      CommonMessage('error', 'Please enter comments');
      return;
    }

    setLoading(true);
    setButtonLoading(true);
    try {
      const getLoginUserDetails = await AsyncStorage.getItem(
        'loginUserDetails',
      );
      const convertAsJson = JSON.parse(getLoginUserDetails);

      const payload = {
        lead_history_id: selectedLead.lead_history_id,
        lead_id: selectedLead.id,
        comments: comment,
        next_follow_up_date: nextDate ? formatToBackendIST(nextDate) : null,
        lead_status_id: actionId,
        updated_by: convertAsJson?.user_id || 0,
        updated_date: formatToBackendIST(new Date()),
      };
      console.log('payloadddd', payload);
      // return;
      await updateFollowUp(payload);
      CommonMessage('success', 'Follow-up updated');
      followupSheetRef.current?.close();
      setRefreshing(true);
      getLeadFollowUpsData(
        filterValuesFromRedux.searchValue,
        filterValuesFromRedux.start_date,
        filterValuesFromRedux.end_date,
        allDownliners,
        filterValuesFromRedux.pageNumber || 1,
        filterValuesFromRedux.pageLimit || 10,
        filterValuesFromRedux.status_id,
      );
      setComment('');
    } catch (error) {
      CommonMessage('error', 'Update failed');
    } finally {
      setLoading(false);
      setButtonLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
        isSubView && { backgroundColor: 'transparent' },
      ]}
    >
      {!isSubView && (
        <GlobalSearchModal
          visible={showGlobalSearch}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.surfaceSecondary },
          ]}
        >
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={
              filterType == 1
                ? 'Search By Mobile'
                : filterType == 2
                ? 'Search By Name'
                : filterType == 3
                ? 'Search By Email'
                : 'Search By Course'
            }
            placeholderTextColor={theme.textMuted}
            value={searchValue}
            onChangeText={handleSearch}
            onSubmitEditing={executeSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchValue.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterIcon}
            onPress={() => setShowFilterOptions(!showFilterOptions)}
          >
            <Icon name="filter" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {showFilterOptions && (
          <>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowFilterOptions(false)}
            />
            <View
              style={[styles.filterMenu, { backgroundColor: theme.surface }]}
            >
              {[
                { id: 1, label: 'Search by Mobile' },
                { id: 2, label: 'Search by Name' },
                { id: 3, label: 'Search by Email' },
                { id: 4, label: 'Search by Course' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setFilterType(opt.id);
                    setShowFilterOptions(false);
                    setSearchValue('');
                    dispatch(
                      storeFollowUpFilterValues({
                        searchValue: null,
                      }),
                    );
                    getLeadFollowUpsData(
                      null,
                      filterValuesFromRedux.start_date,
                      filterValuesFromRedux.end_date,
                      allDownliners,
                      1,
                      filterValuesFromRedux.pageLimit || 10,
                      filterValuesFromRedux.status_id,
                      false,
                    );
                  }}
                >
                  <Icon
                    name={
                      filterType === opt.id
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={18}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.filterMenuText,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
      <View style={{ backgroundColor: theme.surface, paddingTop: 10 }}>
        <CommonMuiCustomDatePicker
          value={[
            filterValuesFromRedux.start_date,
            filterValuesFromRedux.end_date,
          ]}
          onDateChange={range => {
            dispatch(
              storeFollowUpFilterValues({
                start_date: range[0],
                end_date: range[1],
              }),
            );
          }}
        />
      </View>
      <View style={[styles.chipContainer, { backgroundColor: theme.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={[
              styles.chip,
              !filterValuesFromRedux.status_id && styles.activeChip,
            ]}
            onPress={() =>
              dispatch(storeFollowUpFilterValues({ status_id: null }))
            }
          >
            <Text
              style={[
                styles.chipText,
                !filterValuesFromRedux.status_id && styles.activeChipText,
              ]}
            >
              All ({followupCount})
            </Text>
          </TouchableOpacity>
          {statusCountsFromRedux.map((chip, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.chip,
                filterValuesFromRedux.status_id === chip.id &&
                  styles.activeChip,
              ]}
              onPress={() =>
                dispatch(storeFollowUpFilterValues({ status_id: chip.id }))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  filterValuesFromRedux.status_id === chip.id &&
                    styles.activeChipText,
                ]}
              >
                {chip.name} ({chip.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && followUpData.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={followUpData}
          renderItem={renderFollowupCard}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={() => followUpData.length > 0 && handleLoadMore()}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            followUpData.length > 0 ? (
              <View
                style={{
                  height: 60,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {loading && (
                  <ActivityIndicator size="large" color={theme.primary} />
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              No folowups scheduled
            </Text>
          }
        />
      )}

      <BottomSheet
        ref={followupSheetRef}
        index={-1}
        snapPoints={['92%']}
        enablePanDownToClose
        topInset={60}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={true}
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.bottomSheetContent,
            { paddingBottom: 40 },
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.bsTitle, { color: theme.textPrimary }]}>
            Lead Follow-Up
          </Text>

          <Text style={styles.detailsHeading}>Lead Details</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Name
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textPrimary }]}
                selectable={true}
              >
                {selectedLead?.candidate_name || '-'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Email
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textPrimary }]}
                numberOfLines={1}
                selectable={true}
              >
                {selectedLead?.email || '-'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Mobile
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textPrimary }]}
                selectable={true}
              >
                {selectedLead?.phone || '-'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Course
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textPrimary }]}
                selectable={true}
              >
                {selectedLead?.primary_course || '-'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Fees
              </Text>
              <Text
                style={[styles.detailValue, { color: theme.textPrimary }]}
                selectable={true}
              >
                ₹{selectedLead?.primary_fees || '-'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Next Followup
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {selectedLead?.next_follow_up_date
                  ? moment(selectedLead.next_follow_up_date).format(
                      'DD/MM/YYYY',
                    )
                  : '-'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.detailsHeading}>Follow-Up History</Text>
          {selectedLead?.histories && selectedLead.histories.length > 0 ? (
            <View
              style={[
                historyStyles.container,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              {[...(selectedLead?.histories || [])]
                .sort((a, b) =>
                  moment(b.updated_date).diff(moment(a.updated_date)),
                )
                .map((h, i, arr) => {
                  const initials = getInitials(h.user_name);
                  const avatarColor = getAvatarColor(initials);
                  const userIdStr = h.user_id || h.updated_by || '';
                  let displayName = h.user_name || 'System';
                  if (userIdStr && !displayName.includes(userIdStr)) {
                    displayName = `${userIdStr} - ${displayName}`;
                  }

                  return (
                    <React.Fragment key={i}>
                      <View style={historyStyles.card}>
                        <View
                          style={[
                            historyStyles.avatar,
                            { backgroundColor: avatarColor.bg },
                          ]}
                        >
                          <Text
                            style={[
                              historyStyles.avatarText,
                              { color: avatarColor.text },
                            ]}
                          >
                            {initials}
                          </Text>
                        </View>
                        <View style={historyStyles.info}>
                          <View style={historyStyles.header}>
                            <Text
                              style={[
                                historyStyles.user,
                                { color: theme.textPrimary },
                              ]}
                            >
                              {displayName}
                            </Text>
                            <Text
                              style={[
                                historyStyles.date,
                                { color: theme.textMuted },
                              ]}
                            >
                              {moment(h.updated_date).format(
                                'YYYY-MM-DD hh:mm:ss A',
                              )}
                            </Text>
                          </View>
                          <Text
                            style={[
                              historyStyles.comment,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {h.comments}
                          </Text>
                        </View>
                      </View>
                      {i < arr.length - 1 && (
                        <View
                          style={[
                            historyStyles.divider,
                            { backgroundColor: theme.border },
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
            </View>
          ) : (
            <Text
              style={{
                textAlign: 'center',
                color: theme.textMuted,
                fontSize: 12,
              }}
            >
              No history found
            </Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.detailsHeading}>Update Follow-Up</Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Action
          </Text>
          <View style={[styles.detailGrid, { marginBottom: 15 }]}>
            {actionOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.chip,
                  actionId == opt.id && styles.activeChip,
                  {
                    marginHorizontal: 4,
                    marginVertical: 4,
                    paddingHorizontal: 10,
                  },
                ]}
                onPress={() => {
                  setActionId(opt.id);
                  if (opt.id == 6) {
                    setNextDate(null);
                  } else {
                    setNextDate(new Date());
                  }
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    actionId === opt.id && styles.activeChipText,
                    { fontSize: 11 },
                  ]}
                >
                  {opt.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Comments
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                height: 80,
                textAlignVertical: 'top',
                padding: 10,
                backgroundColor: theme.surfaceSecondary,
                color: theme.textPrimary,
              },
            ]}
            placeholder="Enter follow-up details..."
            placeholderTextColor={theme.textMuted}
            multiline
            value={comment}
            onChangeText={setComment}
          />

          {actionId != 6 && (
            <>
              <Text style={styles.inputLabel}>Next Follow-Up Date</Text>
              <View style={[styles.detailGrid, { marginBottom: 10 }]}>
                {recommendedDates.map((date, idx) => {
                  const isSelected = moment(nextDate).isSame(date, 'day');
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.chip,
                        isSelected && styles.activeChip,
                        {
                          marginHorizontal: 4,
                          marginVertical: 4,
                          paddingHorizontal: 10,
                        },
                      ]}
                      onPress={() => setNextDate(date.toDate())}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.activeChipText,
                          { fontSize: 11 },
                        ]}
                      >
                        {idx === 0 ? 'Today' : date.format('DD MMM')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View
                style={[
                  styles.searchContainer,
                  {
                    justifyContent: 'space-between',
                    backgroundColor: theme.surfaceSecondary,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon
                    name="calendar-outline"
                    size={16}
                    color={theme.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 13, color: theme.textPrimary }}>
                    {moment(nextDate).format('DD MMM YYYY')}
                  </Text>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>

          <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  { backgroundColor: theme.surfaceSecondary },
                  followUpData.indexOf(selectedLead) === 0 && {
                    opacity: 0.5,
                  },
                ]}
                onPress={() => handleNextPrev('prev')}
                disabled={followUpData.indexOf(selectedLead) === 0}
              >
                <Text
                  style={[styles.navButtonText, { color: theme.textPrimary }]}
                >
                  Previous
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  { backgroundColor: theme.surfaceSecondary },
                  followUpData.indexOf(selectedLead) ===
                    followUpData.length - 1 && { opacity: 0.5 },
                ]}
                onPress={() => handleNextPrev('next')}
                disabled={
                  followUpData.indexOf(selectedLead) === followUpData.length - 1
                }
              >
                <Text
                  style={[styles.navButtonText, { color: theme.textPrimary }]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
              {followUpData.indexOf(selectedLead) + 1} of {followUpData.length}
            </Text>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

const getInitials = name => {
  if (!name) return 'S';
  const cleanName = name.replace(/^[A-Z0-9]+\s*-\s*/i, '').trim();
  const parts = cleanName.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = initials => {
  const colors = [
    { bg: '#E8EAF6', text: '#3F51B5' }, // Indigo
    { bg: '#E1BEE7', text: '#9C27B0' }, // Purple
    { bg: '#D1C4E9', text: '#673AB7' }, // Deep Purple
    { bg: '#BBDEFB', text: '#2196F3' }, // Blue
    { bg: '#B2EBF2', text: '#00BCD4' }, // Cyan
    { bg: '#B2DFDB', text: '#009688' }, // Teal
    { bg: '#C8E6C9', text: '#4CAF50' }, // Green
  ];
  const charCodeSum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  return colors[charCodeSum % colors.length];
};

const historyStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  user: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A202C',
    marginRight: 8,
  },
  date: {
    fontSize: 10,
    color: '#718096',
  },
  comment: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
    marginTop: 4,
  },
});

export default Followup;
