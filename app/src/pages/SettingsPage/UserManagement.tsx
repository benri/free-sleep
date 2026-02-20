import { useState } from 'react';
import {
  Box, Button, TextField, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUserApi, deleteUserApi, User } from '@api/auth';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createUserApi(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUsername('');
      setPassword('');
      setError('');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Failed to create user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
  });

  return (
    <Box>
      <Typography variant="h6" sx={ { mb: 2 } }>Users</Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            { users.map((user) => (
              <TableRow key={ user.id }>
                <TableCell>{ user.username }</TableCell>
                <TableCell>{ user.role }</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={ () => setDeleteTarget(user) }
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )) }
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={ { mt: 3 } }>
        <Typography variant="subtitle1" sx={ { mb: 1 } }>Add User</Typography>
        { error && <Alert severity="error" sx={ { mb: 1 } }>{ error }</Alert> }
        <Box display="flex" gap={ 1 } alignItems="flex-start">
          <TextField
            size="small"
            label="Username"
            value={ username }
            onChange={ (e) => setUsername(e.target.value) }
          />
          <TextField
            size="small"
            label="Password"
            type="password"
            value={ password }
            onChange={ (e) => setPassword(e.target.value) }
          />
          <Button
            variant="contained"
            disabled={ !username || password.length < 6 || createMutation.isPending }
            onClick={ () => createMutation.mutate() }
          >
            Add
          </Button>
        </Box>
      </Box>

      <Dialog open={ !!deleteTarget } onClose={ () => setDeleteTarget(null) }>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete user &quot;{ deleteTarget?.username }&quot;? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={ () => setDeleteTarget(null) }>Cancel</Button>
          <Button
            color="error"
            onClick={ () => deleteTarget && deleteMutation.mutate(deleteTarget.id) }
            disabled={ deleteMutation.isPending }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
