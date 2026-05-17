import { Link } from 'react-router-dom'
import { useAppSelector } from '../../../store/store'
import styles from './Header.module.css'

export const Header = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

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
              <Link to='/admin' className={styles.link}>
                Админка
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
