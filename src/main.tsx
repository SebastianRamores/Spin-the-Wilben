import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/lilita-one/latin-400.css'
import '@fontsource/baloo-2/latin-400.css'
import '@fontsource/baloo-2/latin-600.css'
import '@fontsource/baloo-2/latin-700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
