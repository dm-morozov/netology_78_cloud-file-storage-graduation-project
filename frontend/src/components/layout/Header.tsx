import { NavLink, useNavigate } from 'react-router-dom'
import headerLogo from '/img/header-logo.png'
import { useState, type ChangeEventHandler, type FormEvent } from 'react'
import { useAppSelector } from '../../app/hooks'

const Header = () => {
  const [isOpenSearch, setIsOpenSearch] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const navigate = useNavigate()

  const runSearchAction = () => {
    const value = searchValue.trim()

    if (!isOpenSearch) {
      setIsOpenSearch(true)
      return
    }

    if (!value) {
      setIsOpenSearch(false)
      setSearchValue('')
      return
    }

    setIsOpenSearch(false)
    setSearchValue('')
    navigate(`/catalog.html?q=${encodeURIComponent(value)}`)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runSearchAction()
  }

  const handleSearchValue: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchValue(event.target.value)
  }

  const items = useAppSelector((state) => state.cart.items)

  return (
    <header className='container'>
      <div className='row'>
        <div className='col'>
          <nav className='navbar navbar-expand-sm navbar-light bg-light'>
            <NavLink to='/' className='navbar-brand'>
              <img src={headerLogo} alt='Bosa Noga' />
            </NavLink>
            <div className='collapse navbar-collapse' id='navbarMain'>
              <ul className='navbar-nav mr-auto'>
                <li className='nav-item'>
                  <NavLink to='/' className='nav-link'>
                    Главная
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/catalog.html'>
                    Каталог
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/about.html'>
                    О магазине
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink className='nav-link' to='/contacts.html'>
                    Контакты
                  </NavLink>
                </li>
              </ul>
              <div>
                <div className='header-controls-pics'>
                  <div
                    role='button'
                    tabIndex={0}
                    data-id='search-expander'
                    className='header-controls-pic header-controls-search'
                    onClick={runSearchAction}
                  ></div>

                  <div
                    role='button'
                    tabIndex={0}
                    className='header-controls-pic header-controls-cart'
                    onClick={() => navigate('/cart.html')}
                  >
                    {items.length > 0 && (
                      <div className='header-controls-cart-full'>{items.length}</div>
                    )}
                    <div className='header-controls-cart-menu'></div>
                  </div>
                </div>
                <form
                  data-id='search-form'
                  className={`header-controls-search-form form-inline ${isOpenSearch ? '' : 'invisible'}`}
                  onSubmit={handleSearchSubmit}
                >
                  <input
                    value={searchValue}
                    onChange={handleSearchValue}
                    className='form-control'
                    placeholder='Поиск'
                  />
                </form>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
