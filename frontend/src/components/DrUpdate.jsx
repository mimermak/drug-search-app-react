// Εισαγωγή απαραίτητων modules από το React και το Material-UI
import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// Component για ενημέρωση υπάρχοντος record στον πίνακα DR
function DrUpdate({ token }) {
  // Παίρνουμε το drugid και τη γλώσσα από το URL
  const { drugid, lang } = useParams();

  // State για τη φόρμα δεδομένων
  const [formData, setFormData] = useState({
    drname: '',    // Όνομα φαρμάκου
    barcode: '',   // Barcode
    drstatus: ''   // Κατάσταση φαρμάκου
    // Προσθέστε άλλα πεδία του πίνακα DR αν χρειάζεται
  });

  // State για αποθήκευση μηνύματος σφάλματος
  const [error, setError] = useState('');

  // Hook για πλοήγηση μετά την ενημέρωση
  const navigate = useNavigate();

  // Φόρτωση δεδομένων του record κατά την εκκίνηση
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Ανάκτηση δεδομένων από /dr/${drugid}/${lang}`);
        const response = await api.get(`/dr/${drugid}/${lang}`);
        console.log('Απάντηση δεδομένων:', response.data);
        setFormData(response.data); // Ενημέρωση του state
      } catch (err) {
        console.error('Σφάλμα κατά την ανάκτηση δεδομένων DR:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(err.response?.data?.error || 'Αποτυχία φόρτωσης δεδομένων');
      }
    };
    fetchData();
  }, [drugid, lang]);

  // Συνάρτηση για ενημέρωση του state
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Συνάρτηση για υποβολή της φόρμας
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(`Ενημέρωση δεδομένων σε /dr/${drugid}/${lang} με δεδομένα:`, formData);
      await api.put(`/dr/${drugid}/${lang}`, formData);
      // Επιτυχής ενημέρωση: πλοήγηση στη σελίδα αναζήτησης
      navigate('/search');
    } catch (err) {
      console.error('Σφάλμα κατά την ενημέρωση δεδομένων DR:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Η ενημέρωση απέτυχε');
    }
  };

  return (
    // Container για τη φόρμα με κεντράρισμα και padding
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      {/* Τίτλος της σελίδας */}
      <Typography variant="h4" gutterBottom>Ενημέρωση DR</Typography>
      {/* Εμφάνιση σφάλματος αν υπάρχει */}
      {error && <Alert severity="error">{error}</Alert>}
      {/* Φόρμα ενημέρωσης */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="ID Φαρμάκου"
          name="drugid"
          value={drugid}
          fullWidth
          margin="normal"
          disabled // Μη επεξεργάσιμο, προέρχεται από το URL
        />
        <TextField
          label="Γλώσσα"
          name="lang"
          value={lang}
          fullWidth
          margin="normal"
          disabled // Μη επεξεργάσιμο, προέρχεται από το URL
        />
        <TextField
          label="Όνομα Φαρμάκου"
          name="drname"
          value={formData.drname || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Barcode"
          name="barcode"
          value={formData.barcode || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Κατάσταση Φαρμάκου"
          name="drstatus"
          value={formData.drstatus || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        {/* Προσθέστε άλλα πεδία του πίνακα DR αν χρειάζεται */}
        {/* Κουμπί υποβολής */}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Ενημέρωση
        </Button>
      </form>
    </Box>
  );
}

export default DrUpdate;