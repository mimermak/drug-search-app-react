import { useState, useContext } from 'react';
import { TextField, Button, Box, Typography, Alert, Select, MenuItem } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import translations from '../context/translations';
import { useNavigate } from 'react-router-dom';
import LanguageIcon from '@mui/icons-material/Language';

function Login() {
  const { language, setLanguage } = useContext(LanguageContext);
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting login with language:', language);
      const response = await api.post('/login', { username, password, lang: language });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      login(response.data.token);
      navigate('/dashboard', { state: { fromLogin: true } });
    } catch (err) {
      const errorMessage = err.response?.data?.error || translations[language]?.genericError || translations.EN.genericError;
      console.error('Login error:', err, 'Response:', err.response?.data);
      setError(errorMessage);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    console.log('Changing language to:', newLanguage);
    setLanguage(newLanguage);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <Select
        value={language}
        onChange={handleLanguageChange}
        size="small"
        sx={{
          position: 'fixed',
          top: 8,
          right: 8,
          minWidth: 100,
          '& .MuiSelect-icon': { color: 'primary.main' }
        }}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            {value === 'EL' ? 'Ελληνικά' : 'English'}
          </Box>
        )}
      >
        <MenuItem value="EL">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            Ελληνικά
          </Box>
        </MenuItem>
        <MenuItem value="EN">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            English
          </Box>
        </MenuItem>
      </Select>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 2,
          maxWidth: 400,
          mx: 'auto'
        }}
      >
        <Typography variant="h4" gutterBottom>
          {translations[language]?.loginTitle || translations.EN.loginTitle}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            label={translations[language]?.usernameLabel || translations.EN.usernameLabel}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label={translations[language]?.passwordLabel || translations.EN.passwordLabel}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="contained" type="submit" fullWidth>
            {translations[language]?.loginButton || translations.EN.loginButton}
          </Button>
        </form>
      </Box>
    </Box>
  );
}

export default Login;