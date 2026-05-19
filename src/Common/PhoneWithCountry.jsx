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

const { height: screenHeight } = Dimensions.get('window');

export default function PhoneWithCountry({
  onChange,
  value, // raw number from parent (e.g. "9876543210")
  label,
  error,
  labelFontSize,
  height,
  borderLeftNone,
  countryCode, // Callback for dial code: e.g. (dialCode) => ...
  onCountryChange, // Callback for country ISO code: e.g. (iso2) => ...
  selectedCountry, // e.g. "in"
  disabled = false,
  disableCountrySelect = false,
  errorFontSize,
  ...restProps
}) {
  const [internalValue, setInternalValue] = useState('');
  const [country, setCountry] = useState(() => {
    const defaultISO = selectedCountry ? selectedCountry.toLowerCase() : 'in';
    return COUNTRIES.find(c => c.code === defaultISO) || COUNTRIES.find(c => c.code === 'in');
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const prevDialCodeRef = useRef(country.prefix.replace('+', ''));
  const typingRef = useRef(false);

  // Trigger countryCode callback initially
  useEffect(() => {
    if (country && countryCode) {
      countryCode(country.prefix.replace('+', ''));
    }
  }, [country, countryCode]);

  // Sync selectedCountry prop with internal state
  useEffect(() => {
    if (selectedCountry && selectedCountry.toLowerCase() !== country.code) {
      const found = COUNTRIES.find(c => c.code === selectedCountry.toLowerCase());
      if (found) {
        setCountry(found);
      }
    }
  }, [selectedCountry]);

  // Sync internal value when parent value changes
  useEffect(() => {
    if (!typingRef.current && value !== undefined) {
      const cleanPrefix = country.prefix;
      const newValue = `${cleanPrefix} ${value || ''}`;
      if (newValue !== internalValue) {
        setInternalValue(newValue);
      }
      prevDialCodeRef.current = country.prefix.replace('+', '');
    }
  }, [value, country]);

  // Handle manual input text changes
  const handleInputChange = (text) => {
    typingRef.current = true;
    const cleanPrefix = country.prefix;
    const dialCodeStr = `${cleanPrefix} `;

    // If user deletes everything or tries to delete the dial code
    if (text.length <= dialCodeStr.length) {
      setInternalValue(dialCodeStr);
      onChange?.('');
      setTimeout(() => {
        typingRef.current = false;
      }, 0);
      return;
    }

    // Extract raw text after the dial code, stripping nondigits and leading zeros
    let afterCode = text.slice(dialCodeStr.length).replace(/\D/g, '').replace(/^0+/, '');

    if (text.startsWith(dialCodeStr)) {
      const valueToSet = dialCodeStr + afterCode;
      setInternalValue(valueToSet);
      onChange?.(afterCode);
    } else {
      const onlyDigits = text.replace(/\D/g, '').replace(/^0+/, '');
      const valueToSet = dialCodeStr + onlyDigits;
      setInternalValue(valueToSet);
      onChange?.(onlyDigits);
    }

    setTimeout(() => {
      typingRef.current = false;
    }, 0);
  };

  // Handle country selection
  const handleCountrySelect = (selectedItem) => {
    setCountry(selectedItem);
    onCountryChange?.(selectedItem.code);
    setModalVisible(false);

    const newDialCodeStr = selectedItem.prefix;
    const rawNumber = internalValue.replace(`${country.prefix} `, '');
    const newInternalValue = `${newDialCodeStr} ${rawNumber || ''}`;
    
    setInternalValue(newInternalValue);
    prevDialCodeRef.current = selectedItem.prefix.replace('+', '');
    
    onChange?.(rawNumber || '');
    countryCode?.(selectedItem.prefix.replace('+', ''));
  };

  const filteredCountries = COUNTRIES.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prefix.includes(searchQuery)
  );

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, labelFontSize ? { fontSize: labelFontSize } : null]}>{label}</Text>}
      
      <View style={[
        styles.inputWrapper,
        error ? styles.inputErrorBorder : null,
        disabled ? styles.disabledBg : null,
      ]}>
        <TouchableOpacity
          disabled={disabled || disableCountrySelect}
          style={styles.flagSelector}
          onPress={() => {
            setSearchQuery('');
            setModalVisible(true);
          }}
        >
          <Text style={styles.flagText}>{country.flag}</Text>
          <Icon name="caret-down" size={14} color="#7D8DA1" style={styles.caretIcon} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TextInput
          style={[styles.textInput, disabled ? styles.disabledText : null]}
          value={internalValue}
          onChangeText={handleInputChange}
          keyboardType="phone-pad"
          editable={!disabled}
          maxLength={18}
          placeholder={`${country.prefix} 10-digit number`}
          placeholderTextColor="#A0AEC0"
          {...restProps}
        />
      </View>

      {error ? (
        <Text style={[styles.errorText, errorFontSize ? { fontSize: errorFontSize } : null]}>
          {label} {error}
        </Text>
      ) : null}

      {/* Country Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Country</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Icon name="close" size={24} color="#1A3353" />
                  </TouchableOpacity>
                </View>

                {/* Search input inside modal */}
                <View style={styles.searchContainer}>
                  <Icon name="search-outline" size={18} color="#7D8DA1" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search countries..."
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

                {/* FlatList of countries */}
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.code}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.countryRow}
                      onPress={() => handleCountrySelect(item)}
                    >
                      <Text style={styles.rowFlag}>{item.flag}</Text>
                      <Text style={styles.rowName}>{item.name}</Text>
                      <Text style={styles.rowPrefix}>{item.prefix}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No countries matched your search.</Text>
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
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  inputErrorBorder: {
    borderColor: '#E53E3E',
  },
  disabledBg: {
    backgroundColor: '#F7FAFC',
  },
  flagSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 22,
  },
  caretIcon: {
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#CBD5E0',
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A3353',
    fontWeight: '500',
  },
  disabledText: {
    color: '#A0AEC0',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 51, 83, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3353',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A3353',
    paddingVertical: 8,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  rowFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  rowName: {
    fontSize: 14,
    color: '#1A3353',
    flex: 1,
  },
  rowPrefix: {
    fontSize: 14,
    color: '#7D8DA1',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginTop: 20,
    fontSize: 14,
  },
});
