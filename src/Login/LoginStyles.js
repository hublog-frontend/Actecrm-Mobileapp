import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#5D6AD1', // The blue/purple from the button
  darkBlue: '#1A3353', // For ACTE logo and main text
  secondaryText: '#7D8DA1', // For subtitle and labels
  border: '#E2E8F0',
  background: '#FFFFFF',
  inputBg: '#F8FAFC',
  white: '#FFFFFF',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  logoSection: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  logoImage: {
    width: 120,
    height: 48,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondaryText,
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkBlue,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  rememberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    fontSize: 15,
    color: COLORS.darkBlue,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
