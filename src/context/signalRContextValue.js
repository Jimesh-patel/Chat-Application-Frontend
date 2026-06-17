import { createContext } from 'react'

export const SignalRContext = createContext({
  isConnected: false,
  connection: null,
})
