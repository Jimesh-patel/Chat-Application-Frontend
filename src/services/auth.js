const ACCESS_TOKEN_KEY = 'chat_app_access_token'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7226'
const SESSION_EXPIRED_EVENT = 'auth:session-expired'

let refreshPromise = null

const getStoredToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

const emitSessionExpired = () => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY)
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
      data = null
    }

    if (!response.ok) {
      setStoredToken(null)
      emitSessionExpired()
      throw new Error(data?.message || data?.error || 'Session expired')
    }

    if (!data?.accessToken) {
      setStoredToken(null)
      emitSessionExpired()
      throw new Error('No access token returned from refresh endpoint')
    }

    setStoredToken(data.accessToken)
    return data.accessToken
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

const request = async (path, options = {}, attempt = 0) => {
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
    data = null
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
  }

  return data
}

export const logoutUser = async () => {
  try {
    await request('/api/identity/logout', { method: 'GET' })
  } finally {
    setStoredToken(null)
  }
}

export const refreshToken = async () => {
  const data = await request('/api/identity/refresh', { method: 'GET' })

  if (data?.accessToken) {
    setStoredToken(data.accessToken)
  }

  return data
}

export const isAuthenticated = () => Boolean(getStoredToken())
