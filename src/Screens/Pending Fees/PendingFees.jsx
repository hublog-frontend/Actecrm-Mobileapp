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
  StyleSheet,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { useSelector } from 'react-redux';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../Context/ThemeContext';
import Header from '../../Common/Header';
import {
  getAllDownlineUsers,
  getPendingFeesCustomers,
  getCustomerById,
} from '../../ApiService/action';
import { CommonMessage } from '../../Common/CommonMessage';
import styles from './pendingFeesStyles';
import leadStyles from '../Lead Manager/LeadManagerstyles';
import PendingFeesPaymentSheet from './PendingFeesPaymentSheet';
import PendingFeesCustomerDetails from './PendingFeesCustomerDetails';
import { getCustomerStatusPresentation } from './customerStatus';

const mergeUniqueCustomers = (prev, next, pageNumber) => {
  if (pageNumber === 1) return next;
  const seen = new Set(prev.map(item => item.id));
  const uniqueNext = next.filter(
    item => item?.id != null && !seen.has(item.id),
  );
  return [...prev, ...uniqueNext];
};

const PendingFees = () => {
  const { theme } = useTheme();
  const permissions = useSelector(state => state.userpermissions);
  const downlineUsers = useSelector(state => state.downlineusers);

  const [searchValue, setSearchValue] = useState('');
  const [filterType, setFilterType] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allDownliners, setAllDownliners] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const paymentSheetRef = useRef(null);
  const mounted = useRef(false);
  const isFetchingRef = useRef(false);

  const buildSearchPayload = searchvalue => {
    if (!searchvalue) return {};
    if (filterType === 1) return { mobile: searchvalue };
    if (filterType === 2) return { name: searchvalue };
    if (filterType === 3) return { email: searchvalue };
    if (filterType === 4) return { course: searchvalue };
    return {};
  };

  const fetchCustomers = useCallback(
    async (
      pageNumber = 1,
      limit = 10,
      searchvalue = searchValue,
      downliners = allDownliners,
    ) => {
      if (!downliners?.length) {
        setCustomersData([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);

      try {
        const payload = {
          ...buildSearchPayload(searchvalue),
          user_ids: downliners,
          page: pageNumber,
          limit,
        };
        const response = await getPendingFeesCustomers(payload);
        const list = response?.data?.data?.data || [];
        const pag = response?.data?.data?.pagination;

        setCustomersData(prev => mergeUniqueCustomers(prev, list, pageNumber));
        setPagination({
          page: pag?.page || pageNumber,
          limit: pag?.limit || limit,
          total: pag?.total || 0,
          totalPages: pag?.totalPages || 0,
        });
      } catch (error) {
        if (pageNumber === 1) setCustomersData([]);
        CommonMessage('error', 'Failed to load pending fees');
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchValue, filterType, allDownliners],
  );

  const getAllDownlineUsersData = async user_id => {
    try {
      const response = await getAllDownlineUsers(user_id);
      const downliners = response?.data?.data || [];
      const downliners_ids = downliners.map(u => u.user_id);
      setAllDownliners(downliners_ids);
      fetchCustomers(1, 10, searchValue, downliners_ids);
    } catch (error) {
      setLoading(false);
      console.log('downline error', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const stored = await AsyncStorage.getItem('loginUserDetails');
      if (!stored) return;
      const user = JSON.parse(stored);
      if (downlineUsers.length > 0 && !mounted.current) {
        mounted.current = true;
        getAllDownlineUsersData(user?.user_id);
      } else if (!mounted.current) {
        mounted.current = true;
        getAllDownlineUsersData(user?.user_id);
      }
    };
    init();
  }, [downlineUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    const stored = await AsyncStorage.getItem('loginUserDetails');
    const user = stored ? JSON.parse(stored) : null;
    if (user?.user_id) {
      await getAllDownlineUsersData(user.user_id);
    } else {
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (
      !loading &&
      customersData.length > 0 &&
      pagination.page < pagination.totalPages
    ) {
      fetchCustomers(pagination.page + 1, pagination.limit);
    }
  };

  const handleSearch = text => {
    setSearchValue(text);
    setTimeout(() => {
      fetchCustomers(1, pagination.limit, text);
    }, 300);
  };

  const openDetails = async item => {
    setSelectedCustomer(item);
    setDetailsVisible(true);
    setDetailsLoading(true);
    try {
      const response = await getCustomerById(item.id);
      setCustomerDetails(response?.data?.data || item);
    } catch {
      setCustomerDetails(item);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openPayment = item => {
    setSelectedCustomer(item);
    paymentSheetRef.current?.expand();
  };

  const renderCard = ({ item }) => {
    const statusPresentation = getCustomerStatusPresentation(item, theme);
    const isOverdue =
      item.next_due_date &&
      moment(item.next_due_date).isBefore(moment(), 'day');

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
            shadowColor: theme.textPrimary,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.cardName, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              #{item.row_num} · {item.course_name || 'No course'}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusPresentation.bg },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: statusPresentation.text },
              ]}
              numberOfLines={2}
            >
              {statusPresentation.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
          Executive: {item.lead_assigned_to_name || '—'}
        </Text>

        <View style={[styles.amountRow, { borderTopColor: theme.borderLight }]}>
          <View style={styles.amountBlock}>
            <Text style={[styles.amountLabel, { color: theme.textMuted }]}>
              Balance
            </Text>
            <Text style={[styles.amountValue, { color: theme.error }]}>
              ₹{item.balance_amount ?? '—'}
            </Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={[styles.amountLabel, { color: theme.textMuted }]}>
              Next due
            </Text>
            <Text
              style={[
                styles.amountValue,
                { color: isOverdue ? theme.error : theme.textPrimary },
              ]}
            >
              {item.next_due_date
                ? moment(item.next_due_date).format('DD MMM YYYY')
                : '—'}
            </Text>
          </View>
        </View>

        <View
          style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}
        >
          <View style={leadStyles.quickActions}>
            {item.phone ? (
              <TouchableOpacity
                style={[
                  leadStyles.quickActionBtn,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Icon name="call-outline" size={16} color={theme.primary} />
                <Text
                  style={[leadStyles.quickActionText, { color: theme.primary }]}
                >
                  Call
                </Text>
              </TouchableOpacity>
            ) : null}
            {item.phone ? (
              <TouchableOpacity
                style={[
                  leadStyles.quickActionBtn,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  Linking.openURL(`whatsapp://send?phone=${item.phone}`)
                }
              >
                <Icon name="logo-whatsapp" size={16} color="#25D366" />
                <Text
                  style={[leadStyles.quickActionText, { color: '#25D366' }]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                openDetails(item);
              }}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                },
              ]}
            >
              <Icon name="eye-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
            {permissions?.includes('Add Part Payment') ? (
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  openPayment(item);
                }}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Icon name="cash-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                  Pay
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <Header />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderLight,
          },
        ]}
      >
        {/* <Text style={[styles.title, { color: theme.textPrimary }]}>
          Pending Fees
        </Text> */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          >
            <Icon name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder={
                filterType == 1
                  ? 'Search by Mobile'
                  : filterType == 2
                  ? 'Search by Name'
                  : filterType == 3
                  ? 'Search by Email'
                  : 'Search by Course'
              }
              placeholderTextColor={theme.textMuted}
              value={searchValue}
              onChangeText={handleSearch}
            />
            {searchValue.length > 0 ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Icon name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setShowFilterOptions(!showFilterOptions)}
            >
              <Icon name="filter" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {showFilterOptions ? (
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
                    fetchCustomers(1, pagination.limit, '');
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
        ) : null}
      </View>

      <Text style={[styles.total_heading, { color: theme.textPrimary }]}>
        Total ({pagination?.total})
      </Text>
      {loading && customersData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={customersData}
          keyExtractor={(item, index) =>
            item?.id != null
              ? `pending-fee-${item.id}`
              : `pending-fee-row-${index}`
          }
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            customersData.length > 0 ? (
              <View
                style={{
                  height: 60,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator size="large" color={theme.primary} />
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Icon name="wallet-outline" size={48} color={theme.textMuted} />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No pending fee customers found
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <PendingFeesCustomerDetails
        visible={detailsVisible}
        loading={detailsLoading}
        customer={customerDetails}
        theme={theme}
        onClose={() => setDetailsVisible(false)}
      />

      <BottomSheet
        ref={paymentSheetRef}
        index={-1}
        snapPoints={['90%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {selectedCustomer ? (
            <PendingFeesPaymentSheet
              customer={selectedCustomer}
              onSuccess={() => {
                paymentSheetRef.current?.close();
                onRefresh();
              }}
            />
          ) : null}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default PendingFees;
