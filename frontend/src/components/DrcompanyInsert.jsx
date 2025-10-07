import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Component για εισαγωγή νέου record στον πίνακα DRCOMPANY
function DrcompanyInsert({ token }) {
  const [formData, setFormData] = useState({
    drcomid: '',
    compid: '',
    drugid: '',
    cotype: '',
    comments: '',
    process: '',
    seq: ''
  });

  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Εισαγωγή δεδομένων σε /drcompany με δεδομένα:', formData);
      await api.post('/drcompany', formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Σφάλμα κατά την εισαγωγή δεδομένων DRCOMPANY:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Η εισαγωγή απέτυχε');
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Εισαγωγή DRCOMPANY</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="DrCom ID"
          name="drcomid"
          value={formData.drcomid}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          type="number"
        />
        <TextField
          label="Comp ID"
          name="compid"
          value={formData.compid}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Drug ID"
          name="drugid"
          value={formData.drugid}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="CO Type"
          name="cotype"
          value={formData.cotype}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Comments"
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Process"
          name="process"
          value={formData.process}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Seq"
          name="seq"
          value={formData.seq}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Εισαγωγή
        </Button>
      </form>
    </Box>
  );
}

export default DrcompanyInsert;