import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ErrorMessage } from '../components/ErrorMessage';
import { Spacing, BorderRadius } from '../constants/theme';

export const SignupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation errors
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();

  const validate = (): boolean => {
    let isValid = true;
    setNameError(undefined);
    setEmailError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);
    setErrorMessage(null);

    if (!name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (result.success) {
        router.replace('/home');
      } else {
        setErrorMessage(result.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardView, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header with Back & Theme Toggle */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: Math.max(insets.top + Spacing.sm, Spacing.lg) },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.cardHover, borderColor: colors.cardBorder }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.themeToggleBtn, { backgroundColor: colors.cardHover, borderColor: colors.cardBorder }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={isDark ? '#FBBF24' : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + Spacing.xl, Spacing.xxxl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: isDark ? 'rgba(32, 138, 239, 0.15)' : '#E6F4FE',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(32, 138, 239, 0.25)',
              },
            ]}
          >
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>DigentTech</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create your account & secure your data
          </Text>
        </View>

        <Card style={styles.formCard}>
          <ErrorMessage
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(undefined);
            }}
            autoCapitalize="words"
            icon="person-outline"
            error={nameError}
          />

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(undefined);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
            error={emailError}
          />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
            }}
            isPassword
            icon="lock-closed-outline"
            error={passwordError}
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError(undefined);
            }}
            isPassword
            icon="shield-checkmark-outline"
            error={confirmPasswordError}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
          />
        </Card>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.loginLink, { color: colors.primary }]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  signupButton: {
    marginTop: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontWeight: '700',
    fontSize: 14,
  },
});
