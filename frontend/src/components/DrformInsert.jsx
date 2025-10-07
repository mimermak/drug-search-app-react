// Εισαγωγή απαραίτητων modules από το React και το Material-UI
import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import api from '../api';
import { useNavigate } from 'react-router-dom';

// Component για εισαγωγή νέου record στον πίνακα DRFORM
function DrformInsert({ token }) {
  // State για τη φόρμα δεδομένων με αρχικές τιμές για κάθε πεδίο του DRFORM
  const [formData, setFormData] = useState({
    drugid: '',    // ID φαρμάκου
    formcode: '',  // Κωδικός μορφής
    strength: ''   // Ισχύς
    // Προσθέστε άλλα πεδία του πίνακα DRFORM αν χρειάζεται
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
    e.preventDefault(); // Αποτρέπει το default refresh της φόρμας
    try {
      // Κλήση του POST /api/drform για εισαγωγή δεδομένων
      await api.post('/drform', formData);
      // Επιτυχής εισαγωγή: πλοήγηση στη σελίδα αναζήτησης
      navigate('/search');
    } catch (err) {
      // Εμφάνιση σφάλματος αν η εισαγωγή αποτύχει
      setError(err.response?.data?.error || 'Η εισαγωγή απέτυχε');
    }
  };

  return (
    // Container για τη φόρμα με κεντράρισμα και padding
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      {/* Τίτλος της σελίδας */}
      <Typography variant="h4" gutterBottom>Εισαγωγή DRFORM</Typography>
      {/* Εμφάνιση σφάλματος αν υπάρχει */}
      {error && <Alert severity="error">{error}</Alert>}
      {/* Φόρμα εισαγωγής */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="ID Φαρμάκου"
          name="drugid"
          value={formData.drugid}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Κωδικός Μορφής"
          name="formcode"
          value={formData.formcode}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Ισχύς"
          name="strength"
          value={formData.strength}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        {/* Προσθέστε άλλα πεδία του πίνακα DRFORM αν χρειάζεται */}
        {/* Κουμπί υποβολής */}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Εισαγωγή
        </Button>
      </form>
    </Box>
  );
}

export default DrformInsert;