import { useState } from 'react';
import {
  Box, Button, TextField, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert, MenuItem, Select, FormControl, InputLabel, SelectChangeEvent,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUserApi, updateUserApi, deleteUserApi, User } from '@api/auth';
import PageContainer from '../PageContainer.tsx';
import Section from '../SettingsPage/Section.tsx';
import { useAuthStore } from '@state/authStore.ts';

const ROLES = ['admin', 'user'] as const;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // Add user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('user');
  const [error, setError] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Edit state
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editError, setEditError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => createUserApi(username, password, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUsername('');
      setPassword('');
      setRole('user');
      setError('');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; password?: string; role?: string }) =>
      updateUserApi(data.id, { password: data.password, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeEditDialog();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setEditError(axiosErr.response?.data?.error || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
  });

  const openEditDialog = (user: User) => {
    setEditTarget(user);
    setEditPassword('');
    setEditRole(user.role);
    setEditError('');
  };

  const closeEditDialog = () => {
    setEditTarget(null);
    setEditPassword('');
    setEditRole('');
    setEditError('');
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    const data: { id: number; password?: string; role?: string } = { id: editTarget.id };
    if (editPassword) data.password = editPassword;
    if (editRole !== editTarget.role) data.role = editRole;
    if (!data.password && !data.role) {
      closeEditDialog();
      return;
    }
    updateMutation.mutate(data);
  };

  return (
    <PageContainer sx={ { mb: 15, mt: 2 } }>
      <Section title="Users">
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
                    { user.id !== currentUser?.userId && (
                      <>
                        <Button size="small" onClick={ () => openEditDialog(user) }>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={ () => setDeleteTarget(user) }
                        >
                          Delete
                        </Button>
                      </>
                    ) }
                  </TableCell>
                </TableRow>
              )) }
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={ { mt: 3 } }>
          <Typography variant="subtitle1" sx={ { mb: 1 } }>Add User</Typography>
          { error && <Alert severity="error" sx={ { mb: 1 } }>{ error }</Alert> }
          <Box display="flex" gap={ 1 } alignItems="flex-start" flexWrap="wrap">
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
            <FormControl size="small" sx={ { minWidth: 100 } }>
              <InputLabel>Role</InputLabel>
              <Select
                value={ role }
                label="Role"
                onChange={ (e: SelectChangeEvent) => setRole(e.target.value) }
              >
                { ROLES.map((r) => (
                  <MenuItem key={ r } value={ r }>{ r }</MenuItem>
                )) }
              </Select>
            </FormControl>
            <Button
              variant="contained"
              disabled={ !username || password.length < 6 || createMutation.isPending }
              onClick={ () => createMutation.mutate() }
            >
              Add
            </Button>
          </Box>
        </Box>
      </Section>

      {/* Delete confirmation dialog */}
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

      {/* Edit user dialog */}
      <Dialog open={ !!editTarget } onClose={ closeEditDialog } maxWidth="xs" fullWidth>
        <DialogTitle>Edit User &quot;{ editTarget?.username }&quot;</DialogTitle>
        <DialogContent>
          { editError && <Alert severity="error" sx={ { mb: 2 } }>{ editError }</Alert> }
          <TextField
            fullWidth
            size="small"
            label="New Password"
            type="password"
            value={ editPassword }
            onChange={ (e) => setEditPassword(e.target.value) }
            placeholder="Leave blank to keep current"
            sx={ { mt: 1, mb: 2 } }
          />
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={ editRole }
              label="Role"
              onChange={ (e: SelectChangeEvent) => setEditRole(e.target.value) }
            >
              { ROLES.map((r) => (
                <MenuItem key={ r } value={ r }>{ r }</MenuItem>
              )) }
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={ closeEditDialog }>Cancel</Button>
          <Button
            variant="contained"
            onClick={ handleSaveEdit }
            disabled={ updateMutation.isPending || (editPassword.length > 0 && editPassword.length < 6) }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
