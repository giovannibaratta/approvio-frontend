import {createSlice, type PayloadAction} from "@reduxjs/toolkit"

export interface AuthState {
  isAuthenticated: boolean
  // False if we haven't checked the session yet, true or false after the check is done
  isInitialized: boolean
}

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      console.log("Setting authentication state to:", action.payload)
      state.isAuthenticated = action.payload
    },
    clearAuth: state => {
      console.log("Clearing authentication state.")
      state.isAuthenticated = false
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      console.log("Setting initialization state to:", action.payload)
      state.isInitialized = action.payload
    }
  }
})

export const {setAuthenticated, clearAuth, setInitialized} = authSlice.actions
export default authSlice.reducer
