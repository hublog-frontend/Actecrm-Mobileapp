import { StyleSheet, Dimensions } from 'react-native';

export const COLORS = {
  primary: '#5D6AD1', // The blue/purple from the button
  darkBlue: '#1A3353', // For ACTE logo and main text
  secondaryText: '#7D8DA1', // For subtitle and labels
  border: '#E2E8F0',
  background: '#FFFFFF',
  inputBg: '#F8FAFC',
  error: '#E53E3E',
  white: '#FFFFFF',
};

export const commonStyles = StyleSheet.create({
  common_textinput_inputGroup: {
    marginBottom: 20,
  },
  common_textinput_labelContainer: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  common_textinput_label: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  common_textinput_inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    height: 56,
    paddingHorizontal: 16,
  },
  common_textinput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkBlue,
    height: '100%',
  },
});
