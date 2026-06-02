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
  TextInput,
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
import styles from '../Pending Fees/pendingFeesStyles';

const PLACE_OPTIONS = [
  { id: 'Tamil Nadu', name: 'Tamil Nadu' },
  { id: 'Out of TN', name: 'Out of TN' },
  { id: 'Out of IND', name: 'Out of IND' },
];

const TAX_TYPE_OPTIONS = [
  { id: 1, name: 'GST (18%)', category: 'Tax Types' },
  { id: 2, name: 'SGST (18%)', category: 'Tax Types' },
  { id: 3, name: 'IGST (18%)', category: 'Tax Types' },
  { id: 4, name: 'VAT (18%)', category: 'Tax Types' },
  { id: 5, name: 'No Tax', category: 'Tax Types' },
];

const DownPaymentSheet = ({ selectedLead, customer, onSuccess }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const [primaryFees, setPrimaryFees] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payAmountError, setPayAmountError] = useState('');
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentModeError, setPaymentModeError] = useState('');
  const [taxType, setTaxType] = useState(null);
  const [taxTypeLabel, setTaxTypeLabel] = useState('');
  const [taxTypeError, setTaxTypeError] = useState('');

  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({
    title: '',
    items: [],
    onSelect: () => {},
    searchPlaceholder: '',
    selectedValue: null,
  });
  const [searchQuery, setSearchQuery] = useState('');

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
  //customer details
  const [customerCourseName, setCustomerCourseName] = useState('');
  const [batchTrackLabel, setBatchTrackLabel] = useState('');
  const batchTypeOptions = [
    {
      id: 1,
      name: 'Week Day',
    },
    {
      id: 2,
      name: 'Week End',
    },
    {
      id: 3,
      name: 'Fast Track',
    },
  ];
  const [batchTypeLabel, setBatchTypeLabel] = useState('');
  const [batchTypeId, setBatchTypeId] = useState(null);
  const [customerBatchTimingIdError, setCustomerBatchTimingIdError] =
    useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentLocationError, setCurrentLocationError] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerAddressError, setCustomerAddressError] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [placementSupport, setPlacementSupport] = useState(null);
  const [placementSupportError, setPlacementSupportError] = useState('');
  const [serverRequired, setServerRequired] = useState(false);

  const resetForm = () => {
    setPrimaryFees(String(selectedLead?.primary_fees));
    setTotalAmount(String(selectedLead?.primary_fees));
    setCustomerCourseName(selectedLead?.primary_course);
    setBatchTrackLabel(selectedLead?.batch_track);
    setPayAmount('');
    setPayAmountError('');

    setPaymentMode(null);
    setPaymentModeError('');

    setTaxType(null);
    setTaxTypeLabel('');
    setTaxTypeError('');

    setConvenienceFees(0);

    setPaymentDate(new Date());
    setPaymentDateError('');

    setPlaceOfPayment(null);
    setPlaceLabel('');
    setPlaceOfPaymentError('');

    setBalanceAmount(0);

    setIsShowDueDate(true);
    setDueDate(null);
    setDueDateError('');

    setValidated(false);

    setPaymentScreenShotBase64('');
    setPaymentScreenShotError('');

    setSearchQuery('');
    setPickerModalVisible(false);

    setCustomerBatchTimingIdError('');

    setCurrentLocation('');
    setCurrentLocationError('');

    setCustomerAddress('');
    setCustomerAddressError('');

    setGstNumber('');

    setPlacementSupport(null);
    setPlacementSupportError('');

    setServerRequired(false);
    setLoading(false);
  };

  useEffect(() => {
    if (customer?.id) {
      loadCustomer();
    }

    if (selectedLead) {
      resetForm();
    }
  }, [selectedLead]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const response = await getCustomerById(customer.id);
      const details = response?.data?.data;
      setCustomerDetails(details);
      const balance = parseFloat(details?.balance_amount) || 0;
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
    const amt = parseFloat(totalAmount) || 0;

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
    const amt = parseFloat(totalAmount) || 0;
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

  const showPicker = (
    title,
    items,
    labelField,
    onSelect,
    searchPlaceholder = 'Search...',
    selectedValue = null,
  ) => {
    setSearchQuery('');
    setPickerConfig({
      title,
      items: items.map(item => ({
        ...item,
        label: typeof item === 'string' ? item : item[labelField] || '',
        disabled: false,
      })),
      onSelect,
      searchPlaceholder,
      selectedValue,
    });
    setPickerModalVisible(true);
  };

  const handleSubmit = async () => {
    setValidated(true);
    const amt = parseFloat(totalAmount) || 0;
    const pay = parseFloat(payAmount) || 0;

    const paymentTypeValidate = selectValidator(paymentMode);
    const taxTypeValidate = selectValidator(taxType);
    const paymentDateValidate = selectValidator(paymentDate);
    const placeValidate = selectValidator(placeOfPayment);
    const payAmountValidate = priceValidator(pay, amt);
    const screenshotValidate = selectValidator(paymentScreenShotBase64);
    let dueDateValidate = '';
    if (isShowDueDate) {
      dueDateValidate = selectValidator(dueDate);
    }

    setPaymentModeError(paymentTypeValidate);
    setTaxTypeError(taxTypeValidate);
    setPayAmountError(payAmountValidate);
    setPaymentDateError(paymentDateValidate);
    setPlaceOfPaymentError(placeValidate);
    setPaymentScreenShotError(screenshotValidate);
    setDueDateError(dueDateValidate);

    if (
      paymentTypeValidate ||
      taxTypeValidate ||
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
        tax_type: taxType,
        payment_screenshot: paymentScreenShotBase64,
        payment_status: 'Verify Pending',
        next_due_date: dueDate ? formatToBackendIST(dueDate) : null,
        created_date: formatToBackendIST(new Date()),
        paid_date: formatToBackendIST(paymentDate),
        place_of_payment: placeOfPayment,
        collected_by: loginUser?.user_id || 0,
      };

      // Step 2: Calculate GST on discounted amount
      const gstAmount = totalAmount - primaryFees;

      console.log('GST Amount:', gstAmount);

      //    const payload = {
      //   lead_id: selectedLead.id,
      //   invoice_date: formatToBackendIST(paymentDate),
      //   tax_type:
      //     taxType == 1
      //       ? "GST (18%)"
      //       : taxType == 2
      //         ? "SGST (18%)"
      //         : taxType == 3
      //           ? "IGST (18%)"
      //           : taxType == 4
      //             ? "VAT (18%)"
      //             : "No Tax",
      //   gst_percentage: taxType == 5 ? "0%" : "18%",
      //   gst_amount: parseFloat(gstAmount).toFixed(2),
      //   total_amount: amount,
      //   convenience_fees: convenienceFees,
      //   paymode_id: paymentMode,
      //   paid_amount: payAmount,
      //   payment_screenshot: paymentScreenShotBase64,
      //   payment_status: "Verify Pending",
      //   next_due_date: dueDate ? formatToBackendIST(dueDate) : null,
      //   // ra_id: selectedRA,
      //   created_date: formatToBackendIST(today),
      //   paid_date: formatToBackendIST(paymentDate),
      //   place_of_payment: placeOfPayment,
      //   enrolled_course: customerCourseId,
      //   batch_track_id: customerBatchTrackId,
      //   batch_timing_id: customerBatchTimingId,
      //   place_of_supply: currentLocation,
      //   address: customerAddress,
      //   state_code: "",
      //   gst_number: gstNumber,
      //   placement_support: placementSupport,
      //   is_server_required: serverRequired,
      //   updated_by:
      //     loginUser?.user_id || 0,
      // };

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
        <CommonFormInput
          label={'Fees *'}
          value={primaryFees}
          editable={false}
          keyboardType="numeric"
        />
        <CommonSelectField
          label="Tax Type *"
          selectedValue={taxTypeLabel}
          onPress={() =>
            showPicker(
              'Tax Type',
              TAX_TYPE_OPTIONS,
              'name',
              item => {
                setTaxType(item.id);
                setTaxTypeLabel(item.name);
                setPickerModalVisible(false);
                if (validated) {
                  setTaxTypeError(selectValidator(item.id));
                }

                const subTotal = parseFloat(totalAmount) || 0;
                const taxPercentage = item.id === 5 ? 0 : 18;
                const amnt = subTotal + (subTotal * taxPercentage) / 100;

                if (isNaN(amnt)) {
                  setTotalAmount('');
                } else {
                  setTotalAmount(String(amnt));
                }

                const paidNow = parseFloat(payAmount) || 0;

                if (
                  paidNow < amnt ||
                  isNaN(paidNow) ||
                  payAmount === '' ||
                  payAmount == null
                ) {
                  setIsShowDueDate(true);
                } else {
                  setIsShowDueDate(false);
                  setDueDate(null);
                  setDueDateError('');
                }

                setBalanceAmount(
                  getBalanceAmount(
                    isNaN(amnt) ? 0 : amnt,
                    isNaN(paidNow) ? 0 : paidNow,
                  ),
                );
              },
              'Search tax type...',
              taxTypeLabel,
            )
          }
          error={taxTypeError}
          placeholder="Select Tax Type"
        />
        <CommonFormInput
          label="Total Amount *"
          editable={false}
          value={totalAmount}
          keyboardType="numeric"
        />

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Payment Info
        </Text>
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
          onPress={() =>
            showPicker(
              'Place of Payment',
              PLACE_OPTIONS,
              'name',
              item => {
                setPlaceOfPayment(item.id);
                setPlaceLabel(item.name);
                setPickerModalVisible(false);
                if (validated) setPlaceOfPaymentError(selectValidator(item.id));
              },
              'Search place...',
              placeLabel,
            )
          }
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

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Add Customer Details
        </Text>
        <CommonFormInput
          label="Course"
          value={String(customerCourseName)}
          editable={false}
        />

        <CommonFormInput
          label="Course"
          value={String(batchTrackLabel)}
          editable={false}
        />

        {/* -------------------------------submit button----------------------------------- */}
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
        visible={pickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerModalVisible(false)}>
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
                style={[
                  {
                    backgroundColor: theme.surface,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    maxHeight: '60%',
                    paddingBottom: 24,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: theme.textPrimary,
                    }}
                  >
                    {pickerConfig.title}
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

                {/* Search query input */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.surfaceSecondary,
                    margin: 16,
                    marginBottom: 8,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 40,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  }}
                >
                  <Icon
                    name="search-outline"
                    size={18}
                    color={theme.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: theme.textPrimary,
                      padding: 0,
                    }}
                    placeholder={pickerConfig.searchPlaceholder}
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

                {/* Item lists */}
                <FlatList
                  data={pickerConfig.items.filter(item => {
                    if (!searchQuery) return true;
                    return item.label
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                  })}
                  keyExtractor={(item, index) => index.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      disabled={item.disabled}
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.borderLight,
                        },
                        item.label === pickerConfig.selectedValue && {
                          backgroundColor: theme.primaryLight,
                        },
                        item.disabled && {
                          backgroundColor: theme.surfaceSecondary,
                          opacity: 0.5,
                        },
                      ]}
                      onPress={() => {
                        if (!item.disabled) {
                          pickerConfig.onSelect(item);
                        }
                      }}
                    >
                      <Text
                        style={[
                          { fontSize: 15, color: theme.textPrimary },
                          item.label === pickerConfig.selectedValue && {
                            color: theme.primary,
                            fontWeight: 'bold',
                          },
                          item.disabled && { color: theme.textMuted },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        color: theme.textMuted,
                        fontSize: 14,
                      }}
                    >
                      No items found.
                    </Text>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default DownPaymentSheet;
