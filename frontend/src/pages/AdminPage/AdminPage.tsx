import { useEffect, useState } from 'react'
import {
  fetchUsers,
  fetchUserFiles,
  selectUser,
  type AdminUser,
  deleteUserFileAdmin,
  toggleUserAdminStatus,
  deleteUser,
} from '../../store/adminSlice'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { formatBytes } from '../../utils/format'
import styles from './AdminPage.module.css'
import Spinner from '../../components/Spinner/Spinner'
import ErrorView from '../../components/ErrorView/ErrorView'
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal'
import { downloadFile, viewFileInline } from '../../store/filesSlice'

export const AdminPage = () => {
  const dispatch = useAppDispatch()

  // Загрузка данных из хранилища Redux
  const { users, isLoading, error, selectedUser, isFilesLoading, selectedUserFile } =
    useAppSelector((state) => state.admin)

  // Текущий залогиненный пользователь
  const currentUser = useAppSelector((state) => state.auth.user)

  // Состояние для хранения ID файла, который будет удален
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    size: number
    name: string
  } | null>(null)

  // Состояние для хранения ID пользователя, чья роль будет изменена
  const [roleToggleTarget, setRoleToggleTarget] = useState<AdminUser | null>(null)

  // Состояние для удаления пользователя
  const [userDeleteTarget, setUserDeleteTarget] = useState<AdminUser | null>(null)

  // Состояние для показа предупреждений
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

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

  // Скачивание файла
  const handleDownload = (fileId: number, fileName: string) => {
    dispatch(downloadFile({ fileId, fileName }))
  }

  // Вызывается при клике на бейдж роли
  const handleToggleRoleClick = (e: React.MouseEvent, user: AdminUser) => {
    e.stopPropagation() // Останавливаем всплытие клика к строке таблицы!

    // Защита: не даем лишить прав администратора самого себя
    if (currentUser && currentUser.id === user.id) {
      setWarningMessage('Вы не можете лишить прав администратора самого себя!')
      return
    }

    setRoleToggleTarget(user) // Открываем модалку для этого пользователя
  }

  // Вызывается при клике на кнопку удаления пользователя
  const handleDeleteUserClick = (e: React.MouseEvent, user: AdminUser) => {
    e.stopPropagation() // Останавливаем всплытие клика к строке таблицы!

    // Защита: не даем удалить самого себя
    if (currentUser && currentUser.id === user.id) {
      setWarningMessage('Вы не можете удалить самого себя!')
      return
    }

    setUserDeleteTarget(user) // Открываем модалку удаления
  }

  // Вызывается при нажатии "Да" в модалке удаления пользователя
  const handleConfirmDeleteUser = () => {
    if (userDeleteTarget) {
      dispatch(deleteUser(userDeleteTarget.id))
      setUserDeleteTarget(null) // Закрываем модалку
    }
  }

  // Вызывается при нажатии "Да" в модалке изменения роли
  const handleConfirmToggleRole = () => {
    if (roleToggleTarget) {
      dispatch(
        toggleUserAdminStatus({
          userId: roleToggleTarget.id,
          isStaff: !roleToggleTarget.is_staff, // Меняем статус на противоположный
        })
      )
      setRoleToggleTarget(null) // Закрываем модалку
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
                <th>Действия</th>
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
                      className={`${styles.badge} ${user.is_staff ? styles.badgeAdmin : styles.badgeUser} ${styles.badgeInteractive}`}
                      onClick={(e) => handleToggleRoleClick(e, user)}
                      title={
                        user.is_staff ? 'Снять права администратора' : 'Сделать администратором'
                      }
                    >
                      {user.is_staff ? '⭐ Админ' : 'Пользователь'}
                    </span>
                  </td>

                  <td>{user.files_count}</td>
                  <td>{formatBytes(user.total_size)}</td>
                  <td>
                    <button
                      className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                      onClick={(e) => handleDeleteUserClick(e, user)}
                      title='Удалить пользователя'
                    >
                      Удалить
                    </button>
                  </td>
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
                          className={`${styles.actionButton} ${styles.actionButtonView}`}
                          onClick={() => dispatch(viewFileInline({ fileId: file.id }))}
                        >
                          Просмотр
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonDownload}`}
                          onClick={() => handleDownload(file.id, file.original_name)}
                        >
                          Скачать
                        </button>
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
      <ConfirmModal
        isOpen={roleToggleTarget !== null}
        title='Изменение роли пользователя'
        message={
          roleToggleTarget?.is_staff
            ? `Вы действительно хотите снять статус администратора с пользователя "${roleToggleTarget?.username}"?`
            : `Вы действительно хотите назначить пользователя "${roleToggleTarget?.username}" администратором?`
        }
        confirmText='Подтвердить'
        onConfirm={handleConfirmToggleRole}
        onCancel={() => setRoleToggleTarget(null)}
      />
      <ConfirmModal
        isOpen={userDeleteTarget !== null}
        title='Удаление пользователя'
        message={`Вы действительно хотите удалить пользователя "${userDeleteTarget?.username}" и все его файлы?`}
        confirmText='Да, удалить'
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserDeleteTarget(null)}
      />
      <ConfirmModal
        isOpen={warningMessage !== null}
        title='Ограничение действия'
        message={warningMessage || ''}
        cancelText='Хорошо'
        onCancel={() => setWarningMessage(null)}
      />
    </div>
  )
}
