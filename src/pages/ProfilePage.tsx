import React, { useEffect, useState } from "react"
import { Box, Paper, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Divider } from "@mui/material"
import { getEntityInfo, type EntityInfo } from "../services/auth"
import { handleEither } from "../utils/either"

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<EntityInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getEntityInfo()
      handleEither(
        result,
        (data) => {
          setProfile(data)
          setLoading(false)
        },
        (errMsg) => {
          setError(errMsg)
          setLoading(false)
        }
      )
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          My Profile
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Entity Type
          </Typography>
          <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
            {profile.entityType}
          </Typography>
        </Box>

        {profile.email && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{profile.email}</Typography>
          </Box>
        )}

        {profile.name && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{profile.name}</Typography>
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Groups
          </Typography>
          {profile.groups.length > 0 ? (
            <List sx={{ bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
              {profile.groups.map((group, index) => (
                <React.Fragment key={group.groupId}>
                  <ListItem>
                    <ListItemText
                      primary={group.groupName}
                      secondary={`ID: ${group.groupId}`}
                    />
                  </ListItem>
                  {index < profile.groups.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              You are not a member of any groups.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default ProfilePage
