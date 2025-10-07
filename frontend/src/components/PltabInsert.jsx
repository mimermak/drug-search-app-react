import { useState, useContext } from 'react';
import { TextField, Button, Box, Typography, Alert, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import api from '../api';

// Component για εισαγωγή νέου record στον πίνακα PLTAB
function PltabInsert({ token }) {
  const context = useContext(LanguageContext);
  const language = context ? context.language : 'el';
  const [formData, setFormData] = useState({
    plcolumn: '',
    plcode: '',
    pllang: language,
    pltext: '',
    plstext: '',
    eutct: '',
    selectable: '1',
    seq: '0',
    htmlstyle: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const languages = [
    { value: 'el', label: 'Ελληνικά' },
    { value: 'en', label: 'Αγγλικά' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Εισαγωγή δεδομένων σε /pltab με δεδομένα:', formData);
      await api.post('/pltab', {
        ...formData,
        selectable: parseInt(formData.selectable),
        seq: parseInt(formData.seq)
      });
      setSuccess('Η εισαγωγή ολοκληρώθηκε επιτυχώς!');
      setError('');
      // Καθαρισμός πεδίων μετά την εισαγωγή
      setFormData({
        plcolumn: '',
        plcode: '',
        pllang: language,
        pltext: '',
        plstext: '',
        eutct: '',
        selectable: '1',
        seq: '0',
        htmlstyle: ''
      });
    } catch (err) {
      console.error('Σφάλμα κατά την εισαγωγή δεδομένων PLTAB:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Η εισαγωγή απέτυχε');
      setSuccess('');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Βοηθητικοί Πίνακες (Εισαγωγή)</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Αρχείο"
          name="plcolumn"
          value={formData.plcolumn}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          helperText="Π.χ. formcode, drstatus"
        />
        <TextField
          label="Κωδικός"
          name="plcode"
          value={formData.plcode}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Γλώσσα"
          name="pllang"
          select
          value={formData.pllang}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        >
          {languages.map((lang) => (
            <MenuItem key={lang.value} value={lang.value}>
              {lang.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Κείμενο"
          name="pltext"
          value={formData.pltext}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Σύντομο Κείμενο"
          name="plstext"
          value={formData.plstext}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="EUTCT"
          name="eutct"
          value={formData.eutct}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Selectable"
          name="selectable"
          value={formData.selectable}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
          helperText="Εισάγετε 1 για selectable, 0 για μη selectable"
        />
        <TextField
          label="Σειρά (Sequence)"
          name="seq"
          value={formData.seq}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <TextField
          label="HTML Style"
          name="htmlstyle"
          value={formData.htmlstyle}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Εισαγωγή
        </Button>
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleBackToDashboard}
        >
          Επιστροφή στο Dashboard
        </Button>
      </form>
    </Box>
  );
}

export default PltabInsert;