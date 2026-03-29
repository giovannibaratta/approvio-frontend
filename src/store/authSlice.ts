import {createSlice, type PayloadAction} from "@reduxjs/toolkit"

export interface AuthState {
  isAuthenticated: boolean
}

const initialState: AuthState = {
  isAuthenticated: false
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
    }
  }
})

export const {setAuthenticated, clearAuth} = authSlice.actions
export default authSlice.reducer
