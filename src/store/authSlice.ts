import {createSlice, type PayloadAction} from "@reduxjs/toolkit"
import type {GetEntityInfoUserResponse, WebSessionContext} from "@approvio/api"
import type {Versioned} from "@approvio/ts-sdk"

interface AuthState {
  isAuthenticated: boolean
  isInitialized: boolean
  orgRole: GetEntityInfoUserResponse["orgRole"] | null
  session: Versioned<WebSessionContext> | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  orgRole: null,
  session: null
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Pick<AuthState, "session" | "orgRole">>) => {
      state.isAuthenticated = action.payload.session !== null
      state.session = action.payload.session
      state.orgRole = action.payload.orgRole
    },
    clearAuth: state => {
      state.isAuthenticated = false
      state.session = null
      state.orgRole = null
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload
    }
  }
})

export const {setSession, clearAuth, setInitialized} = authSlice.actions
export default authSlice.reducer
