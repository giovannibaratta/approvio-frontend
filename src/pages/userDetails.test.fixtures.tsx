import React, {useEffect} from "react"
import {Routes, Route, useNavigate} from "react-router-dom"
import UserDetailsPage from "./UserDetailsPage"

export const UserDetailsTestWrapper: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/users/user-1")
  }, [navigate])

  return (
    <Routes>
      <Route path="/users/:userId" element={<UserDetailsPage />} />
    </Routes>
  )
}
