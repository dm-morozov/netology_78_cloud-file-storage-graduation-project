import { useEffect, useState } from 'react'
import {
  fetchUsers,
  fetchUserFiles,
  selectUser,
  type AdminUser,
  deleteUserFileAdmin,
} from '../../store/adminSlice'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { formatBytes } from '../../utils/format'
import styles from './AdminPage.module.css'
import Spinner from '../../components/Spinner/Spinner'
import ErrorView from '../../components/ErrorView/ErrorView'
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal'

export const AdminPage = () => {
  const dispatch = useAppDispatch()
  const { users, isLoading, error, selectedUser, isFilesLoading, selectedUserFile } =
    useAppSelector((state) => state.admin)

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    size: number
    name: string
  } | null>(null)

  // Эффект 1: Загрузка списка пользователей при монтировании страницы
  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  const selectedUserId = selectedUser?.id
  // Эффект 2: Загрузка файлов выбранного пользователя при изменении его ID
  useEffect(() => {
    if (selectedUserId) {
      dispatch(fetchUserFiles(selectedUserId))
    }
  }, [dispatch, selectedUserId])

  if (isLoading) return <Spinner />

  if (error) {
    return (
      <ErrorView
        message={`Не удалось получить список пользователей. ${error}`}
        onRetry={() => dispatch(fetchUsers())}
      />
    )
  }
  const handleRowClick = (user: AdminUser) => {
    // Если кликнули по уже выбранному пользователю — снимаем выделение
    if (selectedUser?.id === user.id) {
      return dispatch(selectUser(null))
    }

    dispatch(selectUser(user))
  }

  // Вызывается при клике на красную кнопку "Удалить" в таблице файлов
  const handleDeleteClick = (fileId: number, size: number, fileName: string) => {
    setDeleteTarget({ id: fileId, size, name: fileName }) // Открываем модалку
  }

  // Вызывается, когда пользователь нажимает "Да, удалить" в самой модалке
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      dispatch(deleteUserFileAdmin({ fileId: deleteTarget.id, size: deleteTarget.size }))
      setDeleteTarget(null) // Закрываем модалку
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Админ-панель</h1>
      <p className={styles.subtitle}>Список зарегистрированных пользователей системы:</p>

      <div className={`${styles.layout} ${selectedUser ? styles.hasSelection : ''}`}>
        <div className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Логин</th>
                <th>Email</th>
                <th>Имя Фамилия</th>
                <th>Роль</th>
                <th>Файлов</th>
                <th>Занято места</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  className={`${styles.row} ${selectedUser?.id === user.id ? styles.selected : ''}`}
                  key={user.id}
                  onClick={() => handleRowClick(user)}
                >
                  <td>{user.id}</td>
                  <td className={styles.username}>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.first_name || user.last_name
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : '—'}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${user.is_staff ? styles.badgeAdmin : styles.badgeUser}`}
                    >
                      {user.is_staff ? '⭐ Админ' : 'Пользователь'}
                    </span>
                  </td>
                  <td>{user.files_count}</td>
                  <td>{formatBytes(user.total_size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Правая колонка: файлы выбранного пользователя */}
        {selectedUser && (
          <div className={styles.panel}>
            {/* Шапка с именем и кнопкой закрытия */}
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Файлы {selectedUser.username}</h2>
              <button className={styles.closeButton} onClick={() => dispatch(selectUser(null))}>
                ✕
              </button>
            </div>

            {/* Содержимое: если загружается — показываем лоадер, если пусто — текст, иначе таблицу */}
            {isFilesLoading ? (
              <Spinner />
            ) : selectedUserFile.length === 0 ? (
              <p className={styles.emptyText}>У пользователя нет загруженных файлов</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Имя файла</th>
                    <th>Размер</th>
                    <th>Дата загрузки</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserFile.map((file) => (
                    <tr key={file.id}>
                      <td className={styles.username}>{file.original_name}</td>
                      <td>{formatBytes(file.size)}</td>
                      <td className={styles.fileDate}>
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                          onClick={() => handleDeleteClick(file.id, file.size, file.original_name)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title='Удаление файла'
        message={`Вы действительно хотите удалить файл "${deleteTarget?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
