import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Image,
  StyleSheet,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import moment from 'moment';
import { BASE_URL } from '../../ApiService/action';
import { CommonMessage } from '../../Common/CommonMessage';
import { calculateAmount } from '../../Common/Validation';
import { getCustomerStatusPresentation } from './customerStatus';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import styles from './pendingFeesStyles';

const formatDate = value => {
  if (!value) return null;
  const m = moment(value);
  return m.isValid() ? m.format('DD/MM/YYYY') : String(value);
};

const formatCurrency = value => {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return null;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const resolveImageUri = path => {
  if (!path) return null;

  // Base64 image
  if (typeof path === 'string' && path.startsWith('data:image')) {
    return path;
  }

  // Normal URL
  if (typeof path === 'string' && path.startsWith('http')) {
    return path;
  }

  // Relative path
  const normalized = String(path).replace(/\\/g, '/');

  return `${BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

const displayValue = value => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const formatServerLabel = value => {
  if (value === 1 || value === '1' || value === true) return 'Required';
  if (value === 0 || value === '0' || value === false) return 'Not Required';
  return value;
};

const formatPlacementLabel = value => {
  if (value === 1 || value === '1' || value === true) return 'Need';
  if (value === 0 || value === '0' || value === false) return 'Not Needed';
  return value;
};

const CustomerDetailField = ({
  fieldKey,
  icon,
  label,
  value,
  copyValue,
  theme,
  selectionKey,
  activeField,
  onActivate,
  isHighlight,
  compact,
}) => {
  const display = displayValue(value);
  const isActive = activeField === fieldKey;
  const canCopy = display !== '—';

  return (
    <Pressable
      onLongPress={() => {
        if (!canCopy) return;
        Clipboard.setString(String(copyValue ?? display));
        onActivate(fieldKey);
      }}
      delayLongPress={400}
      style={[
        compact ? styles.detailsGridField : styles.detailsFieldRow,
        isActive && { backgroundColor: theme.primaryLight, borderRadius: 6 },
      ]}
    >
      <View style={styles.detailsFieldLabelRow}>
        {icon ? (
          <Icon
            name={icon}
            size={14}
            color={theme.textMuted}
            style={styles.detailsFieldIcon}
          />
        ) : null}
        <Text style={[styles.detailsFieldLabel, { color: theme.textMuted }]}>
          {label}
        </Text>
      </View>
      <Text
        key={`${fieldKey}-${selectionKey}`}
        selectable
        numberOfLines={3}
        style={[
          styles.detailsFieldValue,
          { color: isHighlight ? theme.error : theme.textPrimary },
          isHighlight && styles.detailsFieldValueHighlight,
        ]}
      >
        {display}
      </Text>
    </Pressable>
  );
};

const PendingFeesCustomerDetails = ({
  visible,
  loading,
  customer,
  onClose,
  theme,
}) => {
  const snapPoints = useMemo(() => ['70%', '92%'], []);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectionKey, setSelectionKey] = useState(0);
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    const backAction = () => {
      if (isBottomSheetOpen) {
        visible.current?.close();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isBottomSheetOpen]);

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

  useEffect(() => {
    if (!visible) {
      setSelectionKey(prev => prev + 1);
      setActiveField(null);
    }
  }, [visible]);

  const clearSelection = () => {
    setActiveField(null);
    setSelectionKey(prev => prev + 1);
  };

  const statusPresentation = useMemo(
    () => getCustomerStatusPresentation(customer, theme),
    [customer, theme],
  );

  const profileUri = resolveImageUri(
    customer?.profile_image ||
      customer?.profile_pic ||
      customer?.customer_image ||
      customer?.image,
  );
  const signatureUri = resolveImageUri(
    customer?.signature_image ||
      customer?.signature_url ||
      customer?.customer_signature,
  );

  const leadExecutive = useMemo(() => {
    const id = customer?.lead_assigned_to_id;
    const name = customer?.lead_assigned_to_name;
    if (id && name) return `${id} (${name})`;
    return name || id || null;
  }, [customer]);

  const fieldProps = {
    theme,
    selectionKey,
    activeField,
    onActivate: setActiveField,
  };

  const personalLeft = [
    {
      key: 'name',
      icon: 'person-outline',
      label: 'Name',
      value: customer?.name,
    },
    {
      key: 'email',
      icon: 'mail-outline',
      label: 'Email',
      value: customer?.email,
    },
    {
      key: 'mobile',
      icon: 'call-outline',
      label: 'Mobile',
      value: customer?.phone || customer?.mobile,
    },
    {
      key: 'whatsapp',
      icon: 'logo-whatsapp',
      label: 'Whatsapp',
      value: customer?.whatsapp || customer?.whatsapp_no,
    },
  ];

  const personalRight = [
    {
      key: 'dob',
      icon: 'calendar-outline',
      label: 'Date Of Birth',
      value: formatDate(customer?.date_of_birth || customer?.dob),
    },
    {
      key: 'gender',
      icon: 'male-female-outline',
      label: 'Gender',
      value: customer?.gender,
    },
    {
      key: 'area',
      icon: 'location-outline',
      label: 'Area',
      value: customer?.current_location || customer?.area,
    },
    {
      key: 'executive',
      icon: 'person-circle-outline',
      label: 'Lead Executive',
      value: leadExecutive,
    },
  ];

  const courseLeft = [
    { key: 'course', label: 'Course', value: customer?.course_name },
    {
      key: 'fees',
      label: 'Course Fees',
      value: formatCurrency(customer?.primary_fees),
    },
    {
      key: 'feesGst',
      label: 'Course Fees (+Gst)',
      value: formatCurrency(customer?.total_amount),
    },
    {
      key: 'balance',
      label: 'Balance Amount',
      value: formatCurrency(customer?.balance_amount),
      isHighlight: true,
    },
    {
      key: 'nextDue',
      label: 'Next Due Date',
      value: formatDate(customer?.next_due_date),
    },
    {
      key: 'joining',
      label: 'Joining Date',
      value: formatDate(customer?.date_of_joining || customer?.join_date),
    },
  ];

  const courseRight = [
    {
      key: 'region',
      label: 'Region',
      value: customer?.region_name || customer?.region,
    },
    {
      key: 'branch',
      label: 'Branch',
      value: customer?.branch_name || customer?.branch,
    },
    {
      key: 'batchType',
      label: 'Batch Type',
      value: customer?.batch_timing || customer?.batch_type_name,
    },
    {
      key: 'batchTrack',
      label: 'Batch Track',
      value: customer?.batch_tracking || customer?.batch_track_name,
    },
    {
      key: 'server',
      label: 'Server',
      value: formatServerLabel(
        customer?.server_required ??
          customer?.server ??
          customer?.is_server_required,
      ),
    },
    {
      key: 'placement',
      label: 'Placement Support',
      value: formatPlacementLabel(
        customer?.placement_support ?? customer?.placement_support_name,
      ),
    },
  ];

  const renderGridColumn = fields =>
    fields.map(field => (
      <CustomerDetailField
        key={field.key}
        fieldKey={field.key}
        icon={field.icon}
        label={field.label}
        value={field.value}
        isHighlight={field.isHighlight}
        compact
        {...fieldProps}
      />
    ));

  return (
    <BottomSheet
      ref={visible}
      index={-1}
      snapPoints={snapPoints}
      onChange={index => {
        setIsBottomSheetOpen(index >= 0);
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
            if (activeField) {
              clearSelection();
            } else {
              onClose();
            }
          }}
        />
        <Text style={[styles.detailsModalTitle, { color: theme.textPrimary }]}>
          Customer Details
        </Text>
        {loading ? (
          <View style={styles.detailsLoadingWrap}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={clearSelection}>
              <View
                style={[
                  styles.detailsProfileCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderLight,
                  },
                ]}
              >
                {profileUri ? (
                  <Image
                    source={{ uri: profileUri }}
                    style={styles.detailsAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.detailsAvatarPlaceholder,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Icon name="person" size={28} color={theme.primary} />
                  </View>
                )}
                <View style={styles.detailsProfileInfo}>
                  <Text
                    style={[
                      styles.detailsProfileName,
                      { color: theme.textPrimary },
                    ]}
                    numberOfLines={2}
                  >
                    {customer?.name || '—'}
                  </Text>
                  <Text
                    style={[
                      styles.detailsProfileMeta,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {customer?.course_name || '—'}
                  </Text>
                  <Text
                    style={[
                      styles.detailsProfileMeta,
                      { color: theme.textMuted },
                    ]}
                  >
                    Created At:{' '}
                    {formatDate(
                      customer?.created_at || customer?.created_date,
                    ) || '—'}
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.detailsSectionTitle, { color: theme.primary }]}
              >
                Personal Information
              </Text>
              <View
                style={[
                  styles.detailsSectionCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.borderLight,
                  },
                ]}
              >
                <View style={styles.detailsTwoCol}>
                  <View style={styles.detailsCol}>
                    {renderGridColumn(personalLeft)}
                  </View>
                  <View
                    style={[
                      styles.detailsColDivider,
                      { backgroundColor: theme.borderLight },
                    ]}
                  />
                  <View style={styles.detailsCol}>
                    {renderGridColumn(personalRight)}
                  </View>
                </View>
              </View>

              <Text
                style={[styles.detailsSectionTitle, { color: theme.primary }]}
              >
                Course Details
              </Text>
              <View
                style={[
                  styles.detailsCourseCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.detailsTwoCol}>
                  <View style={styles.detailsCol}>
                    {renderGridColumn(courseLeft)}
                  </View>
                  <View
                    style={[
                      styles.detailsColDivider,
                      { backgroundColor: theme.borderLight },
                    ]}
                  />
                  <View style={styles.detailsCol}>
                    {renderGridColumn(courseRight)}
                  </View>
                </View>
              </View>

              {signatureUri ? (
                <View style={styles.detailsSignatureWrap}>
                  <Text
                    style={[
                      styles.detailsSignatureLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Signature
                  </Text>
                  <Image
                    source={{ uri: signatureUri }}
                    style={[
                      styles.detailsSignatureImage,
                      { borderColor: theme.borderLight },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </Pressable>
          </ScrollView>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

export default PendingFeesCustomerDetails;
