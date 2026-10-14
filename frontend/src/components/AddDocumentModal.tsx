import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StoredDocument, DocumentCategory } from '../types';
import { useTheme } from '../hooks/useTheme';
import { formatBytes, detectFileType } from '../services/documentStorage';
import { Spacing, BorderRadius } from '../constants/theme';
import { Button } from './Button';
import { Input } from './Input';

interface AddDocumentModalProps {
  visible: boolean;
  editDoc?: StoredDocument | null;
  onClose: () => void;
  onSave: (docData: {
    title: string;
    category: DocumentCategory;
    documentNumber?: string;
    sourceUri?: string;
    fileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    notes?: string;
    issueDate?: string;
    expiryDate?: string;
    isFavorite?: boolean;
  }) => Promise<void>;
}

export const CATEGORIES: {
  id: DocumentCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { id: 'identity', label: 'ID Proofs', icon: 'id-card-outline', color: '#3B82F6' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#8B5CF6' },
  { id: 'finance', label: 'Finance & Tax', icon: 'wallet-outline', color: '#10B981' },
  { id: 'health', label: 'Health & Medical', icon: 'medkit-outline', color: '#EC4899' },
  { id: 'vehicle', label: 'Vehicle & RC', icon: 'car-outline', color: '#F59E0B' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt-outline', color: '#06B6D4' },
  { id: 'other', label: 'Other Docs', icon: 'folder-open-outline', color: '#64748B' },
];

const PRESETS = [
  { title: 'Aadhaar Card', category: 'identity' as DocumentCategory },
  { title: 'PAN Card', category: 'identity' as DocumentCategory },
  { title: 'Driving License', category: 'identity' as DocumentCategory },
  { title: 'Passport', category: 'identity' as DocumentCategory },
  { title: 'Degree / Marksheet', category: 'education' as DocumentCategory },
  { title: 'Vehicle RC', category: 'vehicle' as DocumentCategory },
  { title: 'Health Insurance', category: 'health' as DocumentCategory },
];

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  visible,
  editDoc,
  onClose,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('identity');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // File state
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [fileError, setFileError] = useState<string | undefined>();

  useEffect(() => {
    if (editDoc) {
      setTitle(editDoc.title);
      setCategory(editDoc.category);
      setDocumentNumber(editDoc.documentNumber || '');
      setNotes(editDoc.notes || '');
      setIssueDate(editDoc.issueDate || '');
      setExpiryDate(editDoc.expiryDate || '');
      setIsFavorite(editDoc.isFavorite);
      setSelectedFile({
        uri: editDoc.fileUri,
        name: editDoc.fileName,
        size: editDoc.fileSizeBytes,
        mimeType: editDoc.mimeType,
      });
    } else {
      resetForm();
    }
  }, [editDoc, visible]);

  const resetForm = () => {
    setTitle('');
    setCategory('identity');
    setDocumentNumber('');
    setNotes('');
    setIssueDate('');
    setExpiryDate('');
    setIsFavorite(false);
    setSelectedFile(null);
    setTitleError(undefined);
    setFileError(undefined);
  };

  const pickDocument = async () => {
    try {
      setFileError(undefined);
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['application/pdf', 'image/*'],
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? undefined,
          mimeType: asset.mimeType ?? undefined,
        });

        if (!title.trim()) {
          // Clean extension from name for default title
          const cleanName = asset.name.replace(/\.[^/.]+$/, '');
          setTitle(cleanName);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select document.');
    }
  };

  const pickImageGallery = async () => {
    try {
      setFileError(undefined);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to select photos.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const fileName = asset.fileName || `document_photo_${Date.now()}.jpg`;
        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          size: asset.fileSize ?? undefined,
          mimeType: asset.mimeType || 'image/jpeg',
        });

        if (!title.trim()) {
          setTitle('Document Photo');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image.');
    }
  };

  const takePhotoCamera = async () => {
    try {
      setFileError(undefined);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to scan documents.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const fileName = asset.fileName || `document_scan_${Date.now()}.jpg`;
        setSelectedFile({
          uri: asset.uri,
          name: fileName,
          size: asset.fileSize ?? undefined,
          mimeType: asset.mimeType || 'image/jpeg',
        });

        if (!title.trim()) {
          setTitle('Document Scan');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to capture photo.');
    }
  };

  const applyPreset = (preset: { title: string; category: DocumentCategory }) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTitleError(undefined);
  };

  const handleSubmit = async () => {
    let isValid = true;
    setTitleError(undefined);
    setFileError(undefined);

    if (!title.trim()) {
      setTitleError('Document title is required');
      isValid = false;
    }

    if (!editDoc && !selectedFile) {
      setFileError('Please attach a document or photo');
      isValid = false;
    }

    if (!isValid) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        documentNumber: documentNumber.trim() || undefined,
        sourceUri: selectedFile?.uri,
        fileName: selectedFile?.name,
        mimeType: selectedFile?.mimeType,
        fileSizeBytes: selectedFile?.size,
        notes: notes.trim() || undefined,
        issueDate: issueDate.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        isFavorite,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const fileType = selectedFile ? detectFileType(selectedFile.name, selectedFile.mimeType) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              paddingTop: Platform.OS === 'ios' ? insets.top : Spacing.md,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerBar, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.cardHover }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {editDoc ? 'Edit Document' : 'Save Important Document'}
            </Text>

            <TouchableOpacity
              style={[
                styles.starBtn,
                {
                  backgroundColor: isFavorite
                    ? 'rgba(245, 158, 11, 0.15)'
                    : colors.cardHover,
                },
              ]}
              onPress={() => setIsFavorite(!isFavorite)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={isFavorite ? '#F59E0B' : colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Presets Carousel */}
            {!editDoc && (
              <View style={styles.presetsSection}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                  QUICK PRESETS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetsRow}
                >
                  {PRESETS.map((p) => {
                    const isSelected = title === p.title && category === p.category;
                    return (
                      <TouchableOpacity
                        key={p.title}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isSelected
                              ? colors.primarySoft
                              : colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.cardBorder,
                          },
                        ]}
                        onPress={() => applyPreset(p)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            {
                              color: isSelected ? colors.primary : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          + {p.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Document File Selector */}
            <View style={styles.fileSection}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                DOCUMENT ATTACHMENT {!editDoc && '*'}
              </Text>

              {selectedFile ? (
                <View
                  style={[
                    styles.selectedFileCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.selectedFileIconWrap,
                      {
                        backgroundColor:
                          fileType === 'pdf'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        fileType === 'pdf'
                          ? 'document-text'
                          : fileType === 'image'
                          ? 'image'
                          : 'folder'
                      }
                      size={26}
                      color={fileType === 'pdf' ? '#EF4444' : '#3B82F6'}
                    />
                  </View>

                  <View style={styles.selectedFileTextCol}>
                    <Text
                      style={[styles.selectedFileName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {selectedFile.name}
                    </Text>
                    <Text
                      style={[styles.selectedFileSize, { color: colors.textSecondary }]}
                    >
                      {formatBytes(selectedFile.size)} • {fileType?.toUpperCase()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.changeFileBtn, { backgroundColor: colors.cardHover }]}
                    onPress={pickDocument}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.changeFileText, { color: colors.primary }]}>
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.sourceSelectorRow}>
                  {/* Option 1: Files / PDFs */}
                  <TouchableOpacity
                    style={[
                      styles.sourceCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: fileError ? colors.danger : colors.cardBorder,
                      },
                    ]}
                    onPress={pickDocument}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.sourceIconWrap,
                        { backgroundColor: 'rgba(99, 102, 241, 0.15)' },
                      ]}
                    >
                      <Ionicons name="document-attach" size={24} color="#6366F1" />
                    </View>
                    <Text style={[styles.sourceTitle, { color: colors.textPrimary }]}>
                      Files / PDF
                    </Text>
                    <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>
                      Pick PDF or docs
                    </Text>
                  </TouchableOpacity>

                  {/* Option 2: Camera Scan */}
                  <TouchableOpacity
                    style={[
                      styles.sourceCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: fileError ? colors.danger : colors.cardBorder,
                      },
                    ]}
                    onPress={takePhotoCamera}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.sourceIconWrap,
                        { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                      ]}
                    >
                      <Ionicons name="camera" size={24} color="#10B981" />
                    </View>
                    <Text style={[styles.sourceTitle, { color: colors.textPrimary }]}>
                      Scan Camera
                    </Text>
                    <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>
                      Take instant photo
                    </Text>
                  </TouchableOpacity>

                  {/* Option 3: Photo Gallery */}
                  <TouchableOpacity
                    style={[
                      styles.sourceCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: fileError ? colors.danger : colors.cardBorder,
                      },
                    ]}
                    onPress={pickImageGallery}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.sourceIconWrap,
                        { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                      ]}
                    >
                      <Ionicons name="images" size={24} color="#F59E0B" />
                    </View>
                    <Text style={[styles.sourceTitle, { color: colors.textPrimary }]}>
                      Gallery
                    </Text>
                    <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>
                      Pick from photos
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {fileError && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {fileError}
                </Text>
              )}
            </View>

            {/* Document Details Form */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                DETAILS & CATEGORY
              </Text>

              {/* Title Input */}
              <Input
                label="Document Name / Title *"
                placeholder="e.g. Aadhaar Card, PAN Card, Graduation Degree"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  if (titleError) setTitleError(undefined);
                }}
                icon="bookmark-outline"
                error={titleError}
              />

              {/* Category Selector */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Select Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {CATEGORIES.map((c) => {
                  const isSelected = category === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.card,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setCategory(c.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={c.icon}
                        size={16}
                        color={isSelected ? '#FFFFFF' : c.color}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Document Number / ID (Optional) */}
              <Input
                label="Document ID / Number (Optional)"
                placeholder="e.g. XXXX-XXXX-1234 or DL-042011001234"
                value={documentNumber}
                onChangeText={setDocumentNumber}
                icon="card-outline"
                autoCapitalize="characters"
              />

              {/* Dates Row */}
              <View style={styles.datesRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Issue Date (Optional)"
                    placeholder="YYYY-MM-DD"
                    value={issueDate}
                    onChangeText={setIssueDate}
                    icon="calendar-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Expiry Date (Optional)"
                    placeholder="YYYY-MM-DD"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    icon="timer-outline"
                  />
                </View>
              </View>

              {/* Notes */}
              <Input
                label="Notes / Remarks (Optional)"
                placeholder="Add tags, physical file location, or details..."
                value={notes}
                onChangeText={setNotes}
                icon="document-text-outline"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Offline Safe Info Banner */}
            <View
              style={[
                styles.safetyBanner,
                {
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(5, 150, 105, 0.08)',
                  borderColor: isDark
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(5, 150, 105, 0.2)',
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.safetyTitle, { color: colors.textPrimary }]}
                >
                  Stored Locally In Phone Memory
                </Text>
                <Text
                  style={[styles.safetyDesc, { color: colors.textSecondary }]}
                >
                  This file is stored strictly on your device. You can open and share it anytime without an internet connection.
                </Text>
              </View>
            </View>

            {/* Submit & Cancel Buttons */}
            <View style={styles.actionRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={styles.cancelBtn}
              />
              <Button
                title={editDoc ? 'Save Changes' : 'Save to Device'}
                onPress={handleSubmit}
                loading={saving}
                icon={
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                }
                style={styles.saveBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  starBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  presetsSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  presetsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
  },
  fileSection: {
    marginBottom: Spacing.xl,
  },
  sourceSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sourceCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  sourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  sourceDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  selectedFileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  selectedFileTextCol: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedFileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  changeFileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  changeFileText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  categoryRow: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
  },
  datesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  safetyDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
  },
  saveBtn: {
    flex: 1.4,
    height: 48,
  },
});
