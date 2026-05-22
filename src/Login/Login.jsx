import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonTextInput from '../Common/CommonTextInput';
import { CommonMessage } from '../Common/CommonMessage';
import { useDispatch } from 'react-redux';
import {
  LoginApi,
  getUserDownline,
  getUserPermissions,
} from '../ApiService/action';
import {
  storeChildUsers,
  storeDownlineUsers,
  storeUserPermissions,
} from '../Redux/Slice';
import {
  addressValidator,
  passwordValidator,
  formatToBackendIST,
} from '../Common/Validation';
import { useTheme } from '../Context/ThemeContext';

const logo = require('../assets/acte-logo.png');

const { height } = require('react-native').Dimensions.get('window');

const loginStyles = require('react-native').StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  logoSection: { marginBottom: 20, alignItems: 'flex-start' },
  logoImage: { width: 120, height: 48 },
  headerSection: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  formSection: { width: '100%' },
  eyeIcon: { padding: 8 },
  rememberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: { fontSize: 15, fontWeight: '500' },
  signInButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

const Login = ({ navigation }) => {
  const { theme } = useTheme();
  const [userId, setUserId] = useState('');
  const [userIdError, setUserIdError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationTrigger, setValidationTrigger] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadRememberedDetails = async () => {
      try {
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');
        if (savedRememberMe === 'true') {
          const savedUserId = await AsyncStorage.getItem('rememberedUserId');
          const savedPassword = await AsyncStorage.getItem(
            'rememberedPassword',
          );
          setUserId(savedUserId || '');
          setPassword(savedPassword || '');
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Failed to load remembered details', e);
      }
    };
    loadRememberedDetails();
  }, []);

  const handleUserIdChange = text => {
    setUserId(text);
    if (validationTrigger) {
      setUserIdError(addressValidator(text));
    }
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (validationTrigger) {
      setPasswordError(passwordValidator(text));
    }
  };

  const getUserDownlineData = async user_id => {
    let user_roles;
    try {
      const response = await getUserDownline(user_id);
      const child_users = response?.data?.data?.child_users || [];
      const downline_users = response?.data?.data?.downline_users || [];
      user_roles = response?.data?.data?.roles || [];
      dispatch(storeChildUsers(child_users));
      dispatch(storeDownlineUsers(downline_users));
    } catch (error) {
      setLoading(false);
      user_roles = [];
      dispatch(storeChildUsers([]));
      dispatch(storeDownlineUsers([]));
      console.log('user downline error', error);
    } finally {
      setTimeout(() => {
        getPermissionsData(user_roles);
      }, 300);
    }
  };

  const getPermissionsData = async user_roles => {
    const payload = {
      role_ids: user_roles,
    };
    try {
      const response = await getUserPermissions(payload);
      const permission = response?.data?.data || [];
      if (permission.length >= 1) {
        const updateData = permission.map(item => {
          return item.permission_name;
        });
        dispatch(storeUserPermissions(updateData));
      }
    } catch (error) {
      console.log('user permissions error', error);
    } finally {
      setTimeout(() => {
        navigation.replace('MainTabs');
        setLoading(false);
      }, 300);
    }
  };

  const handleSignIn = async () => {
    console.log('Hiiiii');

    setValidationTrigger(true);

    const emailValidate = addressValidator(userId);
    const passwordValidate = passwordValidator(password);

    setUserIdError(emailValidate);
    setPasswordError(passwordValidate);

    if (emailValidate || passwordValidate) return;

    setLoading(true);
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUserId', userId);
        await AsyncStorage.setItem('rememberedPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('rememberedUserId');
        await AsyncStorage.removeItem('rememberedPassword');
        await AsyncStorage.removeItem('rememberMe');
      }

      const payload = {
        user_id: userId,
        password: password,
        last_login_date: formatToBackendIST(new Date()),
        platform: 'mobile',
      };

      const response = await LoginApi(payload);
      console.log('login response', response);

      // Assuming response is already the data object from LoginApi
      const loginUserDetails = response?.data;

      // AccessToken is already stored inside LoginApi, but we can store other details here
      if (loginUserDetails) {
        await AsyncStorage.setItem('AccessToken', loginUserDetails.token);

        await AsyncStorage.setItem(
          'loginUserDetails',
          JSON.stringify(loginUserDetails?.data),
        );
      }

      // CommonMessage('success', 'Login successful!');
      await getUserDownlineData(loginUserDetails?.data?.user_id);
      DeviceEventEmitter.emit('callGetNotificationApi');
    } catch (error) {
      setLoading(false);
      console.log('login error', error);
      CommonMessage(
        'error',
        error?.response?.data?.details ||
          'Something went wrong. Try again later',
      );
    } finally {
      // setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[loginStyles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={loginStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={loginStyles.logoSection}>
            <Image
              source={logo}
              style={loginStyles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <View style={loginStyles.headerSection}>
            <Text style={[loginStyles.title, { color: theme.textPrimary }]}>
              Sign In
            </Text>
            <Text
              style={[loginStyles.subtitle, { color: theme.textSecondary }]}
            >
              to access CRM
            </Text>
          </View>

          {/* Form */}
          <View style={loginStyles.formSection}>
            <CommonTextInput
              label={'User Id'}
              value={userId}
              onChangeText={handleUserIdChange}
              placeholder="Enter User Id"
              placeholderTextColor={theme.textMuted}
              error={userIdError}
            />

            <View style={{ marginTop: 20 }}>
              <CommonTextInput
                label="Password"
                value={password}
                secureTextEntry={!showPassword}
                placeholder="Enter Password"
                placeholderTextColor={theme.textMuted}
                onChangeText={handlePasswordChange}
                error={passwordError}
                errorFontSize={passwordError.includes('must contain') ? 9 : 11}
                rightComponent={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={loginStyles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Remember Me */}
            <TouchableOpacity
              style={loginStyles.rememberSection}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  loginStyles.checkbox,
                  { borderColor: theme.border, backgroundColor: theme.inputBg },
                  rememberMe && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
              >
                {rememberMe && (
                  <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>
                )}
              </View>
              <Text
                style={[loginStyles.rememberText, { color: theme.textPrimary }]}
              >
                Remember Me
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                loginStyles.signInButton,
                { backgroundColor: theme.primary },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={loginStyles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
