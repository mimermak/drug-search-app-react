import { useState, useEffect, useContext, useRef } from 'react';
import { TextField, Button, Box, Typography, Alert, Menu, MenuItem } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import api from '../api';

function PltabUpdate({ token }) {
  const { language } = useContext(LanguageContext);
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const { plcolumn, plcode, pllang } = useParams();
  const [formData, setFormData] = useState({
    pltext: '',
    plstext: '',
    eutct: '',
    selectable: 1,
    seq: 0,
    htmlstyle: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Απόκρυψη του sidebar όταν φορτώνεται η σελίδα
    setSidebarVisible(false);

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching pltab data for:', { plcolumn, plcode, pllang });
        const response = await api.get(`/pltab/${plcolumn}/${plcode}/${pllang}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Pltab data retrieved:', response.data);
        setFormData({
          pltext: response.data.pltext || '',
          plstext: response.data.plstext || '',
          eutct: response.data.eutct || '',
          selectable: response.data.selectable || 1,
          seq: response.data.seq || 0,
          htmlstyle: response.data.htmlstyle || ''
        });
      } catch (err) {
        console.error('Error fetching pltab data:', err, 'Response:', err.response?.data);
        setError(err.response?.data?.error || 'Αποτυχία φόρτωσης δεδομένων');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Επαναφορά του sidebar όταν φεύγουμε από τη σελίδα
    return () => setSidebarVisible(true);
  }, [plcolumn, plcode, pllang, token, setSidebarVisible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Submitting pltab update with data:', formData);
      const response = await api.put(`/pltab/${plcolumn}/${plcode}/${pllang}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Update response:', response.data);
      setSuccess('Η εγγραφή ενημερώθηκε επιτυχώς');
      setError('');
      handleMenuClose();
    } catch (err) {
      console.error('Error in pltab update:', err, 'Response:', err.response?.data);
      setError(err.response?.data?.error || 'Η ενημέρωση απέτυχε: Εσωτερικό σφάλμα διακομιστή');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUpdate = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
    handleMenuClose();
  };

  const handleBack = () => {
    console.log('Navigating back to /pltab/search');
    setSidebarVisible(true); // Επανεμφάνιση του sidebar
    navigate('/pltab/search', { replace: true });
    handleMenuClose();
  };

  if (loading) {
    return <Typography>Φόρτωση...</Typography>;
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto', position: 'relative' }}>
      <Button
        variant="outlined"
        color="success"
        size="large"
        onClick={handleMenuClick}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontWeight: 'bold',
          fontSize: '1.5rem',
          minWidth: '48px',
          height: '48px',
          padding: 0
        }}
      >
        ⋮
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleUpdate}>Ενημέρωση</MenuItem>
        <MenuItem onClick={handleBack}>Επιστροφή</MenuItem>
      </Menu>
      <Typography variant="h4" gutterBottom>Ενημέρωση Βοηθητικού Αρχείου</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <form ref={formRef} onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Κείμενο"
            name="pltext"
            value={formData.pltext}
            onChange={handleChange}
            sx={{ flex: '1 1 30%', m: 1 }}
            fullWidth
          />
          <TextField
            label="Σύντομο Κείμενο"
            name="plstext"
            value={formData.plstext}
            onChange={handleChange}
            sx={{ flex: '1 1 30%', m: 1 }}
            fullWidth
          />
          <TextField
            label="EUTCT"
            name="eutct"
            value={formData.eutct}
            onChange={handleChange}
            sx={{ flex: '1 1 30%', m: 1 }}
            fullWidth
          />
          <TextField
            label="Επιλέξιμο"
            name="selectable"
            type="number"
            value={formData.selectable}
            onChange={handleChange}
            sx={{ flex: '1 1 30%', m: 1 }}
            fullWidth
          />
          <TextField
            label="Σειρά (Sequence)"
            name="seq"
            type="number"
            value={formData.seq}
            onChange={handleChange}
            sx={{ flex: '1 1 30%', m: 1 }}
            fullWidth
          />
          <TextField
            label="HTML Style"
            name="htmlstyle"
            value={formData.htmlstyle}
            onChange={handleChange}
            sx={{ flex: '1 1 30%', m: 1 }}
            fullWidth
          />
        </Box>
      </form>
    </Box>
  );
}

export default PltabUpdate;