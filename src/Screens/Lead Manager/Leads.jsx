import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
  Modal,
  StyleSheet,
  BackHandler,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
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
import DownPaymentSheet from './DownPaymentSheet';
import PendingFeesPaymentSheet from '../Pending Fees/PendingFeesPaymentSheet';

const Leads = ({ isSubView, isActive }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const filterValuesFromRedux = useSelector(state => state.leadfiltervalues);
  const downlineUsers = useSelector(state => state.downlineusers);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const [isFocused, setIsFocused] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState(1); // Default to Search by Mobile
  const [allDownliners, setAllDownliners] = useState([]);
  const [editLeadId, setEditLeadId] = useState(null);

  const isFetchingRef = useRef(false);

  // Bottom Sheet Refs
  const filterSheetRef = useRef(null);
  const assignSheetRef = useRef(null);
  //payment sheet
  const paymentSheetRef = useRef(null);
  const [isPaymentBottomSheetOpen, setIsPaymentBottomSheetOpen] =
    useState(false);
  const snapPoints = useMemo(() => ['70%', '92%'], []);
  const [selectedLead, setSelectedLead] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      setEditLeadId(null);
      console.log(
        'filterValuesFromRedux?.call_get_leads_api',
        filterValuesFromRedux?.call_get_leads_api,
      );

      if (filterValuesFromRedux?.call_get_leads_api) {
        dispatch(
          storeLeadFilterValues({
            call_get_leads_api: false,
          }),
        );
        fetchLeads(
          search,
          filterValuesFromRedux.start_date,
          filterValuesFromRedux.end_date,
          allDownliners,
          1,
        );
      }
    }, [filterValuesFromRedux]),
  );

  useEffect(() => {
    const backAction = () => {
      if (isPaymentBottomSheetOpen) {
        paymentSheetRef.current?.close();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isPaymentBottomSheetOpen]);

  useEffect(() => {
    if (isActive === false) {
      filterSheetRef.current?.close();
      assignSheetRef.current?.close();
      paymentSheetRef.current?.close();
    }
  }, [isActive]);

  useEffect(() => {
    const fetchUserData = async () => {
      const getLoginUserDetails = await AsyncStorage.getItem(
        'loginUserDetails',
      );
      const convertAsJson = JSON.parse(getLoginUserDetails);
      getAllDownlineUsersData(convertAsJson?.user_id, 1, true);
    };
    fetchUserData();
  }, []);

  const getAllDownlineUsersData = async user_id => {
    try {
      const response = await getAllDownlineUsers(user_id);
      const downliners = response?.data?.data || [];
      const downliners_ids = downliners.map(u => u.user_id);
      setAllDownliners(downliners_ids);
      setFilterType(1);
      setSearch('');
      const leadFilterValues = {
        searchValue: null,
        filterType: 1,
        start_date: moment().subtract(6, 'days').format('YYYY-MM-DD'),
        end_date: moment().format('YYYY-MM-DD'),
        user_id: null,
        lead_source: null,
        call_get_leads_api: false,
        pageNumber: 1,
        pageLimit: 10,
      };

      dispatch(storeLeadFilterValues(leadFilterValues));
      fetchLeads(
        leadFilterValues.searchValue,
        leadFilterValues.start_date,
        leadFilterValues.end_date,
        downliners_ids,
        1,
      );
    } catch (error) {
      console.log('all downlines error in Leads:', error);
    }
  };

  const fetchLeads = async (
    searchvalue,
    startDate,
    endDate,
    downliners,
    pageNumber,
    isAppend = false,
  ) => {
    if (isFetchingRef.current && !isRefresh) return;

    isFetchingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        start_date: startDate,
        end_date: endDate,
        user_ids: downliners,
        page: pageNumber,
        limit: 10,
        ...(searchvalue && filterType == 1 ? { phone: searchvalue } : {}),
        ...(searchvalue && filterType == 2 ? { name: searchvalue } : {}),
        ...(searchvalue && filterType == 3 ? { email: searchvalue } : {}),
        ...(searchvalue && filterType == 4 ? { course: searchvalue } : {}),
      };

      const response = await getLeads(payload);
      const newLeads = response.data?.data?.data || [];
      const paginationData = response?.data?.data?.pagination || {};

      if (isAppend) {
        setLeads(prev => [...prev, ...newLeads]);
      } else {
        setLeads(newLeads);
      }

      setHasMore(newLeads.length === 10);
      setPage(pageNumber);
      dispatch(
        storeLeadFilterValues({
          pageNumber: paginationData.page,
          pageLimit: paginationData.limit,
        }),
      );
    } catch (error) {
      console.error('Fetch Leads Error:', error);
      CommonMessage('error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

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
      fetchLeads(
        search,
        filterValuesFromRedux.start_date,
        filterValuesFromRedux.end_date,
        allDownliners,
        page + 1,
        true,
      );
    }
  };

  const handleSearch = text => {
    setSearch(text);
    if (text.length === 0) {
      fetchLeads(
        '',
        filterValuesFromRedux.start_date,
        filterValuesFromRedux.end_date,
        allDownliners,
        1,
        false,
      );
    }
  };

  const executeSearch = () => {
    fetchLeads(
      search,
      filterValuesFromRedux.start_date,
      filterValuesFromRedux.end_date,
      allDownliners,
      1,
      false,
    );
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
              {
                backgroundColor: getStatusColor(item.lead_status),
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item?.lead_status === 'High'
                      ? '#389e0d'
                      : item?.lead_status === 'Medium'
                      ? '#d46b08'
                      : '#595959',
                },
              ]}
            >
              {' '}
              {item.lead_status}
            </Text>
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
            <Text style={{ color: theme.textSecondary, marginRight: 5 }}>
              #
            </Text>
            <Text
              style={[styles.detailText, { color: theme.textSecondary }]}
              selectable={true}
            >
              {item.primary_course}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <FontAwesome
              name="rupee"
              size={14}
              color={theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {Number(item?.primary_fees)?.toLocaleString('en-IN') || 0}{' '}
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
            {item.is_customer_reg === 0 && (
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
            )}

            {item.is_customer_reg === 1 ? (
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={19}
                color={'#2ed574dc'}
              />
            ) : (
              <TouchableOpacity
                style={[styles.actionButton]}
                onPress={() => {
                  console.log('selected leadddd', item);
                  setSelectedLead(item);
                  paymentSheetRef?.current?.expand();
                }}
              >
                <MaterialCommunityIcons
                  name="card-account-details-outline"
                  size={19}
                  color={'#d32f2fda'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = status => {
    switch (status) {
      case 'High':
        return '#f6ffed';
      case 'Medium':
        return '#fff7e6';
      case 'Low':
        return '#f5f5f5';
      default:
        return '#f5f5f5';
    }
  };

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

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
              onChangeText={handleSearch}
              onSubmitEditing={executeSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
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
              filterValuesFromRedux.start_date,
              filterValuesFromRedux.end_date,
            ]}
            onDateChange={range => {
              dispatch(
                storeLeadFilterValues({
                  start_date: range[0],
                  end_date: range[1],
                }),
              );
              fetchLeads(search, range[0], range[1], allDownliners, 1);
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
          contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
          onEndReached={loadMore}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReachedThreshold={0.2}
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
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 20,
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: theme.textSecondary,
                }}
              >
                No leads found
              </Text>
            </View>
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
                  setFilterModalVisible(false);
                  fetchLeads(
                    '',
                    filterValuesFromRedux.start_date,
                    filterValuesFromRedux.end_date,
                    allDownliners,
                    1,
                  );
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

      <BottomSheet
        ref={paymentSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={index => {
          setIsPaymentBottomSheetOpen(index >= 0);
        }}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: theme.background || theme.surface,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.border,
        }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 0,
          }}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              paymentSheetRef.current.close();
            }}
          />
          <Text
            style={[styles.detailsModalTitle, { color: theme.textPrimary }]}
          >
            Make as Customer
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {selectedLead ? (
              <DownPaymentSheet
                customer={null}
                selectedLead={selectedLead}
                onSuccess={() => {
                  paymentSheetRef.current.close();
                  onRefresh();
                }}
              />
            ) : null}
          </ScrollView>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

const localStyles = StyleSheet.create({
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
});

export default Leads;
