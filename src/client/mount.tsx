import { createRoot } from 'react-dom/client'
import { App } from './App'

const rootElement =
  document.getElementById('root') || document.createElement('div')

const root = createRoot(rootElement)
root.render(<App />)
