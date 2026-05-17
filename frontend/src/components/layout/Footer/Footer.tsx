import { Link } from 'react-router-dom'
import { useAppSelector } from '../../../store/store'
import styles from './Footer.module.css'

export const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Левая часть - О проекте */}
        <div className={styles.brandSection}>
          <h3>☁️ MyCloud</h3>
          <p>
            Надежное облачное хранилище для ваших файлов. Дипломный проект по профессии
            "Fullstack-разработчик на Python".
          </p>
        </div>

        {/* Правая часть - Ссылки */}
        <div className={styles.linksSection}>
          <div className={styles.column}>
            <h4>Навигация</h4>
            <Link to='/'>Главная</Link>
            {!isAuthenticated ? (
              <>
                <Link to='/login'>Вход</Link>
                <Link to='/register'>Регистрация</Link>
              </>
            ) : (
              <>
                <Link to='/storage'>Мои файлы</Link>
                {user?.is_staff && <Link to='/admin'>Админ-панель</Link>}
              </>
            )}
          </div>
          <div className={styles.column}>
            <h4>Разработчик</h4>
            {/* Замени на ссылку на свой реальный профиль */}
            <a href='https://github.com/dm-morozov' target='_blank' rel='noreferrer'>
              Профиль GitHub
            </a>
            <a href='https://netology.ru' target='_blank' rel='noreferrer'>
              Нетология
            </a>
          </div>
        </div>
      </div>

      {/* Самый низ футера - копирайт */}
      <div className={styles.bottomBar}>
        <p>© {currentYear} MyCloud (Дмитрий Морозов). Все права защищены.</p>
      </div>
    </footer>
  )
}
