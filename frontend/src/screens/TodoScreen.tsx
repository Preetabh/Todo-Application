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
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Todo } from '../types';

type FilterType = 'all' | 'pending' | 'completed';

export const TodoScreen: React.FC = () => {
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <Header
        title="Todo List"
        subtitle={`${pendingCount} pending, ${completedCount} completed`}
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={openCreateModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({todos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'pending' && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter('pending')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === 'pending' && styles.filterTabTextActive,
            ]}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter('completed')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
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
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
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
                    item.completed && styles.checkboxCompleted,
                  ]}
                  onPress={() => handleToggleCompleted(item)}
                  activeOpacity={0.7}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  )}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.todoContentCol}>
                  <Text
                    style={[
                      styles.todoTitle,
                      item.completed && styles.todoTitleCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>

                  {item.description ? (
                    <Text
                      style={[
                        styles.todoDesc,
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
                        color={Colors.textTertiary}
                      />
                      <Text style={styles.dateText}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        item.completed ? styles.statusDone : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.completed
                            ? styles.statusTextDone
                            : styles.statusTextPending,
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
                    style={styles.actionIconBtn}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={Colors.primaryLight}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, styles.deleteIconBtn]}
                    onPress={() => setDeleteTarget(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={Colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Floating Add Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
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
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingTodo ? 'Edit Task' : 'New Task'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
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
    backgroundColor: Colors.background,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  filterTab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.cardBorder,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  errorAlert: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 100, // accommodate FAB
  },
  todoCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
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
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: Spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  todoContentCol: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  todoDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  todoDescCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
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
    color: Colors.textTertiary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  statusDone: {
    backgroundColor: Colors.successSoft,
  },
  statusPending: {
    backgroundColor: Colors.warningSoft,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextDone: {
    color: Colors.success,
  },
  statusTextPending: {
    color: Colors.warning,
  },
  todoActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    gap: Spacing.xs,
  },
  actionIconBtn: {
    padding: Spacing.xs,
  },
  deleteIconBtn: {
    marginLeft: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    color: Colors.textPrimary,
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
