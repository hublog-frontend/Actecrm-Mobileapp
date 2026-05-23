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
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import moment from 'moment';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import styles from './LeadManagerstyles';
import { useTheme } from '../../Context/ThemeContext';
import {
  getLeads,
  assignLead,
  leadPayment,
  getAllDownlineUsers,
} from '../../ApiService/action';
import { storeLeadFilterValues } from '../../Redux/Slice';
import { CommonMessage } from '../../Common/CommonMessage';
import CommonMuiCustomDatePicker from '../../Common/CommonMuiCustomDatePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Leads = ({ isSubView, isActive }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const filterValues = useSelector(state => state.leadfiltervalues);
  const downlineUsers = useSelector(state => state.downlineusers);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const [isFocused, setIsFocused] = useState(false);
  const [filterType, setFilterType] = useState(1); // Default to Search by Mobile
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [allDownliners, setAllDownliners] = useState([]);
  const [editLeadId, setEditLeadId] = useState(null);

  const isFetchingRef = useRef(false);

  // Bottom Sheet Refs
  const filterSheetRef = useRef(null);
  const assignSheetRef = useRef(null);
  const paymentSheetRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      setEditLeadId(null);
    }, []),
  );

  useEffect(() => {
    if (isActive === false) {
      filterSheetRef.current?.close();
      assignSheetRef.current?.close();
      paymentSheetRef.current?.close();
    }
  }, [isActive]);

  const fetchLeads = useCallback(
    async (
      pageNum = 1,
      isRefresh = false,
      searchText = search,
      customDownliners = null,
    ) => {
      if (isFetchingRef.current && !isRefresh) return;

      isFetchingRef.current = true;
      setLoading(true);
      try {
        const userIds = filterValues.user_id
          ? [filterValues.user_id]
          : customDownliners || allDownliners;

        const payload = {
          start_date: filterValues.start_date,
          end_date: filterValues.end_date,
          user_ids: userIds,
          page: pageNum,
          limit: 10,
          ...(searchText && filterType == 1 ? { phone: searchText } : {}),
          ...(searchText && filterType == 2 ? { name: searchText } : {}),
          ...(searchText && filterType == 3 ? { email: searchText } : {}),
          ...(searchText && filterType == 4 ? { course: searchText } : {}),
          search: searchText,
        };

        const response = await getLeads(payload);
        const newLeads = response.data?.data?.data || [];

        if (isRefresh) {
          setLeads(newLeads);
        } else {
          setLeads(prev => [...prev, ...newLeads]);
        }

        setHasMore(newLeads.length === 10);
        setPage(pageNum);
      } catch (error) {
        console.error('Fetch Leads Error:', error);
        CommonMessage('error', 'Failed to fetch leads');
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [
      filterValues.start_date,
      filterValues.end_date,
      filterValues.user_id,
      search,
      filterType,
      allDownliners,
    ],
  );

  const getAllDownlineUsersData = useCallback(
    async (user_id, pageNum = 1, isRefresh = false) => {
      try {
        const response = await getAllDownlineUsers(user_id);
        const downliners = response?.data?.data || [];
        const downliners_ids = downliners.map(u => u.user_id);
        setAllDownliners(downliners_ids);

        fetchLeads(pageNum, isRefresh, search, downliners_ids);
      } catch (error) {
        console.log('all downlines error in Leads:', error);
      }
    },
    [
      filterValues.start_date,
      filterValues.end_date,
      filterValues.user_id,
      search,
      filterType,
      fetchLeads,
    ],
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const getLoginUserDetails = await AsyncStorage.getItem(
        'loginUserDetails',
      );
      const convertAsJson = JSON.parse(getLoginUserDetails);
      getAllDownlineUsersData(convertAsJson?.user_id, 1, true);
    };
    fetchUserData();
  }, [filterValues.start_date, filterValues.end_date, filterValues.user_id]);

  const onRefresh = () => {
    setRefreshing(true);
    const fetchUserData = async () => {
      const getLoginUserDetails = await AsyncStorage.getItem(
        'loginUserDetails',
      );
      const convertAsJson = JSON.parse(getLoginUserDetails);
      getAllDownlineUsersData(convertAsJson?.user_id, 1, true);
    };
    fetchUserData();
  };

  const loadMore = () => {
    if (hasMore && !loading && leads.length > 0) {
      fetchLeads(page + 1);
    }
  };

  const handleSearchChange = text => {
    setSearch(text);
    if (text.length === 0) {
      fetchLeads(1, true, '');
    }
  };

  const handleCall = phone => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = phone => {
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  const checkReEntry = createdDate => {
    const created = moment(createdDate);
    const now = moment();
    return now.diff(created, 'days') > 45;
  };

  const handleEdit = item => {
    setEditLeadId(item.id);
    setTimeout(() => {
      navigation.navigate('AddLead', { lead: item });
    }, 300);
  };

  const renderLeadCard = ({ item }) => {
    const isReEntryPossible = checkReEntry(item.created_date);
    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.lead_status) },
            ]}
          >
            <Text style={styles.statusText}>{item.lead_status}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Icon name="mail-outline" size={14} color={theme.textSecondary} />
            <Text
              style={[styles.detailText, { color: theme.textSecondary }]}
              selectable={true}
            >
              {item.email || 'No email'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="call-outline" size={14} color={theme.textSecondary} />
            <Text
              style={[styles.detailText, { color: theme.textSecondary }]}
              selectable={true}
            >
              {item.phone}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="globe-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {item.lead_type || 'Source unknown'}
            </Text>
          </View>
        </View>
        <View
          style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}
        >
          <View style={styles.quickActions}>
            {item.phone ? (
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleCall(item.phone)}
              >
                <Icon name="call-outline" size={16} color={theme.primary} />
                <Text
                  style={[styles.quickActionText, { color: theme.primary }]}
                >
                  Call
                </Text>
              </TouchableOpacity>
            ) : null}
            {item.phone ? (
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleWhatsApp(item.phone)}
              >
                <Icon name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={[styles.quickActionText, { color: '#25D366' }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.cardFooterActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                editLeadId !== null && editLeadId !== item.id
                  ? { opacity: 0.5 }
                  : {},
              ]}
              disabled={editLeadId !== null}
              onPress={() => handleEdit(item)}
            >
              {editLeadId == item.id ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primary}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <Icon name="create-outline" size={18} color={theme.primary} />
              )}
              <Text style={[styles.actionText, { color: theme.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = status => {
    switch (status) {
      case 'High':
        return '#E8F5E9';
      case 'Medium':
        return '#FFF3E0';
      case 'Low':
        return '#FFEBEE';
      default:
        return '#F0F3F7';
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
      <>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
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
                filterType == 1
                  ? 'Search By Mobile'
                  : filterType == 2
                  ? 'Search By Name'
                  : filterType == 3
                  ? 'Search By Email'
                  : 'Search By Course'
              }
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={() => fetchLeads(1, true)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
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
                      setSearch('');
                      fetchLeads(1, true, '');
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
            value={[filterValues.start_date, filterValues.end_date]}
            onDateChange={range => {
              dispatch(
                storeLeadFilterValues({
                  start_date: range[0],
                  end_date: range[1],
                }),
              );
            }}
          />
        </View>
      </>

      {loading && leads.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLeadCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            leads.length > 0 ? (
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
            <Text
              style={{
                textAlign: 'center',
                marginTop: 20,
                color: theme.textSecondary,
              }}
            >
              No leads found
            </Text>
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <BottomSheet
        ref={filterSheetRef}
        index={-1}
        snapPoints={['50%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.surface }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={[styles.bsTitle, { color: theme.textPrimary }]}>
            Filters
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={() => filterSheetRef.current?.close()}
          >
            <Text style={styles.submitButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default Leads;
