import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './contexts/SessionContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SessionProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)