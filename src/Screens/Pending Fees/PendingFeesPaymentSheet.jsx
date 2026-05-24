import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  Keyboard,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../Context/ThemeContext';
import CommonFormInput from '../../Common/CommonFormInput';
import CommonSelectField from '../../Common/CommonSelectField';
import CommonGroupedSelectField, {
  paymentModeRequiresConvenienceFee,
} from '../../Common/CommonGroupedSelectField';
import CommonDatePicker from '../../Common/CommonDatePicker';
import CommonImageUploadCrop from '../../Common/CommonImageUploadCrop';
import {
  formatToBackendIST,
  getBalanceAmount,
  getConvenienceFees,
  priceValidator,
  selectValidator,
} from '../../Common/Validation';
import {
  customerDuePayment,
  getCustomerById,
  getCustomersPaymentHistory,
  inserCustomerTrack,
} from '../../ApiService/action';
import { CommonMessage } from '../../Common/CommonMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './pendingFeesStyles';

const PLACE_OPTIONS = [
  { id: 'Tamil Nadu', name: 'Tamil Nadu' },
  { id: 'Out of TN', name: 'Out of TN' },
  { id: 'Out of IND', name: 'Out of IND' },
];

const PendingFeesPaymentSheet = ({ customer, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const [pendingAmount, setPendingAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payAmountError, setPayAmountError] = useState('');
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentModeError, setPaymentModeError] = useState('');
  const [convenienceFees, setConvenienceFees] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentDateError, setPaymentDateError] = useState('');
  const [placeOfPayment, setPlaceOfPayment] = useState(null);
  const [placeLabel, setPlaceLabel] = useState('');
  const [placeOfPaymentError, setPlaceOfPaymentError] = useState('');
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [isShowDueDate, setIsShowDueDate] = useState(true);
  const [dueDate, setDueDate] = useState(null);
  const [dueDateError, setDueDateError] = useState('');
  const [validated, setValidated] = useState(false);
  const [paymentScreenShotBase64, setPaymentScreenShotBase64] = useState('');
  const [paymentScreenShotError, setPaymentScreenShotError] = useState('');

  const [placePickerVisible, setPlacePickerVisible] = useState(false);

  useEffect(() => {
    if (customer?.id) {
      loadCustomer();
    }
  }, [customer?.id]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const response = await getCustomerById(customer.id);
      const details = response?.data?.data;
      setCustomerDetails(details);
      const balance = parseFloat(details?.balance_amount) || 0;
      setPendingAmount(String(balance));
      setBalanceAmount(balance);
    } catch (error) {
      CommonMessage('error', 'Failed to load customer');
      setCustomerDetails(null);
    }
    try {
      const hist = await getCustomersPaymentHistory(customer.lead_id);
      setPaymentDetails(hist?.data?.data || null);
    } catch {
      setPaymentDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const updatePayAmount = text => {
    if (!/^\d*\.?\d*$/.test(text)) return;
    setPayAmount(text);
    const value = parseFloat(text);
    const amt = parseFloat(pendingAmount) || 0;

    if (value < amt || isNaN(value) || text === '') {
      setIsShowDueDate(true);
    } else {
      setIsShowDueDate(false);
      setDueDate(null);
      setDueDateError('');
    }

    setBalanceAmount(
      getBalanceAmount(isNaN(amt) ? 0 : amt, isNaN(value) ? 0 : value),
    );

    if (paymentModeRequiresConvenienceFee(paymentMode)) {
      setConvenienceFees(getConvenienceFees(isNaN(value) ? 0 : value));
    } else {
      setConvenienceFees(0);
    }

    if (validated) {
      setPayAmountError(priceValidator(isNaN(value) ? 0 : value, amt));
    }
  };

  const handlePaymentModeChange = modeId => {
    setPaymentMode(modeId);
    if (validated) setPaymentModeError(selectValidator(modeId));

    const value = parseFloat(payAmount) || 0;
    const amt = parseFloat(pendingAmount) || 0;
    if (value < amt || isNaN(value) || payAmount === '') {
      setIsShowDueDate(true);
    } else {
      setIsShowDueDate(false);
      setDueDate(null);
      setDueDateError('');
    }
    setBalanceAmount(getBalanceAmount(amt, value));
    if (paymentModeRequiresConvenienceFee(modeId)) {
      setConvenienceFees(getConvenienceFees(value));
    } else {
      setConvenienceFees(0);
    }
  };

  const selectPlace = place => {
    setPlaceOfPayment(place.id);
    setPlaceLabel(place.name);
    setPlacePickerVisible(false);
    if (validated) setPlaceOfPaymentError(selectValidator(place.id));
  };

  const handleSubmit = async () => {
    setValidated(true);
    const amt = parseFloat(pendingAmount) || 0;
    const pay = parseFloat(payAmount) || 0;

    const paymentTypeValidate = selectValidator(paymentMode);
    const paymentDateValidate = selectValidator(paymentDate);
    const placeValidate = selectValidator(placeOfPayment);
    const payAmountValidate = priceValidator(pay, amt);
    const screenshotValidate = selectValidator(paymentScreenShotBase64);
    let dueDateValidate = '';
    if (isShowDueDate) {
      dueDateValidate = selectValidator(dueDate);
    }

    setPaymentModeError(paymentTypeValidate);
    setPayAmountError(payAmountValidate);
    setPaymentDateError(paymentDateValidate);
    setPlaceOfPaymentError(placeValidate);
    setPaymentScreenShotError(screenshotValidate);
    setDueDateError(dueDateValidate);

    if (
      paymentTypeValidate ||
      payAmountValidate ||
      paymentDateValidate ||
      placeValidate ||
      screenshotValidate ||
      dueDateValidate
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const stored = await AsyncStorage.getItem('loginUserDetails');
      const loginUser = stored ? JSON.parse(stored) : null;

      const payload = {
        payment_master_id: paymentDetails?.id,
        invoice_date: formatToBackendIST(paymentDate),
        paid_amount: payAmount,
        convenience_fees: convenienceFees,
        balance_amount: balanceAmount,
        paymode_id: paymentMode,
        payment_screenshot: paymentScreenShotBase64,
        payment_status: 'Verify Pending',
        next_due_date: dueDate ? formatToBackendIST(dueDate) : null,
        created_date: formatToBackendIST(new Date()),
        paid_date: formatToBackendIST(paymentDate),
        place_of_payment: placeOfPayment,
        collected_by: loginUser?.user_id || 0,
      };

      await customerDuePayment(payload);

      const trackPayload = {
        customers: [
          {
            customer_id: customerDetails.id,
            status: 'Part Payment Added',
            updated_by: loginUser?.user_id || 0,
            status_date: formatToBackendIST(new Date()),
          },
        ],
      };
      await inserCustomerTrack(trackPayload);

      CommonMessage('success', 'Payment added');
      onSuccess?.();
    } catch (error) {
      CommonMessage(
        'error',
        error?.response?.data?.details ||
          'Something went wrong. Try again later',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openPlacePicker = () => setPlacePickerVisible(true);

  if (loading) {
    return (
      <View style={styles.detailsLoadingWrap}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.sheetContent}>
        {/* <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
          Pay Due Amount
        </Text>
        <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
          {customerDetails?.name || customer?.name} ·{' '}
          {customerDetails?.course_name || customer?.course_name}
        </Text> */}

        <CommonFormInput
          label="Pending Amount *"
          value={pendingAmount}
          editable={false}
          keyboardType="numeric"
        />
        <CommonFormInput
          label="Pay Amount *"
          value={payAmount}
          onChangeText={updatePayAmount}
          error={payAmountError}
          keyboardType="numeric"
        />
        <CommonGroupedSelectField
          label="Payment Mode"
          required
          value={paymentMode}
          onChange={handlePaymentModeChange}
          error={paymentModeError}
          placeholder="Select payment mode"
          modalTitle="Payment Mode"
        />
        <CommonFormInput
          label="Conv. Fee"
          value={String(convenienceFees)}
          editable={false}
          keyboardType="numeric"
        />
        <CommonDatePicker
          label="Payment Date *"
          value={paymentDate}
          onDateChange={date => {
            setPaymentDate(date);
            if (validated) setPaymentDateError(selectValidator(date));
          }}
          error={paymentDateError}
          allowPastDates
        />
        <CommonSelectField
          label="Place of Payment *"
          selectedValue={placeLabel}
          onPress={openPlacePicker}
          error={placeOfPaymentError}
          placeholder="Select place"
        />

        <CommonImageUploadCrop
          label="Payment Screenshot"
          maxSizeMB={1}
          required
          value={paymentScreenShotBase64}
          onChange={base64 => {
            setPaymentScreenShotBase64(base64);
            if (validated) {
              setPaymentScreenShotError(selectValidator(base64));
            }
          }}
          onErrorChange={setPaymentScreenShotError}
        />
        {paymentScreenShotError ? (
          <Text
            style={{
              fontSize: 12,
              color: theme.error,
              marginTop: -8,
              marginBottom: 12,
            }}
          >
            {`Payment Screenshot ${paymentScreenShotError}`}
          </Text>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Balance
        </Text>
        <CommonFormInput
          label="Balance Amount"
          value={String(balanceAmount)}
          editable={false}
          keyboardType="numeric"
        />
        {isShowDueDate ? (
          <CommonDatePicker
            label="Next Due Date *"
            value={dueDate}
            onDateChange={date => {
              setDueDate(date);
              setDueDateError(selectValidator(date));
            }}
            error={dueDateError}
          />
        ) : null}

        {paymentDetails?.payment_trans?.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Recent transactions
            </Text>
            {paymentDetails.payment_trans.slice(0, 3).map((item, index) => (
              <View
                key={`tx-${item.id ?? item.invoice_number ?? index}-${index}`}
                style={[
                  styles.historyItem,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[styles.historyDate, { color: theme.textPrimary }]}
                >
                  {moment(item.invoice_date).format('DD/MM/YYYY')} ·{' '}
                  {item.payment_status}
                </Text>
                <Text
                  style={[styles.historyMeta, { color: theme.textSecondary }]}
                >
                  Paid ₹{item.paid_amount} · Mode: {item.payment_mode}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Payment</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={placePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlacePickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPlacePickerVisible(false)}>
          <View
            style={[
              {
                flex: 1,
                justifyContent: 'flex-end',
                backgroundColor: theme.overlay,
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxHeight: '50%',
                  paddingBottom: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: theme.textPrimary,
                    }}
                  >
                    Place of Payment
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPlacePickerVisible(false)}
                  >
                    <Icon name="close" size={22} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={PLACE_OPTIONS}
                  keyExtractor={item => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.borderLight,
                      }}
                      onPress={() => {
                        selectPlace(item);
                      }}
                    >
                      <Text style={{ color: theme.textPrimary, fontSize: 15 }}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default PendingFeesPaymentSheet;
