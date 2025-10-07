// Εισαγωγή απαραίτητων modules από το React και το Material-UI
import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// Component για ενημέρωση υπάρχοντος record στον πίνακα ATC
function AtcUpdate({ token }) {
  // Παίρνουμε το atcCode από το URL
  const { atcCode } = useParams();

  // State για τη φόρμα δεδομένων
  const [formData, setFormData] = useState({
    description: '' // Περιγραφή ATC
    // Προσθέστε άλλα πεδία του πίνακα ATC αν χρειάζεται
  });

  // State για αποθήκευση μηνύματος σφάλματος
  const [error, setError] = useState('');

  // Hook για πλοήγηση μετά την ενημέρωση
  const navigate = useNavigate();

  // Φόρτωση δεδομένων του record κατά την εκκίνηση
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Ανάκτηση δεδομένων από /atc/${atcCode}`);
        const response = await api.get(`/atc/${atcCode}`);
        console.log('Απάντηση δεδομένων:', response.data);
        setFormData(response.data); // Ενημέρωση του state
      } catch (err) {
        console.error('Σφάλμα κατά την ανάκτηση δεδομένων ATC:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(err.response?.data?.error || 'Αποτυχία φόρτωσης δεδομένων');
      }
    };
    fetchData();
  }, [atcCode]);

  // Συνάρτηση για ενημέρωση του state
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Συνάρτηση για υποβολή της φόρμας
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(`Ενημέρωση δεδομένων σε /atc/${atcCode} με δεδομένα:`, formData);
      await api.put(`/atc/${atcCode}`, formData);
      // Επιτυχής ενημέρωση: πλοήγηση στη σελίδα αναζήτησης
      navigate('/search');
    } catch (err) {
      console.error('Σφάλμα κατά την ενημέρωση δεδομένων ATC:', {
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
      <Typography variant="h4" gutterBottom>Ενημέρωση ATC</Typography>
      {/* Εμφάνιση σφάλματος αν υπάρχει */}
      {error && <Alert severity="error">{error}</Alert>}
      {/* Φόρμα ενημέρωσης */}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Κωδικός ATC"
          name="atcCode"
          value={atcCode}
          fullWidth
          margin="normal"
          disabled // Μη επεξεργάσιμο, προέρχεται από το URL
        />
        <TextField
          label="Περιγραφή"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        {/* Προσθέστε άλλα πεδία του πίνακα ATC αν χρειάζεται */}
        {/* Κουμπί υποβολής */}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Ενημέρωση
        </Button>
      </form>
    </Box>
  );
}

export default AtcUpdate;