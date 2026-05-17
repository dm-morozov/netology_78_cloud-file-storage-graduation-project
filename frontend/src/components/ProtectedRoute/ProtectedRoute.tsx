import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../../store/store'

interface ProtectedRouteProps {
  // ReactNode — это специальный тип, который означает "любой JSX-элемент"
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  // Если гость (нет авторизации)
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  // Если маршрут требует прав админа, а пользователь не админ
  if (requireAdmin && !user?.is_staff) {
    return <Navigate to='/' replace />
  }

  return children
}
