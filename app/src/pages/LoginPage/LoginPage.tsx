import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { login } from '@api/auth';
import { useAuthStore } from '@state/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token } = await login(username, password);
      setToken(token);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Card sx={ { maxWidth: 400, width: '100%', mx: 2 } }>
        <CardContent>
          <Typography variant="h5" gutterBottom align="center">
            Login
          </Typography>

          { error && (
            <Alert severity="error" sx={ { mb: 2 } }>
              { error }
            </Alert>
          ) }

          <Box component="form" onSubmit={ handleSubmit }>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={ username }
              onChange={ (e) => setUsername(e.target.value) }
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={ password }
              onChange={ (e) => setPassword(e.target.value) }
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={ loading || !username || !password }
              sx={ { mt: 2 } }
            >
              { loading ? 'Logging in...' : 'Login' }
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
