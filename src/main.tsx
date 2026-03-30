import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ResourceProvider } from './context/ResourceContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ResourceProvider>
      <BrowserRouter basename="/Geoportal">
        <App />
      </BrowserRouter>
    </ResourceProvider>
  </React.StrictMode>,
)
