import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatToBackendIST, priceCategory } from '../../Common/Validation';
import { STATE_DATA } from '../../Common/States';
import { CommonMessage } from '../../Common/CommonMessage';
import { storeCourseList, storeAreaList } from '../../Redux/Slice';
import PhoneWithCountry from '../../Common/PhoneWithCountry';
import { COUNTRIES } from '../../Common/Countries';
import CommonFormInput from '../../Common/CommonFormInput';
import CommonTextArea from '../../Common/CommonTextArea';
import CommonSelectField from '../../Common/CommonSelectField';
import CommonDatePicker from '../../Common/CommonDatePicker';
import {
  getLeadType,
  getTechnologies,
  createTechnology,
  getRegions,
  getBranches,
  getAllAreas,
  createArea,
  createLead,
  updateLead,
  getLeadStatus,
} from '../../ApiService/action';
import AsyncStorage from '@react-native-async-storage/async-storage';

const followupStatusOptions = [
  { id: 1, name: 'Hot Follow Up' },
  { id: 7, name: 'Cold Follow Up' },
  { id: 8, name: 'Interested' },
  { id: 9, name: 'Only Enquiry' },
  { id: 10, name: 'Hold' },
  { id: 11, name: 'No Response' },
  { id: 6, name: 'Others' },
];

export default function AddLead({ navigation, route }) {
  const dispatch = useDispatch();
  const editLeadData = route?.params?.lead;
  const isEditMode = !!editLeadData;

  const permissions = useSelector(state => state.userpermissions || []);
  const courseList = useSelector(state => state.courselist || []);
  const areasOptions = useSelector(state => state.arealist || []);

  // Form Fields State
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileDialCode, setMobileDialCode] = useState('91');
  const [mobileCountryCode, setMobileCountryCode] = useState('in');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappDialCode, setWhatsappDialCode] = useState('91');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('in');
  const [leadSource, setLeadSource] = useState(null);
  const [country, setCountry] = useState({ name: 'India', code: 'in' });
  const [state, setState] = useState({ name: 'Tamil Nadu', code: 'TN' });
  const [stateOptions, setStateOptions] = useState(STATE_DATA['in'] || []);
  const [area, setArea] = useState(null);
  const [primaryCourse, setPrimaryCourse] = useState(null);
  const [fees, setFees] = useState('');
  const [addCourse, setAddCourse] = useState(false);
  const [region, setRegion] = useState(null);
  const [branch, setBranch] = useState(null);
  const [batchTrack, setBatchTrack] = useState({ id: 1, name: 'Normal' });
  const [leadStatus, setLeadStatus] = useState(null);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(null);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [followupStatus, setFollowupStatus] = useState(null);
  const [expectedDateJoin, setExpectedDateJoin] = useState(null);
  const [showExpectedDatePicker, setShowExpectedDatePicker] = useState(false);
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState({});

  // API Lists State
  const [leadTypeOptions, setLeadTypeOptions] = useState([]);
  const [regionsOptions, setRegionsOptions] = useState([]);
  const [branchesOptions, setBranchesOptions] = useState([]);
  const [leadStatusOptions, setLeadStatusOptions] = useState([]);
  // UI / Modal States
  const [screenLoading, setScreenLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({
    title: '',
    items: [],
    onSelect: () => {},
    searchPlaceholder: '',
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalConfig, setAddModalConfig] = useState({
    title: '',
    label: '',
    placeholder: '',
    onSave: () => {},
  });
  const [newItemName, setNewItemName] = useState('');
  const [newItemLoading, setNewItemLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Pre-fill fields for editing
  useEffect(() => {
    if (isEditMode) {
      console.log('editLeadData', editLeadData);

      setCandidateName(editLeadData.name || '');
      setEmail(editLeadData.email || '');

      const targetPhoneCode = editLeadData.phone_code
        ? String(editLeadData.phone_code).startsWith('+')
          ? String(editLeadData.phone_code)
          : `+${editLeadData.phone_code}`
        : null;
      const foundMob =
        COUNTRIES.find(c => c.prefix === targetPhoneCode) ||
        COUNTRIES.find(c => c.code === 'in');
      setMobileDialCode(
        editLeadData.phone_code
          ? String(editLeadData.phone_code).replace('+', '')
          : '91',
      );
      setMobileCountryCode(foundMob ? foundMob.code : 'in');
      setMobileNumber(editLeadData.phone || '');

      const targetWAPhoneCode = editLeadData.whatsapp_phone_code
        ? String(editLeadData.whatsapp_phone_code).startsWith('+')
          ? String(editLeadData.whatsapp_phone_code)
          : `+${editLeadData.whatsapp_phone_code}`
        : null;
      const foundWA =
        COUNTRIES.find(c => c.prefix === targetWAPhoneCode) ||
        COUNTRIES.find(c => c.code === 'in');
      setWhatsappDialCode(
        editLeadData.whatsapp_phone_code
          ? String(editLeadData.whatsapp_phone_code).replace('+', '')
          : '91',
      );
      setWhatsappCountryCode(foundWA ? foundWA.code : 'in');
      setWhatsappNumber(
        editLeadData.whatsapp || editLeadData.whatsapp_no || '',
      );

      const defaultCountryCode = editLeadData.country
        ? editLeadData.country.toLowerCase()
        : 'in';
      const foundCountry = COUNTRIES.find(
        c =>
          c.code.toLowerCase() === defaultCountryCode ||
          c.name.toLowerCase() === defaultCountryCode,
      ) || { name: 'India', code: 'in' };
      setCountry(foundCountry);

      const stateCode = editLeadData.state
        ? editLeadData.state.toUpperCase()
        : 'TN';
      const availableStates = STATE_DATA[foundCountry.code] || [];
      const foundState = availableStates.find(
        s => s.code === stateCode || s.name.toUpperCase() === stateCode,
      ) || { name: 'Tamil Nadu', code: 'TN' };
      setState(foundState);
      setStateOptions(availableStates);
      setFees(
        editLeadData.primary_fees
          ? String(editLeadData.primary_fees)
          : editLeadData.fees
          ? String(editLeadData.fees)
          : '',
      );
      setBatchTrack({
        id: editLeadData.batch_track_id || 1,
        name: editLeadData.batch_track || 'Normal',
      });

      if (editLeadData.next_follow_up_date || editLeadData.next_followup_date) {
        setNextFollowUpDate(
          new Date(
            editLeadData.next_follow_up_date || editLeadData.next_followup_date,
          ),
        );
      }

      const foundFollowup = followupStatusOptions.find(
        x =>
          x.id === editLeadData.lead_status_id ||
          x.name === editLeadData.followup_status ||
          x.name === editLeadData.lead_action_name,
      );
      if (foundFollowup) setFollowupStatus(foundFollowup);

      if (editLeadData.expected_date_join || editLeadData.expected_join_date) {
        setExpectedDateJoin(
          new Date(
            editLeadData.expected_date_join || editLeadData.expected_join_date,
          ),
        );
      }

      setComments(editLeadData.comments || editLeadData.comment || '');
    }
  }, [editLeadData, isEditMode]);

  // Dynamic API Option loading chain
  const getBranchData = async region_id => {
    const payload = {
      region_id: region_id,
    };
    try {
      const response = await getBranches(payload);
      const list = response?.data?.result || [];
      setBranchesOptions(list);
      if (isEditMode && editLeadData.branch_id) {
        const found = list.find(x => x.id === editLeadData.branch_id);
        if (found) setBranch(found);
      }
    } catch (error) {
      console.log('branch error', error);
    }
  };

  const getRegionData = async () => {
    try {
      const response = await getRegions();
      const list = response?.data?.data || [];
      setRegionsOptions(list);
      if (isEditMode && editLeadData.region_id) {
        const found = list.find(x => x.id === editLeadData.region_id);
        if (found) setRegion(found);
        if (editLeadData.region_id != 3) {
          getBranchData(editLeadData.region_id);
        }
      }
    } catch (error) {
      console.log('region error', error);
    }
  };

  const getAreasData = async () => {
    try {
      const response = await getAllAreas();
      const list = response?.data?.data || [];
      dispatch(storeAreaList(list));
      if (isEditMode && (editLeadData.area_id || editLeadData.district)) {
        const found = list.find(
          x =>
            x.id === editLeadData.area_id ||
            x.name === editLeadData.area_id ||
            x.name === editLeadData.district,
        );
        if (found) setArea(found);
      }
    } catch (error) {
      dispatch(storeAreaList([]));
      console.log('areas error', error);
    } finally {
      setTimeout(() => {
        getRegionData();
        getLeadStatusData();
      }, 300);
    }
  };

  const getLeadStatusData = async () => {
    try {
      const response = await getLeadStatus();
      const list = response?.data?.result || [];
      setLeadStatusOptions(list);
      if (isEditMode) {
        const targetStatusId =
          editLeadData.lead_status_id || editLeadData.lead_status;
        const found = list.find(
          x => x.id === targetStatusId || x.name === targetStatusId,
        );
        if (found) setLeadStatus(found);
      }
    } catch (error) {
      console.log('lead status fetch error', error);
    }
  };

  const getCourseData = async () => {
    try {
      const response = await getTechnologies();
      const list = response?.data?.data || [];
      dispatch(storeCourseList(list));
      if (
        isEditMode &&
        (editLeadData.primary_course_id || editLeadData.course_id)
      ) {
        const targetCourseId =
          editLeadData.primary_course_id || editLeadData.course_id;

        const found = list.find(x => x.id === targetCourseId);

        if (found) setPrimaryCourse(found);
      }
    } catch (error) {
      dispatch(storeCourseList([]));
      console.log('course error', error);
    } finally {
      setTimeout(() => {
        getAreasData();
      }, 300);
    }
  };

  const getLeadTypeData = async () => {
    try {
      const response = await getLeadType();
      const lead_status = response?.data?.result || [];
      const update_lead_status = lead_status.map(item => {
        if (item.name === 'Whatsapp') {
          return {
            ...item,
            is_active: permissions.includes('Whatsapp Lead Source') ? 1 : 0,
          };
        } else {
          return { ...item, is_active: 1 };
        }
      });
      setLeadTypeOptions(update_lead_status);
      if (
        isEditMode &&
        (editLeadData.lead_type_id || editLeadData.lead_source)
      ) {
        const targetLeadSource =
          editLeadData.lead_type_id || editLeadData.lead_source;
        const found = update_lead_status.find(x => x.id === targetLeadSource);
        if (found) setLeadSource(found);
      }
    } catch (error) {
      setLeadTypeOptions([]);
      console.log('lead type error', error);
    } finally {
      setTimeout(() => {
        getCourseData();
      }, 300);
    }
  };

  useEffect(() => {
    const initLoad = async () => {
      setScreenLoading(true);
      await getLeadTypeData();
      setScreenLoading(false);
    };
    initLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search & Filter Picker modal trigger
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
      })),
      onSelect,
      searchPlaceholder,
      selectedValue,
    });
    setPickerModalVisible(true);
  };

  // Quick addition modals for Areas and Technologies (Courses)
  const showAddModal = (title, label, placeholder, onSave) => {
    setNewItemName('');
    setAddModalConfig({ title, label, placeholder, onSave });
    setAddModalVisible(true);
  };

  const handleSaveNewArea = async name => {
    if (!name.trim()) return;
    setNewItemLoading(true);
    try {
      const payload = { area_name: name };
      const res = await createArea(payload);
      CommonMessage('success', 'Area added successfully');
      // Refresh Areas options
      const response = await getAllAreas();
      const newList = response?.data?.data || [];
      dispatch(storeAreaList(newList));

      // Auto select the new area
      const newlyCreated =
        newList.find(x => x.name.toLowerCase() === name.toLowerCase()) ||
        newList[newList.length - 1];
      if (newlyCreated) setArea(newlyCreated);

      setAddModalVisible(false);
    } catch (error) {
      CommonMessage(
        'error',
        error?.response?.data?.details || 'Failed to add area',
      );
    } finally {
      setNewItemLoading(false);
    }
  };

  const handleSaveNewCourse = async name => {
    if (!name.trim()) return;
    setNewItemLoading(true);
    try {
      const payload = { course_name: name };
      const res = await createTechnology(payload);
      CommonMessage('success', 'Course added successfully');
      // Refresh Courses list
      const response = await getTechnologies();
      const newList = response?.data?.data || [];
      dispatch(storeCourseList(newList));

      // Auto select the new course
      const newlyCreated =
        newList.find(x => x.name.toLowerCase() === name.toLowerCase()) ||
        newList[newList.length - 1];
      if (newlyCreated) setPrimaryCourse(newlyCreated);

      setAddModalVisible(false);
    } catch (error) {
      CommonMessage(
        'error',
        error?.response?.data?.details || 'Failed to add course',
      );
    } finally {
      setNewItemLoading(false);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!candidateName.trim()) {
      newErrors.candidateName = 'Please enter Candidate Name';
      isValid = false;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 8) {
      newErrors.mobileNumber = 'Please enter a valid Mobile Number';
      isValid = false;
    }
    if (!whatsappNumber.trim() || whatsappNumber.length < 8) {
      newErrors.whatsappNumber = 'Please enter a valid WhatsApp Number';
      isValid = false;
    }
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'Please enter a valid Email';
      isValid = false;
    }
    if (!leadSource) {
      newErrors.leadSource = 'Please select Lead Source';
      isValid = false;
    }
    if (!area) {
      newErrors.area = 'Please select Area';
      isValid = false;
    }
    if (!primaryCourse) {
      newErrors.primaryCourse = 'Please select Primary Course';
      isValid = false;
    }
    if (!fees.trim()) {
      newErrors.fees = 'Please enter Course Fees';
      isValid = false;
    }
    if (!region) {
      newErrors.region = 'Please select Region';
      isValid = false;
    }
    if (!branch) {
      if (region.id != 3) {
        newErrors.branch = 'Please select Branch';
        isValid = false;
      }
    }
    if (!leadStatus) {
      newErrors.leadStatus = 'Please select Lead Status';
      isValid = false;
    }
    if (!nextFollowUpDate) {
      newErrors.nextFollowUpDate = 'Please select Next Follow-Up Date';
      isValid = false;
    }
    if (!followupStatus) {
      newErrors.followupStatus = 'Please select Followup Status';
      isValid = false;
    }
    if (!comments.trim()) {
      newErrors.comments = 'Please enter Comments';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      CommonMessage('error', 'Please fill all required fields correctly');
    }

    return isValid;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    // setSubmitLoading(true);
    const today = new Date();
    const getLoginUserDetails = await AsyncStorage.getItem('loginUserDetails');
    const convertAsJson = JSON.parse(getLoginUserDetails);
    console.log('convertAsJson', convertAsJson);

    const payload = {
      ...(isEditMode && { lead_id: editLeadData.id || editLeadData.lead_id }),
      user_id: convertAsJson?.user_id || '',
      name: candidateName,
      phone_code: mobileDialCode,
      phone: mobileNumber,
      whatsapp_phone_code: whatsappDialCode,
      whatsapp: whatsappNumber,
      email: email,
      country: country?.code ? country.code.toUpperCase() : null,
      state: state?.code ? state.code : null,
      district: area?.name,
      primary_course_id: primaryCourse.course_id || primaryCourse.id,
      primary_fees: fees,
      price_category: priceCategory(fees),
      secondary_course_id: null,
      secondary_fees: 0,
      domain_origin:
        isEditMode && editLeadData.domain_origin
          ? editLeadData.domain_origin
          : 'Direct',
      lead_type_id: leadSource.id,
      lead_status_id: leadStatus.id,
      lead_action_id: followupStatus.id,
      ...(isEditMode && {
        is_previous_junk:
          (editLeadData.lead_status_id === 4 ||
            editLeadData.lead_status_id === 5) &&
          leadStatus.id !== 4 &&
          leadStatus.id !== 5,
      }),
      next_follow_up_date: nextFollowUpDate
        ? formatToBackendIST(nextFollowUpDate)
        : null,
      expected_join_date: expectedDateJoin
        ? formatToBackendIST(expectedDateJoin)
        : null,
      region_id: region.region_id || region.id,
      branch_id: branch ? branch.id : '',
      batch_track_id: batchTrack && batchTrack.id,
      comments: comments,
      is_reentry: false,
      created_date: formatToBackendIST(today),
      is_manager: permissions.includes('Add Lead With Existing Mobile Number')
        ? true
        : false,
    };
    console.log('payload', payload);

    try {
      let res;
      if (isEditMode) {
        payload.lead_id = editLeadData.id || editLeadData.lead_id;
        res = await updateLead(payload);
        CommonMessage('success', 'Lead updated successfully');
      } else {
        res = await createLead(payload);
        CommonMessage('success', 'Lead created successfully');
      }
      formReset();
    } catch (error) {
      console.log('Form Submit error', error.response);
      CommonMessage(
        'error',
        isEditMode
          ? 'Failed to update lead'
          : error?.response?.data?.details || 'Failed to create lead',
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredPickerItems = pickerConfig.items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formReset = () => {
    setCandidateName('');
    setEmail('');
    setMobileNumber('');
    setMobileDialCode('91');
    setMobileCountryCode('in');
    setWhatsappNumber('');
    setWhatsappDialCode('91');
    setWhatsappCountryCode('in');
    setLeadSource(null);
    setCountry({ name: 'India', code: 'in' });
    setState({ name: 'Tamil Nadu', code: 'TN' });
    setStateOptions(STATE_DATA['in'] || []);
    setArea(null);
    setPrimaryCourse(null);
    setFees('');
    setAddCourse(false);
    setRegion(null);
    setBranch(null);
    setBatchTrack({ id: 1, name: 'Normal' });
    setLeadStatus(null);
    setNextFollowUpDate(null);
    setShowNextDatePicker(false);
    setFollowupStatus(null);
    setExpectedDateJoin(null);
    setShowExpectedDatePicker(false);
    setComments('');
    setErrors({});
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header bar */}
        <View style={styles.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
            >
              <Icon name="close" size={24} color="#1A3353" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Lead Manager')}
              style={styles.closeBtn}
            >
              <Icon name="chevron-back" size={24} color="#1A3353" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Lead' : 'Add Lead'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information section */}
          <Text style={styles.sectionHeading}>Basic Information</Text>

          <View style={styles.card}>
            {/* Candidate Name Input */}
            <CommonFormInput
              label="Candidate Name *"
              placeholder="Candidate Name"
              value={candidateName}
              onChangeText={setCandidateName}
              error={errors.candidateName}
            />

            {/* Mobile Number Field */}
            <PhoneWithCountry
              label="Mobile Number *"
              value={mobileNumber}
              onChange={setMobileNumber}
              selectedCountry={mobileCountryCode}
              countryCode={setMobileDialCode}
              onCountryChange={setMobileCountryCode}
              error={errors.mobileNumber}
            />

            {/* WhatsApp Number Field */}
            <PhoneWithCountry
              label="WhatsApp Number *"
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              selectedCountry={whatsappCountryCode}
              countryCode={setWhatsappDialCode}
              onCountryChange={setWhatsappCountryCode}
              error={errors.whatsappNumber}
            />

            {/* Email Input */}
            <CommonFormInput
              label="Email *"
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            {/* Lead Source Selector */}
            <CommonSelectField
              label="Lead Source *"
              placeholder="Select Lead Source"
              selectedValue={leadSource ? leadSource.name : null}
              onPress={() =>
                showPicker(
                  'Select Lead Source',
                  leadTypeOptions.filter(x => x.is_active === 1),
                  'name',
                  item => {
                    setLeadSource(item);
                    setPickerModalVisible(false);
                    setErrors(prev => ({ ...prev, leadSource: null }));
                  },
                  'Search lead sources...',
                  leadSource ? leadSource.name : null,
                )
              }
              error={errors.leadSource}
            />

            {/* Country Input / Selector */}
            <CommonSelectField
              label="Country *"
              placeholder="Select Country"
              selectedValue={country ? country.name : null}
              onPress={() =>
                showPicker(
                  'Select Country',
                  COUNTRIES,
                  'name',
                  item => {
                    setCountry(item);
                    setState(null);
                    setStateOptions(STATE_DATA[item.code] || []);
                    setPickerModalVisible(false);
                  },
                  'Search countries...',
                  country ? country.name : null,
                )
              }
            />

            {/* State Input / Selector */}
            <CommonSelectField
              label="State *"
              placeholder="Select State"
              selectedValue={state ? state.name : null}
              onPress={() =>
                showPicker(
                  'Select State',
                  stateOptions,
                  'name',
                  item => {
                    setState(item);
                    setPickerModalVisible(false);
                  },
                  'Search states...',
                  state ? state.name : null,
                )
              }
            />

            {/* Area Selector with "+" Quick Add Button */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area *</Text>
              <View style={styles.selectorRow}>
                <CommonSelectField
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  placeholder="Select Area"
                  selectedValue={area ? area.name : null}
                  onPress={() =>
                    showPicker(
                      'Select Area',
                      areasOptions,
                      'name',
                      item => {
                        setArea(item);
                        setPickerModalVisible(false);
                        setErrors(prev => ({ ...prev, area: null }));
                      },
                      'Search areas...',
                      area ? area.name : null,
                    )
                  }
                  error={errors.area}
                />
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() =>
                    showAddModal(
                      'Add Area',
                      'Area Name',
                      'Enter area name',
                      handleSaveNewArea,
                    )
                  }
                >
                  <Icon name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Course Details section */}
          <Text style={styles.sectionHeading}>Course Details</Text>

          <View style={styles.card}>
            {/* Primary Course with "+" Quick Add Button */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Primary Course *</Text>
              <View style={styles.selectorRow}>
                <CommonSelectField
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                  placeholder="Select Course"
                  selectedValue={primaryCourse ? primaryCourse.name : null}
                  onPress={() =>
                    showPicker(
                      'Select Course',
                      courseList,
                      'name',
                      item => {
                        setPrimaryCourse(item);
                        setPickerModalVisible(false);
                        setErrors(prev => ({ ...prev, primaryCourse: null }));
                      },
                      'Search courses...',
                      primaryCourse ? primaryCourse.name : null,
                    )
                  }
                  error={errors.primaryCourse}
                />
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() =>
                    showAddModal(
                      'Add Course',
                      'Course Name',
                      'Enter course name',
                      handleSaveNewCourse,
                    )
                  }
                >
                  <Icon name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Course Fees Input */}
            <CommonFormInput
              label="Fees *"
              placeholder="Course Fees"
              keyboardType="numeric"
              value={fees}
              onChangeText={setFees}
              error={errors.fees}
            />

            {/* Region Selector */}
            <CommonSelectField
              label="Region *"
              placeholder="Select Region"
              selectedValue={region ? region.name : null}
              onPress={() =>
                showPicker(
                  'Select Region',
                  regionsOptions,
                  'name',
                  item => {
                    setRegion(item);
                    setPickerModalVisible(false);
                    setErrors(prev => ({ ...prev, region: null }));
                    if (item.id != 3) {
                      getBranchData(item.id);
                    } else {
                      setBranch(null);
                    }
                  },
                  'Search regions...',
                  region ? region.name : null,
                )
              }
              error={errors.region}
            />

            {/* Branch Name Selector */}
            {region?.id != 3 && (
              <CommonSelectField
                label="Branch Name *"
                placeholder="Select Branch"
                selectedValue={branch ? branch.name : null}
                onPress={() =>
                  showPicker(
                    'Select Branch',
                    branchesOptions,
                    'name',
                    item => {
                      setBranch(item);
                      setPickerModalVisible(false);
                      setErrors(prev => ({ ...prev, branch: null }));
                    },
                    'Search branches...',
                    branch ? branch.name : null,
                  )
                }
                error={errors.branch}
              />
            )}

            {/* Batch Track Selector */}
            <CommonSelectField
              label="Batch Track *"
              placeholder="Select Batch"
              selectedValue={
                batchTrack
                  ? typeof batchTrack === 'string'
                    ? batchTrack
                    : batchTrack.name
                  : null
              }
              onPress={() =>
                showPicker(
                  'Select Batch Track',
                  [
                    {
                      id: 1,
                      name: 'Normal',
                    },
                    {
                      id: 2,
                      name: 'Fastrack',
                    },
                    {
                      id: 3,
                      name: 'Custom',
                    },
                  ],
                  'name',
                  item => {
                    setBatchTrack(item);
                    setPickerModalVisible(false);
                  },
                  'Search batch tracks...',
                  batchTrack
                    ? typeof batchTrack === 'string'
                      ? batchTrack
                      : batchTrack.name
                    : null,
                )
              }
            />
          </View>

          {/* Response Status Section */}
          <Text style={styles.sectionHeading}>Response Status</Text>
          <View style={styles.card}>
            {/* Lead Status Selector */}
            <CommonSelectField
              label="Lead Status *"
              placeholder="Select Status"
              selectedValue={leadStatus ? leadStatus.name : null}
              onPress={() =>
                showPicker(
                  'Select Lead Status',
                  leadStatusOptions,
                  'name',
                  item => {
                    setLeadStatus(item);
                    setPickerModalVisible(false);
                    setErrors(prev => ({ ...prev, leadStatus: null }));
                  },
                  'Search status...',
                  leadStatus ? leadStatus.name : null,
                )
              }
              error={errors.leadStatus}
            />

            {/* Next Follow-Up Date Selector */}
            <CommonDatePicker
              label="Next Follow-Up Date *"
              placeholder="Select Date"
              value={nextFollowUpDate}
              onDateChange={val => {
                setNextFollowUpDate(val);
                if (val)
                  setErrors(prev => ({ ...prev, nextFollowUpDate: null }));
              }}
              error={errors.nextFollowUpDate}
            />

            {/* Followup Status (Lead Action) Selector */}
            <CommonSelectField
              label="Followup Status *"
              placeholder="Select Followup Status"
              selectedValue={followupStatus ? followupStatus.name : null}
              onPress={() =>
                showPicker(
                  'Select Followup Status',
                  followupStatusOptions,
                  'name',
                  item => {
                    setFollowupStatus(item);
                    setPickerModalVisible(false);
                    setErrors(prev => ({ ...prev, followupStatus: null }));
                  },
                  'Search followup status...',
                  followupStatus ? followupStatus.name : null,
                )
              }
              error={errors.followupStatus}
            />

            {/* Expected Date Join Selector */}
            <CommonDatePicker
              label="Expected Date Join"
              placeholder="Select Date"
              value={expectedDateJoin}
              onDateChange={setExpectedDateJoin}
            />

            {/* Comments Selector */}
            <CommonTextArea
              label="Comments *"
              placeholder="Type here..."
              value={comments}
              onChangeText={val => {
                setComments(val);
                if (val) setErrors(prev => ({ ...prev, comments: null }));
              }}
              error={errors.comments}
            />
          </View>

          {/* Form Submit Save Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleFormSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditMode ? 'Update Lead' : 'Save Lead'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Global Searchable Selection Dropdown Modal */}
      <Modal visible={pickerModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setPickerModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerModalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{pickerConfig.title}</Text>
                  <TouchableOpacity
                    onPress={() => setPickerModalVisible(false)}
                  >
                    <Icon name="close-outline" size={24} color="#1A3353" />
                  </TouchableOpacity>
                </View>

                {/* Search query input */}
                <View style={styles.modalSearchContainer}>
                  <Icon
                    name="search-outline"
                    size={18}
                    color="#7D8DA1"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder={pickerConfig.searchPlaceholder}
                    placeholderTextColor="#A0AEC0"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Icon name="close-circle" size={18} color="#A0AEC0" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Item lists */}
                <FlatList
                  data={filteredPickerItems}
                  keyExtractor={(item, index) => index.toString()}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItemRow,
                        item.label === pickerConfig.selectedValue && {
                          backgroundColor: '#F0F3F7',
                        },
                      ]}
                      onPress={() => pickerConfig.onSelect(item)}
                    >
                      {item.flag && (
                        <Text style={styles.pickerFlag}>{item.flag}</Text>
                      )}
                      <Text
                        style={[
                          styles.pickerItemLabel,
                          item.label === pickerConfig.selectedValue && {
                            color: '#5D6AD1',
                            fontWeight: 'bold',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.prefix && (
                        <Text style={styles.pickerPrefix}>{item.prefix}</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyListText}>
                      No items matched your search.
                    </Text>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Quick Add Modal Dialog */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setAddModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.addModalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{addModalConfig.title}</Text>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                    <Icon name="close-outline" size={24} color="#1A3353" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>{addModalConfig.label}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={addModalConfig.placeholder}
                    placeholderTextColor="#A0AEC0"
                    value={newItemName}
                    onChangeText={setNewItemName}
                    autoFocus
                  />
                </View>

                <View style={styles.addModalFooter}>
                  <TouchableOpacity
                    style={[styles.addModalButton, styles.cancelBtn]}
                    onPress={() => setAddModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addModalButton, styles.saveBtn]}
                    onPress={() => addModalConfig.onSave(newItemName)}
                    disabled={newItemLoading || !newItemName.trim()}
                  >
                    {newItemLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#667C94',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8EE',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3353',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5D6AD1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#1A3353',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAF0F6',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A3353',
    backgroundColor: '#FFFFFF',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  flagText: {
    fontSize: 20,
    marginRight: 4,
  },
  prefixCode: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F7FAFC',
    marginRight: 8,
  },
  prefixText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },
  pickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerValue: {
    fontSize: 14,
    color: '#1A3353',
  },
  placeholderText: {
    color: '#A0AEC0',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAddButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#5D6AD1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#5D6AD1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  submitBtn: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#5D6AD1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5D6AD1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 51, 83, 0.4)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    // padding: 16,
    paddingBottom: 30,
  },
  addModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignSelf: 'center',
    width: '90%',
    position: 'absolute',
    top: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3353',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A3353',
    paddingVertical: 8,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  pickerFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  pickerItemLabel: {
    fontSize: 14,
    color: '#1A3353',
    flex: 1,
  },
  pickerPrefix: {
    fontSize: 14,
    color: '#7D8DA1',
    fontWeight: '500',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginTop: 20,
    fontSize: 14,
  },
  addModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  addModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0F3F7',
  },
  cancelBtnText: {
    color: '#4A5568',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#5D6AD1',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
