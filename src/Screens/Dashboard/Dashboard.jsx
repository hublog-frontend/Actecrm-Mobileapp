import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  BackHandler,
  RefreshControl,
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
} from '../../ApiService/action';
import { getThisMonthDateRange } from '../../Common/Validation';
import styles from './dashboardStyles';
import {
  DonutChart,
  HorizontalBarChart,
  CollectionSpeedometer,
} from './components/DashboardCharts';
import CommonMuiCustomDatePicker from '../../Common/CommonMuiCustomDatePicker';
import { useFocusEffect } from '@react-navigation/native';

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

const DashboardCard = ({ title, dateRange, theme, loading, children }) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: theme.surface,
        borderColor: theme.borderLight,
      },
    ]}
  >
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      {dateRange?.[0] && dateRange?.[1] ? (
        <Text style={[styles.cardDateRange, { color: theme.textMuted }]}>
          {moment(dateRange[0]).format('DD MMM YYYY')} –{' '}
          {moment(dateRange[1]).format('DD MMM YYYY')}
        </Text>
      ) : null}
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
  const [dateRange, setDateRange] = useState(getThisMonthDateRange());
  const [allDownliners, setAllDownliners] = useState([]);

  const [scoreBoardLoader, setScoreBoardLoader] = useState(true);
  const [scoreCardDetails, setScoreCardDetails] = useState(null);

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
  const needsScoreboardApi =
    showCollectionGauge &&
    (showScoreBoard || showSalePerformance || showCollectionGauge);

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

  const fetchScoreBoard = useCallback(
    async (dates, downliners) => {
      if (!needsScoreboardApi) {
        setScoreBoardLoader(false);
        setSaleDetailsLoader(false);
        return;
      }
      if (!downliners?.length) {
        setScoreCardDetails(null);
        setSaleDetailsSeries([]);
        setScoreBoardLoader(false);
        setSaleDetailsLoader(false);
        return;
      }
      if (showScoreBoard) setScoreBoardLoader(true);
      if (showSalePerformance || showCollectionGauge)
        setSaleDetailsLoader(true);

      try {
        const response = await getScoreBoard({
          start_date: dates[0],
          end_date: dates[1],
          user_ids: downliners,
        });
        const data = response?.data?.data || null;
        setScoreCardDetails(data);

        const series = [
          Number(data?.sale_volume || 0),
          Number(data?.total_collection || 0),
          Number(data?.pending_payment || 0),
        ];
        setSaleDetailsSeries(series.some(v => v > 0) ? series : []);
      } catch {
        setScoreCardDetails(null);
        setSaleDetailsSeries([]);
      } finally {
        setScoreBoardLoader(false);
        setSaleDetailsLoader(false);
      }
    },
    [
      needsScoreboardApi,
      showScoreBoard,
      showSalePerformance,
      showCollectionGauge,
    ],
  );

  const fetchFollowupActions = useCallback(
    async (dates, downliners) => {
      if (!showFollowupActions || !downliners?.length) {
        setFollowupData([]);
        setFollowupLoader(false);
        return;
      }
      setFollowupLoader(true);
      try {
        const response = await getFollowUpActionDashboard({
          start_date: dates[0],
          end_date: dates[1],
          user_ids: downliners,
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

  const loadDashboard = useCallback(
    async (dates = dateRange, isRefresh = false) => {
      if (!allDownliners.length) return;
      if (isRefresh) setRefreshing(true);
      await Promise.all([
        fetchScoreBoard(dates, allDownliners),
        fetchFollowupActions(dates, allDownliners),
      ]);
      if (isRefresh) setRefreshing(false);
    },
    [allDownliners, dateRange, fetchScoreBoard, fetchFollowupActions],
  );

  const initDownliners = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('loginUserDetails');
      const loginUser = stored ? JSON.parse(stored) : null;
      const userId = loginUser?.user_id;
      if (!userId) return;

      const response = await getAllDownlineUsers(userId);
      const downliners = response?.data?.data || [];
      const ids = downliners.map(u => u.user_id);
      setAllDownliners(ids.length ? ids : downlineUsers.map(u => u.user_id));
    } catch {
      setAllDownliners(downlineUsers.map(u => u.user_id));
    }
  }, [downlineUsers]);

  useEffect(() => {
    if (downlineUsers?.length > 0 && !mounted.current) {
      mounted.current = true;
      const defaultDates = getThisMonthDateRange();
      setDateRange(defaultDates);
      initDownliners();
    }
  }, [downlineUsers, initDownliners]);

  useEffect(() => {
    if (allDownliners.length > 0) {
      loadDashboard(dateRange);
    }
  }, [allDownliners]);

  const handleRefresh = () => {
    const dates = getThisMonthDateRange();
    setDateRange(dates);
    loadDashboard(dates, true);
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

    const renderCol = (flex, children, textStyle) => (
      <View style={[styles.tableCol, { flex }]}>
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
            renderCol(col.flex, col.label, [
              styles.tableHeaderText,
              { color: theme.textSecondary },
            ]),
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
            <View style={styles.datePickerWrap}>
              <CommonMuiCustomDatePicker
                isDashboard
                value={dateRange}
                onDateChange={dates => {
                  setDateRange(dates);
                  loadDashboard(dates);
                }}
              />
            </View>
            {/* <TouchableOpacity
              style={[
                styles.refreshBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleRefresh}
            >
              <Icon name="refresh" size={22} color={theme.primary} />
            </TouchableOpacity> */}
          </View>

          {showCollectionGauge && (
            <DashboardCard
              title="Collection Overview"
              dateRange={dateRange}
              theme={theme}
              loading={saleDetailsLoader}
            >
              <CollectionSpeedometer
                collection={scoreCardDetails?.total_collection}
                target={scoreCardDetails?.target_value}
                saleVolume={scoreCardDetails?.sale_volume}
                pendingPayment={scoreCardDetails?.pending_payment}
                theme={theme}
              />
            </DashboardCard>
          )}

          {showScoreBoard && (
            <DashboardCard
              title="Score Board"
              dateRange={dateRange}
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
                      {formatNumber(scoreCardDetails?.total_leads)}
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
                      {formatNumber(scoreCardDetails?.total_join)}
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
                  Number(scoreCardDetails?.total_followups || 0),
                  Number(scoreCardDetails?.follow_up_handled || 0),
                  Number(scoreCardDetails?.follow_up_unhandled || 0),
                ]}
                colors={['#5b6aca', '#009688', 'rgba(211, 47, 47, 0.8)']}
                efficientValue={scoreCardDetails?.follow_up_percentage}
                theme={theme}
              />
            </DashboardCard>
          )}

          {showSalePerformance && (
            <DashboardCard
              title="Sale Performance"
              dateRange={dateRange}
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
              dateRange={dateRange}
              theme={theme}
              loading={followupLoader}
            >
              {renderFollowupTable()}
            </DashboardCard>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Dashboard;
