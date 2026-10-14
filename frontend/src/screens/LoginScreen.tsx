import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation errors
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(undefined);
    setPasswordError(undefined);
    setErrorMessage(null);

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

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if (result.success) {
        router.replace('/home');
      } else {
        setErrorMessage(result.message || 'Login failed. Please try again.');
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
      {/* Top Bar with Theme Toggle */}
      <View
        style={[
          styles.themeToggleHeader,
          { paddingTop: Math.max(insets.top + Spacing.sm, Spacing.lg) },
        ]}
      >
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
                backgroundColor: colors.primarySoft,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="checkbox" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.appTitle, { color: colors.textPrimary }]}>DigentTech</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Welcome back! Sign in to continue
          </Text>
        </View>

        <Card style={styles.formCard}>
          <ErrorMessage
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
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
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
            }}
            isPassword
            icon="lock-closed-outline"
            error={passwordError}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />
        </Card>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/signup')}
            activeOpacity={0.7}
          >
            <Text style={[styles.signupLink, { color: colors.primary }]}> Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  themeToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
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
    paddingTop: Spacing.md,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  appTitle: {
    fontSize: 28,
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
  loginButton: {
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
  signupLink: {
    fontWeight: '700',
    fontSize: 14,
  },
});
