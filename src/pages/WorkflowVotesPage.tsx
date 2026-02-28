import React, {useEffect, useState} from "react"
import {Box, Alert, Typography, Button} from "@mui/material"
import {useParams, Link as RouterLink} from "react-router-dom"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import {listWorkflowVotes, type ListWorkflowVotes200Response} from "../services/api"
import {useNotification} from "../providers/notification/NotificationContext"
import {handleEither} from "../utils/either"
import type {WorkflowVote} from "@approvio/api"
import {useAuthToken} from "../hooks/useAuthToken"
import {DataTable, type Column} from "../components/DataTable"

const columns: Column<WorkflowVote>[] = [
  {id: "voterId", label: "Voter ID", render: (vote) => vote.voterId},
  {id: "voterType", label: "Voter Type", render: (vote) => vote.voterType},
  {
    id: "voteType",
    label: "Vote",
    render: (vote) => {
      let color = "inherit"
      if (vote.voteType === "APPROVE") color = "success.main"
      if (vote.voteType === "VETO") color = "error.main"
      return (
        <Typography variant="body2" sx={{color, fontWeight: "bold"}}>
          {vote.voteType}
        </Typography>
      )
    }
  },
  {id: "reason", label: "Reason", render: (vote) => vote.reason || "No reason"},
  {
    id: "timestamp",
    label: "Date",
    render: (vote) => new Date(vote.timestamp).toLocaleString()
  },
]

const WorkflowVotesPage: React.FC = () => {
  const {workflowId} = useParams<{workflowId: string}>()
  const [votes, setVotes] = useState<WorkflowVote[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Voting API doesn't support pagination, so we mock it for DataTable
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const authToken = useAuthToken()
  const notification = useNotification()

  useEffect(() => {
    const fetchVotes = async () => {
      if (!workflowId) return

      setLoading(true)
      setError(null)

      const result = await listWorkflowVotes(workflowId, authToken)

      handleEither(
        result,
        (response: ListWorkflowVotes200Response) => {
          setVotes(response.votes)
        },
        (errorMessage: string) => {
          setError(errorMessage)
          notification.showError(errorMessage)
        }
      )

      setLoading(false)
    }

    fetchVotes()
  }, [workflowId, authToken, notification])

  const handleChangePage = (newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0)
  }

  if (error) {
    return (
      <Alert severity="error" sx={{m: 2}}>
        {error}
      </Alert>
    )
  }

  // Handle client-side pagination for votes
  const paginatedVotes = votes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // We need to provide a unique id for the table to use as key, since votes might not have a unique ID field
  const votesWithIds = paginatedVotes.map((vote, index) => ({
    ...vote,
    id: `${vote.voterId}-${vote.timestamp}-${index}`
  }))

  return (
    <Box>
      <Box sx={{m: 2, mb: 0}}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/workflows"
          sx={{mb: 2}}
        >
          Back to Workflows
        </Button>
      </Box>
      <DataTable
        title={`Votes for Workflow: ${workflowId}`}
        columns={columns}
        data={votesWithIds}
        loading={loading}
        total={votes.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  )
}

export default WorkflowVotesPage
