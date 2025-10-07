import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import api from '../api';
import { useNavigate } from 'react-router-dom';

// Component για εισαγωγή νέου record στον πίνακα DRATC
function DratcInsert({ token }) {
  // State για τη φόρμα δεδομένων με αρχικές τιμές για τα πεδία του DRATC
  const [formData, setFormData] = useState({
    drugid: '', // ID του φαρμάκου (π.χ. DR00001)
    atccode: '' // ATC κωδικός (π.χ. N02BE01)
  });

  // State για αποθήκευση μηνύματος σφάλματος
  const [error, setError] = useState('');

  // Hook για πλοήγηση μετά την εισαγωγή
  const navigate = useNavigate();

  // Συνάρτηση για ενημέρωση του state όταν αλλάζει ένα πεδίο
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Συνάρτηση για υποβολή της φόρμας
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Κλήση του POST /api/dratc endpoint
      await api.post('/dratc', formData);
      // Επιτυχής εισαγωγή: πλοήγηση στη σελίδα αναζήτησης
      navigate('/search');
    } catch (err) {
      // Εμφάνιση σφάλματος αν η εισαγωγή αποτύχει
      setError(err.response?.data?.error || 'Insert failed');
    }
  };

  return (
    // Container για τη φόρμα
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      {/* Τίτλος της σελίδας */}
      <Typography variant="h4" gutterBottom>Insert DRATC</Typography>
      {/* Εμφάνιση σφάλματος αν υπάρχει */}
      {error && <Alert severity="error">{error}</Alert>}
      {/* Φόρμα εισαγωγής */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Drug ID"
          name="drugid"
          value={formData.drugid}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="ATC Code"
          name="atccode"
          value={formData.atccode}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        {/* Κουμπί υποβολής */}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Insert
        </Button>
      </form>
    </Box>
  );
}

export default DratcInsert;