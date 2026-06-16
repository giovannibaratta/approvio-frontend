import {createSlice, type PayloadAction} from "@reduxjs/toolkit"
import {GetEntityInfoUserResponse} from "@approvio/api"

export interface AuthState {
  isAuthenticated: boolean
  // False if we haven't checked the session yet, true or false after the check is done
  isInitialized: boolean
  orgRole: GetEntityInfoUserResponse["orgRole"] | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  orgRole: null
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (
      state,
      action: PayloadAction<{isAuthenticated: boolean; orgRole: GetEntityInfoUserResponse["orgRole"]}>
    ) => {
      console.log("Setting authentication state to:", action.payload.isAuthenticated)
      state.isAuthenticated = action.payload.isAuthenticated
      state.orgRole = action.payload.orgRole
    },
    clearAuth: state => {
      console.log("Clearing authentication state.")
      state.isAuthenticated = false
      state.orgRole = null
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      console.log("Setting initialization state to:", action.payload)
      state.isInitialized = action.payload
    }
  }
})

export const {setAuthenticated, clearAuth, setInitialized} = authSlice.actions
export default authSlice.reducer
