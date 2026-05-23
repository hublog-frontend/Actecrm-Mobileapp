import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  SectionList,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../Context/ThemeContext';

export const PAYMENT_MODE_OPTIONS = [
  { id: 1, name: 'Cash', category: 'General' },
  { id: 4, name: 'UPI', category: 'General' },
  { id: 5, name: 'Razorpay', category: 'General' },
  { id: 6, name: 'Razorpay - UPI', category: 'General' },
  { id: 9, name: 'TDS', category: 'General' },
  { id: 3, name: 'SBI', category: 'Bank' },
  { id: 7, name: 'AXIS', category: 'Bank' },
  { id: 8, name: 'HDFC', category: 'Bank' },
  { id: 11, name: 'KOTAK', category: 'Bank' },
  { id: 2, name: 'SBI POS', category: 'POS' },
  { id: 10, name: 'Razorpay POS', category: 'POS' },
];

export const PAYMENT_MODE_CONVENIENCE_FEE_IDS = [2, 5, 10];

export const paymentModeRequiresConvenienceFee = modeId =>
  PAYMENT_MODE_CONVENIENCE_FEE_IDS.includes(modeId);

const groupOptions = (options, groupByField = 'category') => {
  const groups = {};
  options.forEach(option => {
    const key = option[groupByField] || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(option);
  });
  return Object.keys(groups).map(title => ({
    title,
    data: groups[title],
  }));
};

export default function CommonGroupedSelectField({
  label,
  required = false,
  options = PAYMENT_MODE_OPTIONS,
  value,
  onChange,
  optionLabel = 'name',
  optionValue = 'id',
  groupByField = 'category',
  placeholder = 'Select option',
  error,
  disabled = false,
  modalTitle = 'Select',
}) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedOption = useMemo(
    () => options.find(o => o[optionValue] === value) ?? null,
    [options, value, optionValue],
  );

  const sections = useMemo(
    () => groupOptions(options, groupByField),
    [options, groupByField],
  );

  const displayLabel = label ? (required ? `${label} *` : label) : '';

  const handleSelect = option => {
    onChange?.(option?.[optionValue] ?? null, option);
    setVisible(false);
  };

  return (
    <View style={styles.inputGroup}>
      {displayLabel ? (
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
          {displayLabel}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.pickerSelector,
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: disabled ? theme.surfaceSecondary : theme.surface,
          },
        ]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text
          style={[
            styles.pickerValue,
            {
              color: selectedOption ? theme.textPrimary : theme.textMuted,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.[optionLabel] || placeholder}
        </Text>
        <Icon
          name="chevron-down"
          size={18}
          color={disabled ? theme.textMuted : theme.textSecondary}
        />
      </TouchableOpacity>

      {error ? (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {`${label ?? ''} ${error}`}
        </Text>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme.surface },
                ]}
              >
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.textPrimary }]}
                  >
                    {modalTitle}
                  </Text>
                  <TouchableOpacity onPress={() => setVisible(false)}>
                    <Icon name="close" size={22} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <SectionList
                  sections={sections}
                  keyExtractor={item => String(item[optionValue])}
                  stickySectionHeadersEnabled
                  showsVerticalScrollIndicator={false}
                  renderSectionHeader={({ section: { title } }) => (
                    <View
                      style={[
                        styles.groupHeader,
                        { backgroundColor: theme.inputBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.groupHeaderText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {title}
                      </Text>
                    </View>
                  )}
                  renderItem={({ item }) => {
                    const isSelected =
                      item[optionValue] === selectedOption?.[optionValue];
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionRow,
                          {
                            borderBottomColor: theme.borderLight,
                            backgroundColor: isSelected
                              ? theme.primaryLight
                              : theme.surface,
                          },
                        ]}
                        onPress={() => handleSelect(item)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: isSelected
                                ? theme.primary
                                : theme.textPrimary,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {item[optionLabel]}
                        </Text>
                        {isSelected ? (
                          <Icon
                            name="checkmark"
                            size={18}
                            color={theme.primary}
                          />
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text
                      style={[
                        styles.emptyText,
                        { color: theme.textMuted },
                      ]}
                    >
                      No data found
                    </Text>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pickerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  pickerValue: { flex: 1, fontSize: 15, marginRight: 8 },
  errorText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionText: { fontSize: 15 },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    fontSize: 13,
  },
});
