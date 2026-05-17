import { Outlet } from 'react-router-dom'
import { Header } from '../Header/Header'
import { Footer } from '../Footer/Footer'
import styles from './MainLayout.module.css'

export const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />

      {/* <main> - семантический тег. Он растягивается на всю свободную высоту */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Сюда React Router будет подставлять LoginPage, StoragePage и т.д. */}
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}
