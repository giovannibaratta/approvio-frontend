import React, {useEffect} from "react"
import {Routes, Route, useNavigate} from "react-router-dom"
import ProfilePage from "./ProfilePage"

export const ProfilePageTestWrapper: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/me")
  }, [navigate])

  return (
    <Routes>
      <Route path="/me" element={<ProfilePage />} />
    </Routes>
  )
}
