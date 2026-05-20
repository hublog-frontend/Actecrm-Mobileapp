import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './LoginStyles';
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

const logo = require('../assets/acte-logo.png');

const Login = ({ navigation }) => {
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>to access CRM</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <CommonTextInput
              label={'User Id'}
              value={userId}
              onChangeText={handleUserIdChange}
              placeholder="Enter User Id"
              placeholderTextColor="#A0AEC0"
              error={userIdError}
            />

            {/* Password Input */}
            <View style={{ marginTop: 20 }}>
              <CommonTextInput
                label="Password"
                value={password}
                secureTextEntry={!showPassword}
                placeholder="Enter Password"
                placeholderTextColor="#A0AEC0"
                onChangeText={handlePasswordChange}
                error={passwordError}
                errorFontSize={passwordError.includes('must contain') ? 9 : 11}
                rightComponent={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#7D8DA1"
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Remember Me Checkbox */}
            <TouchableOpacity
              style={styles.rememberSection}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxActive]}
              >
                {rememberMe && (
                  <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>
                )}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && { opacity: 0.7 }]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
