import { HashRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/layout/Layout'
import { AddMoviePage } from './pages/add-movie/AddMoviePage'
import { LibraryPage } from './pages/library/LibraryPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { AboutPage } from './pages/about/AboutPage'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LibraryPage />} />
            <Route path="add-movie" element={<AddMoviePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
