import React, {useEffect} from "react"
import {Routes, Route, useNavigate} from "react-router-dom"
import AuditPage from "./AuditPage"

export const AuditPageTestWrapper: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/audit")
  }, [navigate])

  return (
    <Routes>
      <Route path="/audit" element={<AuditPage />} />
    </Routes>
  )
}
