import React, {useEffect} from "react"
import {Routes, Route, useNavigate} from "react-router-dom"
import LoginPage from "./LoginPage"

export const LoginPageTestWrapper: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/login")
  }, [navigate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}
