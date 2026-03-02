import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AddMoviePage } from './pages/add-movie/AddMoviePage'
import { LibraryPage } from './pages/library/LibraryPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import './App.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LibraryPage />} />
          <Route path="add-movie" element={<AddMoviePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
