import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../store/store'
import styles from './Header.module.css'
import { logoutUser } from '../../../store/authSlice'

export const Header = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    // Командуем Redux'у запустить Thunk (он сам сходит на сервер и почистит стейт)
    await dispatch(logoutUser())

    navigate('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to='/'>☁️ MyCloud</Link>
        </div>
        <nav className={styles.nav}>
          <Link to='/' className={styles.link}>
            Главная
          </Link>
          {!isAuthenticated ? (
            <>
              <Link to='/login' className={styles.link}>
                Вход
              </Link>
              <Link to='/register' className={styles.link}>
                Регистрация
              </Link>
            </>
          ) : (
            <>
              <Link to='/storage' className={styles.link}>
                Хранилище
              </Link>
              {user?.is_staff && (
                <Link to='/admin' className={styles.link}>
                  Админка
                </Link>
              )}

              <button onClick={handleLogout} className={styles.logoutButton}>
                Выйти
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
