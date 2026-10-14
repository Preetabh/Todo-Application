import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Spacing, BorderRadius } from '../constants/theme';
import { Todo } from '../types';

type FilterType = 'all' | 'pending' | 'completed';

export const TodoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDesc, setTodoDesc] = useState('');
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch todos from backend
  const fetchTodos = useCallback(async () => {
    try {
      const res = await api.todos.getAll();
      if (res.success && Array.isArray(res.data)) {
        setTodos(res.data);
        setErrorMessage(null);
      } else {
        setErrorMessage(res.message || 'Failed to load todos');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while fetching tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodos();
  };

  // Toggle todo completion status
  const handleToggleCompleted = async (todo: Todo) => {
    const updatedStatus = !todo.completed;

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t._id === todo._id ? { ...t, completed: updatedStatus } : t))
    );

    try {
      const res = await api.todos.update(todo._id, { completed: updatedStatus });
      if (!res.success) {
        // Rollback on failure
        setTodos((prev) =>
          prev.map((t) => (t._id === todo._id ? { ...t, completed: todo.completed } : t))
        );
        setErrorMessage(res.message || 'Failed to update task status');
      }
    } catch (err: any) {
      // Rollback on failure
      setTodos((prev) =>
        prev.map((t) => (t._id === todo._id ? { ...t, completed: todo.completed } : t))
      );
      setErrorMessage('Network error while toggling task');
    }
  };

  // Open modal for new todo
  const openCreateModal = () => {
    setEditingTodo(null);
    setTodoTitle('');
    setTodoDesc('');
    setTitleError(undefined);
    setModalVisible(true);
  };

  // Open modal for editing existing todo
  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoTitle(todo.title);
    setTodoDesc(todo.description || '');
    setTitleError(undefined);
    setModalVisible(true);
  };

  // Submit Add or Edit
  const handleSaveTodo = async () => {
    if (!todoTitle.trim()) {
      setTitleError('Task title cannot be empty');
      return;
    }

    setSubmitting(true);
    setTitleError(undefined);

    try {
      if (editingTodo) {
        // Update existing todo
        const res = await api.todos.update(editingTodo._id, {
          title: todoTitle.trim(),
          description: todoDesc.trim(),
        });

        if (res.success && res.data) {
          setTodos((prev) =>
            prev.map((t) => (t._id === editingTodo._id ? res.data! : t))
          );
          setModalVisible(false);
        } else {
          setTitleError(res.message || 'Failed to update task');
        }
      } else {
        // Create new todo
        const res = await api.todos.create({
          title: todoTitle.trim(),
          description: todoDesc.trim(),
        });

        if (res.success && res.data) {
          setTodos((prev) => [res.data!, ...prev]);
          setModalVisible(false);
        } else {
          setTitleError(res.message || 'Failed to create task');
        }
      }
    } catch (err: any) {
      setTitleError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and delete todo
  const handleDeleteTodo = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await api.todos.delete(deleteTarget._id);
      if (res.success) {
        setTodos((prev) => prev.filter((t) => t._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else {
        setErrorMessage(res.message || 'Failed to delete task');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while deleting task');
    } finally {
      setDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Filtered todos based on active tab
  const filteredTodos = todos.filter((todo) => {
    if (activeFilter === 'pending') return !todo.completed;
    if (activeFilter === 'completed') return todo.completed;
    return true;
  });

  const pendingCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Todo List"
        subtitle={`${pendingCount} pending, ${completedCount} completed`}
        showBack
        onBack={() => router.back()}
        showThemeToggle
        rightAction={
          <TouchableOpacity
            style={[styles.addHeaderBtn, { backgroundColor: colors.primary }]}
            onPress={openCreateModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'all' ? colors.primary : colors.cardHover },
          ]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeFilter === 'all' ? colors.white : colors.textSecondary },
              activeFilter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({todos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'pending' ? colors.primary : colors.cardHover },
          ]}
          onPress={() => setActiveFilter('pending')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeFilter === 'pending' ? colors.white : colors.textSecondary },
              activeFilter === 'pending' && styles.filterTabTextActive,
            ]}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            { backgroundColor: activeFilter === 'completed' ? colors.primary : colors.cardHover },
          ]}
          onPress={() => setActiveFilter('completed')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeFilter === 'completed' ? colors.white : colors.textSecondary },
              activeFilter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorMessage
        message={errorMessage}
        onDismiss={() => setErrorMessage(null)}
        style={styles.errorAlert}
      />

      {loading ? (
        <LoadingSpinner message="Fetching your tasks..." fullScreen={false} />
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: Math.max(insets.bottom + 90, 110),
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
          ListEmptyComponent={
            <EmptyState
              icon={activeFilter === 'completed' ? 'checkmark-circle-outline' : 'checkbox-outline'}
              title={
                todos.length === 0
                  ? 'No tasks yet'
                  : `No ${activeFilter} tasks`
              }
              description={
                todos.length === 0
                  ? 'Create your first task to start organizing your day.'
                  : `You have no ${activeFilter} tasks at this time.`
              }
              actionTitle={todos.length === 0 ? 'Create First Task' : undefined}
              onAction={todos.length === 0 ? openCreateModal : undefined}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.todoCard}>
              <View style={styles.todoRow}>
                {/* Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: item.completed ? colors.success : colors.textTertiary },
                    item.completed && { backgroundColor: colors.success },
                  ]}
                  onPress={() => handleToggleCompleted(item)}
                  activeOpacity={0.7}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.todoContentCol}>
                  <Text
                    style={[
                      styles.todoTitle,
                      { color: item.completed ? colors.textTertiary : colors.textPrimary },
                      item.completed && styles.todoTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>

                  {item.description ? (
                    <Text
                      style={[
                        styles.todoDesc,
                        { color: item.completed ? colors.textTertiary : colors.textSecondary },
                        item.completed && styles.todoDescCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Metadata Row */}
                  <View style={styles.todoMetaRow}>
                    <View style={styles.dateBadge}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: item.completed
                            ? colors.successSoft
                            : colors.warningSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: item.completed
                              ? colors.success
                              : colors.warning,
                          },
                        ]}
                      >
                        {item.completed ? 'Completed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.todoActionsCol}>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: colors.cardHover }]}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={17}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: colors.dangerSoft }]}
                    onPress={() => setDeleteTarget(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Floating Add Action Button (SafeArea offset) */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
        onPress={openCreateModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* Add / Edit Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                paddingBottom: Math.max(insets.bottom + Spacing.lg, Spacing.xxl),
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingTodo ? 'Edit Task' : 'New Task'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Input
                label="Task Title *"
                placeholder="What needs to be done?"
                value={todoTitle}
                onChangeText={(text) => {
                  setTodoTitle(text);
                  if (titleError) setTitleError(undefined);
                }}
                error={titleError}
              />

              <Input
                label="Description (Optional)"
                placeholder="Add additional details or notes"
                value={todoDesc}
                onChangeText={setTodoDesc}
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />

              <View style={styles.modalButtonRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                  style={styles.modalCancelBtn}
                />
                <Button
                  title={editingTodo ? 'Update Task' : 'Add Task'}
                  onPress={handleSaveTodo}
                  loading={submitting}
                  style={styles.modalSubmitBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        loading={deleting}
        onConfirm={handleDeleteTodo}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
};

export default TodoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterTabTextActive: {
    fontWeight: '700',
  },
  errorAlert: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  todoCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: Spacing.md,
  },
  todoContentCol: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  todoDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  todoDescCompleted: {
    textDecorationLine: 'line-through',
  },
  todoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  todoActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
  },
  modalSubmitBtn: {
    flex: 1,
  },
});
