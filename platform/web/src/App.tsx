import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/Home'
import { JoinPage } from './pages/Join'
import { TablePage } from './pages/Table'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/table/:id" element={<TablePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
