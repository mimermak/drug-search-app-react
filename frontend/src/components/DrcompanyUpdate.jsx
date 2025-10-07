import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// Component για ενημέρωση υπάρχοντος record στον πίνακα DRCOMPANY
function DrcompanyUpdate({ token }) {
  const { drcomid } = useParams();
  const [formData, setFormData] = useState({
    compid: '',
    drugid: '',
    cotype: '',
    comments: '',
    process: '',
    seq: ''
  });

  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Ανάκτηση δεδομένων από /drcompany/${drcomid}`);
        const response = await api.get(`/drcompany/${drcomid}`);
        console.log('Απάντηση δεδομένων:', response.data);
        setFormData(response.data);
      } catch (err) {
        console.error('Σφάλμα κατά την ανάκτηση δεδομένων DRCOMPANY:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(err.response?.data?.error || 'Αποτυχία φόρτωσης δεδομένων');
      }
    };
    fetchData();
  }, [drcomid]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(`Ενημέρωση δεδομένων σε /drcompany/${drcomid} με δεδομένα:`, formData);
      await api.put(`/drcompany/${drcomid}`, formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Σφάλμα κατά την ενημέρωση δεδομένων DRCOMPANY:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Η ενημέρωση απέτυχε');
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Ενημέρωση DRCOMPANY</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="DrCom ID"
          name="drcomid"
          value={drcomid}
          fullWidth
          margin="normal"
          disabled
        />
        <TextField
          label="Comp ID"
          name="compid"
          value={formData.compid || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Drug ID"
          name="drugid"
          value={formData.drugid || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="CO Type"
          name="cotype"
          value={formData.cotype || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Comments"
          name="comments"
          value={formData.comments || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Process"
          name="process"
          value={formData.process || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Seq"
          name="seq"
          value={formData.seq || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Ενημέρωση
        </Button>
      </form>
    </Box>
  );
}

export default DrcompanyUpdate;