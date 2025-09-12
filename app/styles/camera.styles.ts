import { StyleSheet } from 'react-native';
import { tokens } from '../lib/tokens';

export const cameraStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  fallbackTitle: {
    fontSize: tokens.typography.fontSize.h2,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  fallbackMessage: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing.lg,
  },
  fallbackActions: {
    alignItems: 'center',
  },
  fallbackSubtitle: {
    fontSize: tokens.typography.fontSize.caption,
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  fallbackBottomBar: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  fallbackBottomText: {
    fontSize: tokens.typography.fontSize.caption,
    color: tokens.colors.text,
    textAlign: 'center',
  },
});


