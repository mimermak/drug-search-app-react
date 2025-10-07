// Εισαγωγή απαραίτητων modules από το React και το Material-UI
import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import api from '../api';
import { useNavigate } from 'react-router-dom';

// Component για εισαγωγή νέου record στον πίνακα DR
function DrInsert({ token }) {
  // State για τη φόρμα δεδομένων με αρχικές τιμές για κάθε πεδίο του DR
  const [formData, setFormData] = useState({
    drugid: '',    // ID φαρμάκου
    drname: '',    // Όνομα φαρμάκου
    barcode: '',   // Barcode
    drstatus: '',  // Κατάσταση φαρμάκου
    lang: 'el'     // Γλώσσα (προεπιλογή: Ελληνικά)
    // Προσθέστε άλλα πεδία του πίνακα DR αν χρειάζεται
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
      // Κλήση του POST /api/dr για εισαγωγή δεδομένων
      await api.post('/dr', formData);
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
      <Typography variant="h4" gutterBottom>Εισαγωγή DR</Typography>
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
          label="Όνομα Φαρμάκου"
          name="drname"
          value={formData.drname}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Barcode"
          name="barcode"
          value={formData.barcode}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Κατάσταση Φαρμάκου"
          name="drstatus"
          value={formData.drstatus}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Γλώσσα"
          name="lang"
          select
          value={formData.lang}
          onChange={handleChange}
          sx={{ m: 1, minWidth: 120 }}
        >
          <MenuItem value="el">Ελληνικά</MenuItem>
          <MenuItem value="en">Αγγλικά</MenuItem>
        </TextField>
        {/* Προσθέστε άλλα πεδία του πίνακα DR αν χρειάζεται */}
        {/* Κουμπί υποβολής */}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Εισαγωγή
        </Button>
      </form>
    </Box>
  );
}

export default DrInsert;