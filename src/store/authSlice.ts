import {createSlice, type PayloadAction} from "@reduxjs/toolkit"

export interface AuthState {
  token: string | null
  isAuthenticated: boolean
}

const loadTokenFromLocalStorage = (): string | null => {
  try {
    const token = localStorage.getItem("authToken")
    return token
  } catch (e) {
    console.error("Could not load token from localStorage", e)
    return null
  }
}

const saveTokenToLocalStorage = (token: string) => {
  try {
    localStorage.setItem("authToken", token)
  } catch (e) {
    console.error("Could not save token to localStorage", e)
  }
}

const removeTokenFromLocalStorage = () => {
  try {
    localStorage.removeItem("authToken")
  } catch (e) {
    console.error("Could not remove token from localStorage", e)
  }
}

const persistedToken = loadTokenFromLocalStorage()

const initialState: AuthState = {
  token: persistedToken,
  isAuthenticated: persistedToken !== null
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
      saveTokenToLocalStorage(action.payload)
    },
    clearToken: state => {
      state.token = null
      state.isAuthenticated = false
      removeTokenFromLocalStorage()
    }
  }
})

export const {setToken, clearToken} = authSlice.actions
export default authSlice.reducer
