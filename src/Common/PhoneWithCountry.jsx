import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COUNTRIES } from './Countries';
import { useTheme } from '../Context/ThemeContext';

const { height: screenHeight } = Dimensions.get('window');

export default function PhoneWithCountry({
  onChange,
  value,
  label,
  error,
  labelFontSize,
  height,
  borderLeftNone,
  countryCode,
  onCountryChange,
  selectedCountry,
  disabled = false,
  disableCountrySelect = false,
  errorFontSize,
  ...restProps
}) {
  const { theme } = useTheme();

  const [internalValue, setInternalValue] = useState('');
  const [country, setCountry] = useState(() => {
    const defaultISO = selectedCountry ? selectedCountry.toLowerCase() : 'in';
    return (
      COUNTRIES.find(c => c.code === defaultISO) ||
      COUNTRIES.find(c => c.code === 'in')
    );
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const prevDialCodeRef = useRef(country.prefix.replace('+', ''));
  const typingRef = useRef(false);

  useEffect(() => {
    if (country && countryCode) countryCode(country.prefix.replace('+', ''));
  }, [country, countryCode]);

  useEffect(() => {
    if (selectedCountry && selectedCountry.toLowerCase() !== country.code) {
      const found = COUNTRIES.find(
        c => c.code === selectedCountry.toLowerCase(),
      );
      if (found) setCountry(found);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (!typingRef.current && value !== undefined) {
      const cleanPrefix = country.prefix;
      const newValue = `${cleanPrefix} ${value || ''}`;
      if (newValue !== internalValue) setInternalValue(newValue);
      prevDialCodeRef.current = country.prefix.replace('+', '');
    }
  }, [value, country]);

  const handleInputChange = text => {
    typingRef.current = true;
    const cleanPrefix = country.prefix;
    const dialCodeStr = `${cleanPrefix} `;
    if (text.length <= dialCodeStr.length) {
      setInternalValue(dialCodeStr);
      onChange?.('');
      setTimeout(() => {
        typingRef.current = false;
      }, 0);
      return;
    }
    let afterCode = text
      .slice(dialCodeStr.length)
      .replace(/\D/g, '')
      .replace(/^0+/, '');
    if (text.startsWith(dialCodeStr)) {
      setInternalValue(dialCodeStr + afterCode);
      onChange?.(afterCode);
    } else {
      const onlyDigits = text.replace(/\D/g, '').replace(/^0+/, '');
      setInternalValue(dialCodeStr + onlyDigits);
      onChange?.(onlyDigits);
    }
    setTimeout(() => {
      typingRef.current = false;
    }, 0);
  };

  const handleCountrySelect = selectedItem => {
    setCountry(selectedItem);
    onCountryChange?.(selectedItem.code);
    setModalVisible(false);
    const rawNumber = internalValue.replace(`${country.prefix} `, '');
    setInternalValue(`${selectedItem.prefix} ${rawNumber || ''}`);
    prevDialCodeRef.current = selectedItem.prefix.replace('+', '');
    onChange?.(rawNumber || '');
    countryCode?.(selectedItem.prefix.replace('+', ''));
  };

  const filteredCountries = COUNTRIES.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prefix.includes(searchQuery),
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: theme.textSecondary },
            labelFontSize ? { fontSize: labelFontSize } : null,
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? theme.error : theme.border,
            backgroundColor: disabled ? theme.surfaceSecondary : theme.surface,
          },
        ]}
      >
        <TouchableOpacity
          disabled={disabled || disableCountrySelect}
          style={styles.flagSelector}
          onPress={() => {
            setSearchQuery('');
            setModalVisible(true);
          }}
        >
          <Text style={styles.flagText}>{country.flag}</Text>
          <Icon
            name="caret-down"
            size={14}
            color={theme.textSecondary}
            style={styles.caretIcon}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TextInput
          style={[
            styles.textInput,
            { color: disabled ? theme.textMuted : theme.textPrimary },
          ]}
          value={internalValue}
          onChangeText={handleInputChange}
          keyboardType="phone-pad"
          editable={!disabled}
          maxLength={18}
          placeholder={`${country.prefix} 10-digit number`}
          placeholderTextColor={theme.textMuted}
          cursorColor={theme.primary}
          {...restProps}
        />
      </View>

      {error ? (
        <Text
          style={[
            styles.errorText,
            { color: theme.error },
            errorFontSize ? { fontSize: errorFontSize } : null,
          ]}
        >
          {label} {error}
        </Text>
      ) : null}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
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
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: theme.textPrimary }]}
                  >
                    Select Country
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={24} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.searchContainer,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                >
                  <Icon
                    name="search-outline"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Search countries..."
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

                <FlatList
                  data={filteredCountries}
                  keyExtractor={item => item.code}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.countryRow,
                        { borderBottomColor: theme.borderLight },
                      ]}
                      onPress={() => handleCountrySelect(item)}
                    >
                      <Text style={styles.rowFlag}>{item.flag}</Text>
                      <Text
                        style={[styles.rowName, { color: theme.textPrimary }]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.rowPrefix,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {item.prefix}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={[styles.emptyText, { color: theme.textMuted }]}
                    >
                      No countries matched your search.
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
  container: { marginBottom: 16, width: '100%' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  flagSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  },
  flagText: { fontSize: 22 },
  caretIcon: { marginLeft: 4 },
  divider: { width: 1, height: '60%' },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.75,
    padding: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  closeButton: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowFlag: { fontSize: 20, marginRight: 12 },
  rowName: { fontSize: 14, flex: 1 },
  rowPrefix: { fontSize: 14, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
});
