const ACCESS_TOKEN_KEY = 'chat_app_access_token'
const USER_KEY = 'chat_app_user'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7226'
const SESSION_EXPIRED_EVENT = 'auth:session-expired'
const LOGGED_IN_EVENT = 'auth:logged-in'
const LOGGED_OUT_EVENT = 'auth:logged-out'

let refreshPromise = null

export const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY)
  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch (error) {
    console.error('[auth] Failed to parse stored user', error)
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const getCurrentUserId = () => {
  const token = getStoredToken()
  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return (
      payload.sub ||
      payload.nameid ||
      payload.uid ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      null
    )
  } catch (error) {
    console.error('[auth] Failed to parse access token payload', error)
    return null
  }
}

const emitAuthEvent = (eventName) => {
  window.dispatchEvent(new CustomEvent(eventName))
}

const emitSessionExpired = () => {
  emitAuthEvent(SESSION_EXPIRED_EVENT)
}

const emitLoggedIn = () => {
  emitAuthEvent(LOGGED_IN_EVENT)
}

const emitLoggedOut = () => {
  emitAuthEvent(LOGGED_OUT_EVENT)
}

const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

const setStoredUser = (data) => {
  if (!data) {
    localStorage.removeItem(USER_KEY)
    return
  }

  if (data?.userId || data?.username || data?.email) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: data.userId || null,
        username: data.username || '',
        email: data.email || '',
      }),
    )
    return
  }
}

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/identity/refresh`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      // Some auth endpoints may return an empty response body.
    }

    if (!response.ok) {
      setStoredToken(null)
      setStoredUser(null)
      emitSessionExpired()
      throw new Error(data?.message || data?.error || 'Session expired')
    }

    if (!data?.accessToken) {
      setStoredToken(null)
      setStoredUser(null)
      emitSessionExpired()
      throw new Error('No access token returned from refresh endpoint')
    }

    setStoredToken(data.accessToken)
    setStoredUser(data)
    return data.accessToken
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export const request = async (path, options = {}, attempt = 0) => {
  const headers = {
    ...(options.headers || {}),
  }

  if (!options.skipAuth) {
    const token = getStoredToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // Some endpoints may return an empty response body.
  }

  if (!response.ok) {
    const shouldRefresh =
      response.status === 401 &&
      attempt === 0 &&
      !options.skipAuth &&
      !['/api/identity/login', '/api/identity/register', '/api/identity/refresh', '/api/identity/logout'].includes(path)

    if (shouldRefresh) {
      try {
        await refreshAccessToken()
        return request(path, options, attempt + 1)
      } catch {
        setStoredToken(null)
        setStoredUser(null)
        emitSessionExpired()
        throw new Error('Session expired. Please sign in again.')
      }
    }

    throw new Error(data?.message || data?.error || 'Request failed')
  }

  return data
}

export const registerUser = async (payload) => {
  const data = await request('/api/identity/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (data?.accessToken) {
    setStoredToken(data.accessToken)
    setStoredUser(data)
    emitLoggedIn()
  }

  return data
}

export const loginUser = async (payload) => {
  const data = await request('/api/identity/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (data?.accessToken) {
    setStoredToken(data.accessToken)
    setStoredUser(data)
    emitLoggedIn()
  }

  return data
}

export const logoutUser = async () => {
  try {
    await request('/api/identity/logout', { method: 'GET' })
  } finally {
    setStoredToken(null)
    setStoredUser(null)
    emitLoggedOut()
  }
}

export const refreshToken = async () => {
  const data = await request('/api/identity/refresh', { method: 'GET' })

  if (data?.accessToken) {
    setStoredToken(data.accessToken)
    setStoredUser(data)
  }

  return data
}

export const isAuthenticated = () => Boolean(getStoredToken())
