import { useEffect } from 'react'
import { fetchUsers } from '../../store/adminSlice'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { formatBytes } from '../../utils/format'
import styles from './AdminPage.module.css'
import Spinner from '../../components/Spinner/Spinner'
import ErrorView from '../../components/ErrorView/ErrorView'

export const AdminPage = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  const { users, isLoading, error } = useAppSelector((state) => state.admin)

  if (isLoading) return <Spinner />

  if (error) {
    return (
      <ErrorView
        message={`Не удалось получить список пользователей. ${error}`}
        onRetry={() => dispatch(fetchUsers())}
      />
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Админ-панель</h1>
      <p className={styles.subtitle}>Список зарегистрированных пользователей системы:</p>

      <div className={styles.layout}>
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
                <tr className={styles.row} key={user.id}>
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
      </div>
    </div>
  )
}
