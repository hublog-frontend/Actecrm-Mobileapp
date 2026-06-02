import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  BackHandler,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useTheme } from '../../Context/ThemeContext';
import Header from '../../Common/Header';
import {
  getAllDownlineUsers,
  getScoreBoard,
  getFollowUpActionDashboard,
  getRegions,
  getDashboardDates,
  updateDashboardDates,
} from '../../ApiService/action';
import {
  getCurrentandPreviousweekDate,
  getDatesFromRangeLabel,
  getRangeLabel,
  getThisMonthDateRange,
} from '../../Common/Validation';
import styles from './dashboardStyles';
import {
  DonutChart,
  HorizontalBarChart,
  CollectionSpeedometer,
} from './components/DashboardCharts';
import CommonMuiCustomDatePicker from '../../Common/CommonMuiCustomDatePicker';
import CommonSelectField from '../../Common/CommonSelectField';
import { useFocusEffect } from '@react-navigation/native';
import dashboardStyles from './dashboardStyles';

const FOLLOWUP_ORDER = [
  'Hot Follow Up',
  'Cold Follow Up',
  'Interested',
  'Only Enquiry',
  'Hold',
  'No Response',
];

const formatNumber = value => {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-IN');
};

const DashboardCard = ({
  title,
  dateRange,
  onDateChange,
  theme,
  loading,
  children,
}) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: theme.surface,
        borderColor: theme.borderLight,
      },
    ]}
  >
    <View
      style={[
        styles.cardHeader,
        { flexDirection: 'column', alignItems: 'stretch' },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          {title}
        </Text>
      </View>
      <View style={{ marginBottom: 4 }}>
        <CommonMuiCustomDatePicker
          isDashboard
          value={dateRange}
          onDateChange={onDateChange}
        />
      </View>
    </View>
    {loading ? (
      <View
        style={[styles.skeleton, { backgroundColor: theme.surfaceSecondary }]}
      />
    ) : (
      children
    )}
  </View>
);

const Dashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const permissions = useSelector(state => state.userpermissions) || [];
  const downlineUsers = useSelector(state => state.downlineusers) || [];

  const mounted = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loginUserId, setLoginUserId] = useState('');

  const [isDashboardDatesLoaded, setIsDashboardDatesLoaded] = useState(false);
  const initialLoadDone = useRef(false);
  const skipFetchRef = useRef({
    collection: false,
    scoreBoard: false,
    salePerformance: false,
    followup: false,
  });

  //dates
  const [allDashboardCardsDates, setAllDashboardCardsDates] = useState([]);
  // Individual date ranges for each card
  const [collectionDates, setCollectionDates] = useState(
    getThisMonthDateRange(),
  );
  const [scoreBoardDates, setScoreBoardDates] = useState(
    getThisMonthDateRange(),
  );
  const [salePerformanceDates, setSalePerformanceDates] = useState(
    getThisMonthDateRange(),
  );
  const [followupDates, setFollowupDates] = useState(getThisMonthDateRange());

  const [allDownliners, setAllDownliners] = useState([]);

  // Region State
  const [regionsOptions, setRegionsOptions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Picker Modal State
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRegions, setFilteredRegions] = useState([]);

  // Card States
  const [collectionLoader, setCollectionLoader] = useState(true);
  const [collectionDetails, setCollectionDetails] = useState(null);

  const [scoreBoardLoader, setScoreBoardLoader] = useState(true);
  const [scoreBoardDetails, setScoreBoardDetails] = useState(null);

  const [saleDetailsLoader, setSaleDetailsLoader] = useState(true);
  const [saleDetailsSeries, setSaleDetailsSeries] = useState([]);

  const [followupLoader, setFollowupLoader] = useState(true);
  const [followupData, setFollowupData] = useState([]);

  const showScoreBoard = permissions.includes('Score Board');
  const showSalePerformance = permissions.includes('Sale Performance');
  const showFollowupActions = permissions.includes('Followup Actions');

  const hasAnyDashboard =
    permissions.length > 0 &&
    (showScoreBoard || showSalePerformance || showFollowupActions);

  const showCollectionGauge = permissions.length > 0;

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

  // Fetch Regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await getRegions();
        const list = response?.data?.data || [];
        setRegionsOptions(list);
        setFilteredRegions(list);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRegions();
  }, []);

  // Filter regions in picker
  useEffect(() => {
    if (searchQuery) {
      setFilteredRegions(
        regionsOptions.filter(r =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    } else {
      setFilteredRegions(regionsOptions);
    }
  }, [searchQuery, regionsOptions]);

  const fetchCollection = useCallback(
    async (dashboard_dates, dates, downliners, regionId) => {
      if (!showCollectionGauge || !downliners?.length) {
        setCollectionDetails(null);
        setCollectionLoader(false);
        return;
      }
      setCollectionLoader(true);

      //date handling
      let speedometer_dates;
      if (dashboard_dates && dashboard_dates.length >= 1) {
        speedometer_dates = dashboard_dates.find(
          f => f.card_name == 'Mobile App Speedometer',
        );
        if (speedometer_dates) {
          console.log('speedometer_dates', speedometer_dates);
          if (
            speedometer_dates.card_settings == 'Today' ||
            speedometer_dates.card_settings == 'Yesterday' ||
            speedometer_dates.card_settings == 'One Month' ||
            speedometer_dates.card_settings == '7 Days' ||
            speedometer_dates.card_settings == '15 Days' ||
            speedometer_dates.card_settings == '30 Days' ||
            speedometer_dates.card_settings == '60 Days' ||
            speedometer_dates.card_settings == '90 Days'
          ) {
            const getdates_bylabel = getDatesFromRangeLabel(
              speedometer_dates.card_settings,
            );
            speedometer_dates = getdates_bylabel;
            console.log('getdates_bylabel', getdates_bylabel);
            const newStart = getdates_bylabel.card_settings.start_date;
            const newEnd = getdates_bylabel.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.collection = true;
              setCollectionDates([newStart, newEnd]);
            }
          } else {
            const newStart = speedometer_dates.card_settings.start_date;
            const newEnd = speedometer_dates.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.collection = true;
              setCollectionDates([newStart, newEnd]);
            }
          }
        }
      }

      try {
        const response = await getScoreBoard({
          start_date: speedometer_dates
            ? speedometer_dates.card_settings.start_date
            : dates[0],
          end_date: speedometer_dates
            ? speedometer_dates.card_settings.end_date
            : dates[1],
          user_ids: downliners,
          region_id: regionId,
        });
        setCollectionDetails(response?.data?.data || null);
      } catch {
        setCollectionDetails(null);
      } finally {
        setCollectionLoader(false);
      }
    },
    [showCollectionGauge],
  );

  const fetchScoreBoardStats = useCallback(
    async (dashboard_dates, dates, downliners, regionId) => {
      if (!showScoreBoard || !downliners?.length) {
        setScoreBoardDetails(null);
        setScoreBoardLoader(false);
        return;
      }
      setScoreBoardLoader(true);
      //date handling
      let scoreboard_dates;
      if (dashboard_dates && dashboard_dates.length >= 1) {
        scoreboard_dates = dashboard_dates.find(
          f => f.card_name == 'Mobile App Score Board',
        );
        if (scoreboard_dates) {
          console.log('scoreboard_dates', scoreboard_dates);
          if (
            scoreboard_dates.card_settings == 'Today' ||
            scoreboard_dates.card_settings == 'Yesterday' ||
            scoreboard_dates.card_settings == 'One Month' ||
            scoreboard_dates.card_settings == '7 Days' ||
            scoreboard_dates.card_settings == '15 Days' ||
            scoreboard_dates.card_settings == '30 Days' ||
            scoreboard_dates.card_settings == '60 Days' ||
            scoreboard_dates.card_settings == '90 Days'
          ) {
            const getdates_bylabel = getDatesFromRangeLabel(
              scoreboard_dates.card_settings,
            );
            scoreboard_dates = getdates_bylabel;
            console.log('getdates_bylabel', getdates_bylabel);
            const newStart = getdates_bylabel.card_settings.start_date;
            const newEnd = getdates_bylabel.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.scoreBoard = true;
              setScoreBoardDates([newStart, newEnd]);
            }
          } else {
            const newStart = scoreboard_dates.card_settings.start_date;
            const newEnd = scoreboard_dates.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.scoreBoard = true;
              setScoreBoardDates([newStart, newEnd]);
            }
          }
        }
      }
      try {
        const response = await getScoreBoard({
          start_date: scoreboard_dates
            ? scoreboard_dates.card_settings.start_date
            : dates[0],
          end_date: scoreboard_dates
            ? scoreboard_dates.card_settings.end_date
            : dates[1],
          user_ids: downliners,
          region_id: regionId,
        });
        setScoreBoardDetails(response?.data?.data || null);
      } catch {
        setScoreBoardDetails(null);
      } finally {
        setScoreBoardLoader(false);
      }
    },
    [showScoreBoard],
  );

  const fetchSalePerformance = useCallback(
    async (dashboard_dates, dates, downliners, regionId) => {
      if (!showSalePerformance || !downliners?.length) {
        setSaleDetailsSeries([]);
        setSaleDetailsLoader(false);
        return;
      }
      setSaleDetailsLoader(true);
      //date handling
      let saleperformance_dates;
      if (dashboard_dates && dashboard_dates.length >= 1) {
        saleperformance_dates = dashboard_dates.find(
          f => f.card_name == 'Mobile App Sale Performance',
        );
        if (saleperformance_dates) {
          if (
            saleperformance_dates.card_settings == 'Today' ||
            saleperformance_dates.card_settings == 'Yesterday' ||
            saleperformance_dates.card_settings == 'One Month' ||
            saleperformance_dates.card_settings == '7 Days' ||
            saleperformance_dates.card_settings == '15 Days' ||
            saleperformance_dates.card_settings == '30 Days' ||
            saleperformance_dates.card_settings == '60 Days' ||
            saleperformance_dates.card_settings == '90 Days'
          ) {
            const getdates_bylabel = getDatesFromRangeLabel(
              saleperformance_dates.card_settings,
            );
            saleperformance_dates = getdates_bylabel;
            const newStart = getdates_bylabel.card_settings.start_date;
            const newEnd = getdates_bylabel.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.salePerformance = true;
              setSalePerformanceDates([newStart, newEnd]);
            }
          } else {
            const newStart = saleperformance_dates.card_settings.start_date;
            const newEnd = saleperformance_dates.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.salePerformance = true;
              setSalePerformanceDates([newStart, newEnd]);
            }
          }
        }
      }
      try {
        const response = await getScoreBoard({
          start_date: saleperformance_dates
            ? saleperformance_dates.card_settings.start_date
            : dates[0],
          end_date: saleperformance_dates
            ? saleperformance_dates.card_settings.end_date
            : dates[1],
          user_ids: downliners,
          region_id: regionId,
        });
        const data = response?.data?.data || null;
        const series = [
          Number(data?.sale_volume || 0),
          Number(data?.total_collection || 0),
          Number(data?.pending_payment || 0),
        ];
        setSaleDetailsSeries(series.some(v => v > 0) ? series : []);
      } catch {
        setSaleDetailsSeries([]);
      } finally {
        setSaleDetailsLoader(false);
      }
    },
    [showSalePerformance],
  );

  const fetchFollowupActions = useCallback(
    async (dashboard_dates, dates, downliners, regionId) => {
      if (!showFollowupActions || !downliners?.length) {
        setFollowupData([]);
        setFollowupLoader(false);
        return;
      }
      setFollowupLoader(true);
      //date handling
      let followup_action_dates;
      if (dashboard_dates && dashboard_dates.length >= 1) {
        followup_action_dates = dashboard_dates.find(
          f => f.card_name == 'Mobile App Followup Action',
        );
        if (followup_action_dates) {
          if (
            followup_action_dates.card_settings == 'Today' ||
            followup_action_dates.card_settings == 'Yesterday' ||
            followup_action_dates.card_settings == 'One Month' ||
            followup_action_dates.card_settings == '7 Days' ||
            followup_action_dates.card_settings == '15 Days' ||
            followup_action_dates.card_settings == '30 Days' ||
            followup_action_dates.card_settings == '60 Days' ||
            followup_action_dates.card_settings == '90 Days'
          ) {
            const getdates_bylabel = getDatesFromRangeLabel(
              followup_action_dates.card_settings,
            );
            followup_action_dates = getdates_bylabel;
            const newStart = getdates_bylabel.card_settings.start_date;
            const newEnd = getdates_bylabel.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.followup = true;
              setFollowupDates([newStart, newEnd]);
            }
          } else {
            const newStart = followup_action_dates.card_settings.start_date;
            const newEnd = followup_action_dates.card_settings.end_date;
            if (dates[0] !== newStart || dates[1] !== newEnd) {
              skipFetchRef.current.followup = true;
              setFollowupDates([newStart, newEnd]);
            }
          }
        }
      }
      try {
        const response = await getFollowUpActionDashboard({
          start_date: followup_action_dates
            ? followup_action_dates.card_settings.start_date
            : dates[0],
          end_date: followup_action_dates
            ? followup_action_dates.card_settings.end_date
            : dates[1],
          user_ids: downliners,
          region_id: regionId,
        });
        const data = response?.data?.data || [];
        const sorted = FOLLOWUP_ORDER.map(name =>
          data.find(item => item.action_name === name),
        ).filter(Boolean);
        setFollowupData(sorted);
      } catch {
        setFollowupData([]);
      } finally {
        setFollowupLoader(false);
      }
    },
    [showFollowupActions],
  );

  const loadAllDashboards = useCallback(
    async (isInitialLoad = false, isRefresh = false) => {
      if (!allDownliners.length) return;
      if (isRefresh) setRefreshing(true);
      const regionId = selectedRegion ? selectedRegion.id : undefined;
      const passDates = isInitialLoad ? allDashboardCardsDates : [];

      await Promise.all([
        fetchCollection(passDates, collectionDates, allDownliners, regionId),
        fetchScoreBoardStats(
          passDates,
          scoreBoardDates,
          allDownliners,
          regionId,
        ),
        fetchSalePerformance(
          passDates,
          salePerformanceDates,
          allDownliners,
          regionId,
        ),
        fetchFollowupActions(passDates, followupDates, allDownliners, regionId),
      ]);
      if (isRefresh) setRefreshing(false);
    },
    [
      allDashboardCardsDates,
      allDownliners,
      selectedRegion,
      collectionDates,
      scoreBoardDates,
      salePerformanceDates,
      followupDates,
      fetchCollection,
      fetchScoreBoardStats,
      fetchSalePerformance,
      fetchFollowupActions,
    ],
  );

  const initDownliners = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('loginUserDetails');
      const loginUser = stored ? JSON.parse(stored) : null;
      const userId = loginUser?.user_id;
      if (!userId) return;

      setLoginUserId(userId);

      const response = await getAllDownlineUsers(userId);
      const downliners = response?.data?.data || [];
      const ids = downliners.map(u => u.user_id);
      setAllDownliners(ids.length ? ids : downlineUsers.map(u => u.user_id));
      getDashboardDatesData(userId);
    } catch {
      setAllDownliners(downlineUsers.map(u => u.user_id));
    }
  }, [downlineUsers]);

  const getDashboardDatesData = async userId => {
    try {
      const response = await getDashboardDates(userId);
      console.log('dashboard dates response', response);
      const alldashboard_cardsdates = response?.data?.data || [];
      setAllDashboardCardsDates(alldashboard_cardsdates);
    } catch (error) {
      console.log('dashboard dates error', error);
    } finally {
      setIsDashboardDatesLoaded(true);
    }
  };

  useEffect(() => {
    if (downlineUsers?.length > 0 && !mounted.current) {
      mounted.current = true;
      initDownliners();
    }
  }, [downlineUsers, initDownliners]);

  // Initial load when downliners and saved dates are ready
  useEffect(() => {
    if (allDownliners.length > 0 && isDashboardDatesLoaded) {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        loadAllDashboards(true, false);
      }
    }
  }, [allDownliners, isDashboardDatesLoaded, loadAllDashboards]);

  // Reload when region changes
  const prevRegionRef = useRef(selectedRegion);
  useEffect(() => {
    if (initialLoadDone.current && prevRegionRef.current !== selectedRegion) {
      prevRegionRef.current = selectedRegion;
      loadAllDashboards(false, false);
    }
  }, [selectedRegion, loadAllDashboards]);

  // Trigger individual loads on date changes
  useEffect(() => {
    if (initialLoadDone.current && allDownliners.length) {
      if (skipFetchRef.current.collection) {
        skipFetchRef.current.collection = false;
        return;
      }
      fetchCollection([], collectionDates, allDownliners, selectedRegion?.id);
    }
  }, [collectionDates]);

  useEffect(() => {
    if (initialLoadDone.current && allDownliners.length) {
      if (skipFetchRef.current.scoreBoard) {
        skipFetchRef.current.scoreBoard = false;
        return;
      }
      fetchScoreBoardStats(
        [],
        scoreBoardDates,
        allDownliners,
        selectedRegion?.id,
      );
    }
  }, [scoreBoardDates]);

  useEffect(() => {
    if (initialLoadDone.current && allDownliners.length) {
      if (skipFetchRef.current.salePerformance) {
        skipFetchRef.current.salePerformance = false;
        return;
      }
      fetchSalePerformance(
        [],
        salePerformanceDates,
        allDownliners,
        selectedRegion?.id,
      );
    }
  }, [salePerformanceDates]);

  useEffect(() => {
    if (initialLoadDone.current && allDownliners.length) {
      if (skipFetchRef.current.followup) {
        skipFetchRef.current.followup = false;
        return;
      }
      fetchFollowupActions(
        [],
        followupDates,
        allDownliners,
        selectedRegion?.id,
      );
    }
  }, [followupDates]);

  const handleRefresh = () => {
    loadAllDashboards(false, true);
  };

  const renderFollowupTable = () => {
    if (!followupData.length) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: theme.textMuted }]}>
            No data found
          </Text>
        </View>
      );
    }

    const cols = [
      { key: 'status', label: 'Status', flex: 2.5 },
      { key: 'total', label: 'Total', flex: 1.1 },
      { key: 'handled', label: 'Handled', flex: 1.3 },
      { key: 'unhandled', label: 'Un\nHandled', flex: 1.3 },
      { key: 'efficiency', label: 'Eff.%', flex: 1 },
    ];

    const renderCol = (flex, children, textStyle, key) => (
      <View key={key} style={[styles.tableCol, { flex }]}>
        <Text style={textStyle} numberOfLines={2}>
          {children}
        </Text>
      </View>
    );

    return (
      <View>
        <View
          style={[styles.tableHeader, { borderBottomColor: theme.borderLight }]}
        >
          {cols.map(col =>
            renderCol(
              col.flex,
              col.label,
              [styles.tableHeaderText, { color: theme.textSecondary }],
              col.key,
            ),
          )}
        </View>
        {followupData.map((item, index) => (
          <View
            key={`${item.action_name}-${index}`}
            style={[styles.tableRow, { borderBottomColor: theme.borderLight }]}
          >
            {renderCol(cols[0].flex, item.action_name, [
              styles.tableCell,
              { color: theme.textPrimary },
            ])}
            {renderCol(cols[1].flex, item.total, [
              styles.tableCell,
              styles.tableCellCenter,
              { color: theme.textPrimary },
            ])}
            {renderCol(cols[2].flex, item.handled_follow_up, [
              styles.tableCell,
              styles.tableCellCenter,
              { color: theme.success },
            ])}
            {renderCol(cols[3].flex, item.unhandled_follow_up, [
              styles.tableCell,
              styles.tableCellCenter,
              { color: theme.error },
            ])}
            {renderCol(cols[4].flex, `${item.percentage}%`, [
              styles.tableCell,
              styles.tableCellCenter,
              { color: theme.primary },
            ])}
          </View>
        ))}
      </View>
    );
  };

  const updateDashboardCardDate = async (name, startDate, endDate) => {
    let get_item;
    if (allDashboardCardsDates.length >= 1) {
      get_item = allDashboardCardsDates.find(
        f => f.user_id == loginUserId && f.card_name == name,
      );
    } else {
      get_item = null;
    }

    const get_rangelabel = getRangeLabel(startDate, endDate);
    console.log('get_rangelabel', get_rangelabel);

    const payload = {
      user_id: loginUserId,
      card_name: name,
      card_settings: get_rangelabel
        ? get_rangelabel
        : { start_date: startDate, end_date: endDate },
      ...(get_item && { id: get_item.id }),
    };
    console.log('update date payload', payload);
    try {
      await updateDashboardDates(payload);
    } catch (error) {
      console.log('update card date', error);
    } finally {
      try {
        const response = await getDashboardDates(loginUserId);
        console.log('dashboard dates response', response);
        const alldashboard_cardsdates = response?.data?.data || [];
        setAllDashboardCardsDates(alldashboard_cardsdates);
      } catch (error) {
        console.log('dashboard dates', error);
      }
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['left', 'right']}
    >
      <Header />

      {!hasAnyDashboard ? (
        <View style={styles.noAccess}>
          <Icon name="lock-closed-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.noAccessText, { color: theme.textSecondary }]}>
            You do not have permission to view dashboard modules.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
            />
          }
        >
          <View style={styles.toolbar}>
            <CommonSelectField
              label="Region Filter"
              placeholder="All Regions"
              selectedValue={
                selectedRegion ? selectedRegion.name : 'All Regions'
              }
              onPress={() => setPickerModalVisible(true)}
              containerStyle={{ width: '100%', marginBottom: 0 }}
            />
          </View>

          {showCollectionGauge && (
            <DashboardCard
              title="Collection Overview"
              dateRange={collectionDates}
              onDateChange={dates => {
                setCollectionDates(dates);
                updateDashboardCardDate(
                  'Mobile App Speedometer',
                  dates[0],
                  dates[1],
                );
              }}
              theme={theme}
              loading={collectionLoader}
            >
              <CollectionSpeedometer
                collection={collectionDetails?.total_collection}
                target={collectionDetails?.target_value}
                saleVolume={collectionDetails?.sale_volume}
                pendingPayment={collectionDetails?.pending_payment}
                theme={theme}
              />
            </DashboardCard>
          )}

          {showScoreBoard && (
            <DashboardCard
              title="Score Board"
              dateRange={scoreBoardDates}
              onDateChange={dates => {
                setScoreBoardDates(dates);
                updateDashboardCardDate(
                  'Mobile App Score Board',
                  dates[0],
                  dates[1],
                );
              }}
              theme={theme}
              loading={scoreBoardLoader}
            >
              <View style={styles.statRow}>
                <View
                  style={[
                    styles.statBox,
                    { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <View
                    style={[
                      styles.statIconWrap,
                      { backgroundColor: 'rgba(91, 106, 202, 0.2)' },
                    ]}
                  >
                    <Icon name="people-outline" size={20} color="#5b69ca" />
                  </View>
                  <View>
                    <Text
                      style={[styles.statLabel, { color: theme.textSecondary }]}
                    >
                      Total Leads
                    </Text>
                    <Text style={[styles.statValue, { color: '#5b69ca' }]}>
                      {formatNumber(scoreBoardDetails?.total_leads)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statBox,
                    { backgroundColor: 'rgba(60, 145, 17, 0.1)' },
                  ]}
                >
                  <View
                    style={[
                      styles.statIconWrap,
                      { backgroundColor: 'rgba(60, 145, 17, 0.15)' },
                    ]}
                  >
                    <Icon
                      name="checkmark-circle-outline"
                      size={20}
                      color="#3c9111"
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.statLabel, { color: theme.textSecondary }]}
                    >
                      Joinings
                    </Text>
                    <Text style={[styles.statValue, { color: '#3c9111' }]}>
                      {formatNumber(scoreBoardDetails?.total_join)}
                    </Text>
                  </View>
                </View>
              </View>
              <DonutChart
                labels={[
                  'Total Followup',
                  'Followup Handled',
                  'Followup Un-Handled',
                ]}
                series={[
                  Number(scoreBoardDetails?.total_followups || 0),
                  Number(scoreBoardDetails?.follow_up_handled || 0),
                  Number(scoreBoardDetails?.follow_up_unhandled || 0),
                ]}
                colors={['#5b6aca', '#009688', 'rgba(211, 47, 47, 0.8)']}
                efficientValue={scoreBoardDetails?.follow_up_percentage}
                theme={theme}
              />
            </DashboardCard>
          )}

          {showSalePerformance && (
            <DashboardCard
              title="Sale Performance"
              dateRange={salePerformanceDates}
              onDateChange={dates => {
                setSalePerformanceDates(dates);
                updateDashboardCardDate(
                  'Mobile App Sale Performance',
                  dates[0],
                  dates[1],
                );
              }}
              theme={theme}
              loading={saleDetailsLoader}
            >
              {saleDetailsSeries.length > 0 ? (
                <HorizontalBarChart
                  labels={['Sale Volume', 'Collection', 'Pending Fees']}
                  series={saleDetailsSeries}
                  colors={['#5b6aca', '#258a25', '#b22021']}
                  theme={theme}
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Text
                    style={[styles.emptyChartText, { color: theme.textMuted }]}
                  >
                    No data found
                  </Text>
                </View>
              )}
            </DashboardCard>
          )}

          {showFollowupActions && (
            <DashboardCard
              title="Followup Actions"
              dateRange={followupDates}
              onDateChange={dates => {
                setFollowupDates(dates);
                updateDashboardCardDate(
                  'Mobile App Followup Action',
                  dates[0],
                  dates[1],
                );
              }}
              theme={theme}
              loading={followupLoader}
            >
              {renderFollowupTable()}
            </DashboardCard>
          )}
        </ScrollView>
      )}

      {/* Region Picker Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerModalVisible(false)}>
          <View
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.pickerModalContainer,
                  { backgroundColor: theme.surface },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: theme.textPrimary }]}
                  >
                    Select Region
                  </Text>

                  <TouchableOpacity
                    onPress={() => setPickerModalVisible(false)}
                  >
                    <Icon
                      name="close-outline"
                      size={24}
                      color={theme.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View
                  style={[
                    styles.modalSearchContainer,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: theme.border,
                      borderWidth: 0.5,
                    },
                  ]}
                >
                  <Icon
                    name="search-outline"
                    size={18}
                    color={theme.textSecondary}
                    style={{ marginRight: 8 }}
                  />

                  <TextInput
                    style={[
                      styles.modalSearchInput,
                      { color: theme.textPrimary },
                    ]}
                    placeholder="Search regions..."
                    placeholderTextColor={theme.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />

                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Icon
                        name="close-circle"
                        size={18}
                        color={theme.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Region List */}
                <FlatList
                  data={[{ id: null, name: 'All Regions' }, ...filteredRegions]}
                  keyExtractor={item => (item.id ? item.id.toString() : 'all')}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isSelected =
                      selectedRegion?.id === item.id ||
                      (!selectedRegion && !item.id);

                    return (
                      <TouchableOpacity
                        style={[
                          styles.pickerItemRow,
                          { borderBottomColor: theme.borderLight },
                          isSelected && {
                            backgroundColor: theme.primaryLight,
                          },
                        ]}
                        onPress={() => {
                          setSelectedRegion(item.id ? item : null);
                          setPickerModalVisible(false);
                          setSearchQuery('');
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerItemLabel,
                            { color: theme.textPrimary },
                            isSelected && {
                              color: theme.primary,
                              fontWeight: 'bold',
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text
                      style={[styles.emptyListText, { color: theme.textMuted }]}
                    >
                      No regions found.
                    </Text>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Dashboard;
