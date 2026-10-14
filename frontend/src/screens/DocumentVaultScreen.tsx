import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoredDocument, DocumentCategory, DocumentStats } from '../types';
import { useTheme } from '../hooks/useTheme';
import { documentStorage, formatBytes } from '../services/documentStorage';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { AddDocumentModal, CATEGORIES } from '../components/AddDocumentModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { Spacing, BorderRadius } from '../constants/theme';

export const DocumentVaultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    favorites: 0,
    categoriesCount: {
      identity: 0,
      education: 0,
      finance: 0,
      health: 0,
      vehicle: 0,
      bills: 0,
      other: 0,
    },
    totalSizeBytes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | DocumentCategory>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<StoredDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [docs, docStats] = await Promise.all([
        documentStorage.getAll(),
        documentStorage.getStats(),
      ]);
      setDocuments(docs);
      setStats(docStats);

      // Keep viewing doc updated if active
      if (viewingDoc) {
        const updated = docs.find((d) => d.id === viewingDoc.id);
        if (updated) setViewingDoc(updated);
      }
    } catch (err) {
      console.warn('Failed to load documents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewingDoc]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    let list = documents;

    if (selectedFilter === 'favorites') {
      list = list.filter((d) => d.isFavorite);
    } else if (selectedFilter !== 'all') {
      list = list.filter((d) => d.category === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.documentNumber && d.documentNumber.toLowerCase().includes(q)) ||
          (d.notes && d.notes.toLowerCase().includes(q)) ||
          d.fileName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [documents, selectedFilter, searchQuery]);

  const handleSaveDocument = async (data: any) => {
    if (editingDoc) {
      await documentStorage.updateDocument(editingDoc.id, {
        title: data.title,
        category: data.category,
        documentNumber: data.documentNumber,
        notes: data.notes,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        isFavorite: data.isFavorite,
      });
      setEditingDoc(null);
    } else {
      if (!data.sourceUri) {
        throw new Error('Please attach a document file');
      }
      await documentStorage.saveDocument({
        title: data.title,
        category: data.category,
        documentNumber: data.documentNumber,
        sourceUri: data.sourceUri,
        fileName: data.fileName || 'document.file',
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes,
        notes: data.notes,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        isFavorite: data.isFavorite,
      });
    }

    await loadData();
  };

  const handleShare = async (doc: StoredDocument) => {
    try {
      await documentStorage.shareDocument(doc);
    } catch (err: any) {
      Alert.alert('Share Failed', err.message || 'Unable to share document.');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await documentStorage.toggleFavorite(id);
    await loadData();
  };

  const confirmDelete = async () => {
    if (!deletingDocId) return;
    const id = deletingDocId;
    setDeletingDocId(null);
    if (viewingDoc && viewingDoc.id === id) {
      setViewingDoc(null);
    }
    await documentStorage.deleteDocument(id);
    await loadData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Document Locker"
        showBack
        onBack={() => router.back()}
        showThemeToggle
        rightAction={
          <TouchableOpacity
            style={[styles.topAddBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditingDoc(null);
              setShowAddModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.topAddBtnText}>Add Doc</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Security & Overview Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsCardTop}>
            <View style={styles.vaultBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={[styles.vaultBadgeText, { color: colors.primary }]}>
                100% On-Device Storage
              </Text>
            </View>
            <View style={styles.privacyPill}>
              <Ionicons name="lock-closed" size={12} color={colors.success} />
              <Text style={[styles.privacyPillText, { color: colors.success }]}>
                Offline & Private
              </Text>
            </View>
          </View>

          <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>
            Personal Document Safe
          </Text>
          <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
            All sensitive files stay safely stored inside your phone. View or share them anywhere, anytime.
          </Text>

          <View style={styles.statsMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricCount, { color: colors.textPrimary }]}>
                {stats.total}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Total Docs
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricCount, { color: '#F59E0B' }]}>
                {stats.favorites}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Pinned / Starred
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricCount, { color: colors.primary }]}>
                {formatBytes(stats.totalSizeBytes)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Storage Used
              </Text>
            </View>
          </View>
        </Card>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by title, number, category..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {/* All */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedFilter === 'all' && [
                styles.filterPillActive,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ],
              selectedFilter !== 'all' && {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => setSelectedFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color: selectedFilter === 'all' ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: selectedFilter === 'all' ? '700' : '500',
                },
              ]}
            >
              All ({stats.total})
            </Text>
          </TouchableOpacity>

          {/* Favorites */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedFilter === 'favorites' && [
                styles.filterPillActive,
                { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
              ],
              selectedFilter !== 'favorites' && {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => setSelectedFilter('favorites')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="star"
              size={13}
              color={selectedFilter === 'favorites' ? '#FFFFFF' : '#F59E0B'}
            />
            <Text
              style={[
                styles.filterPillText,
                {
                  color: selectedFilter === 'favorites' ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: selectedFilter === 'favorites' ? '700' : '500',
                },
              ]}
            >
              Pinned ({stats.favorites})
            </Text>
          </TouchableOpacity>

          {/* Categories */}
          {CATEGORIES.map((cat) => {
            const count = stats.categoriesCount[cat.id] || 0;
            const isSelected = selectedFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  isSelected && [
                    styles.filterPillActive,
                    { backgroundColor: colors.primary, borderColor: colors.primary },
                  ],
                  !isSelected && {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedFilter(cat.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : cat.color}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeaderText, { color: colors.textPrimary }]}>
            {selectedFilter === 'all'
              ? 'Stored Documents'
              : selectedFilter === 'favorites'
              ? 'Pinned Documents'
              : `${selectedFilter.toUpperCase()} Documents`}
          </Text>
          <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
            {filteredDocuments.length} files
          </Text>
        </View>

        {/* Documents List */}
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={() => setViewingDoc(doc)}
              onShare={() => handleShare(doc)}
              onToggleFavorite={() => handleToggleFavorite(doc.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="document-text-outline"
            title={
              searchQuery
                ? 'No matching documents'
                : selectedFilter !== 'all'
                ? 'No documents in this category'
                : 'No documents stored yet'
            }
            description={
              searchQuery
                ? 'Try searching with a different name or number.'
                : 'Keep your Aadhaar, PAN card, driving license, marksheet, and important PDFs safe in one place on your phone.'
            }
            actionTitle="Add First Document"
            onAction={() => {
              setEditingDoc(null);
              setShowAddModal(true);
            }}
          />
        )}
      </ScrollView>

      {/* Add / Edit Document Modal */}
      <AddDocumentModal
        visible={showAddModal}
        editDoc={editingDoc}
        onClose={() => {
          setShowAddModal(false);
          setEditingDoc(null);
        }}
        onSave={handleSaveDocument}
      />

      {/* Document Viewer & Instant Share Modal */}
      <DocumentViewerModal
        visible={!!viewingDoc}
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onDelete={(id) => setDeletingDocId(id)}
        onEdit={(doc) => {
          setViewingDoc(null);
          setEditingDoc(doc);
          setShowAddModal(true);
        }}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={!!deletingDocId}
        title="Delete Document"
        message="Are you sure you want to delete this document from your phone storage? This action cannot be undone."
        confirmLabel="Delete File"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingDocId(null)}
      />
    </View>
  );
};

export default DocumentVaultScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
  },
  topAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  vaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  privacyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statsSubtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  statsMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricCount: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterPillsRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  filterPillActive: {
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
