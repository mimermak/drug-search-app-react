import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Collapse, ListItemIcon, Alert, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Add, Edit, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../api';

// Component για εμφάνιση βασικών στοιχείων DR και νέο menu
function DrugDetails({ token }) {
  const { drugid } = useParams();
  const [drugData, setDrugData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDrDP, setOpenDrDP] = useState(false);
  const [openDrForm, setOpenDrForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrugData = async () => {
      setLoading(true);
      try {
        console.log(`Ανάκτηση δεδομένων από /dr/${drugid}`);
        const response = await api.get(`/dr/${drugid}`);
        console.log('Απάντηση δεδομένων:', response.data);
        setDrugData(response.data);
        setError('');
      } catch (err) {
        console.error('Σφάλμα κατά την ανάκτηση δεδομένων DR:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(err.response?.status === 404 ? 'Το φάρμακο δεν βρέθηκε' : 'Αποτυχία φόρτωσης δεδομένων');
      } finally {
        setLoading(false);
      }
    };
    fetchDrugData();
  }, [drugid]);

  const handleDrDPToggle = () => {
    setOpenDrDP(!openDrDP);
  };

  const handleDrFormToggle = () => {
    setOpenDrForm(!openDrForm);
  };

  const handleBackToSearch = () => {
    navigate('/search');
  };

  if (loading) {
    return <Typography>Φόρτωση...</Typography>;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={handleBackToSearch}>
          Επιστροφή στην Αναζήτηση
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Στοιχεία Φαρμάκου: {drugData.drname || 'Άγνωστο'}</Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body1">ID Φαρμάκου: {drugData.drugid}</Typography>
      <Typography variant="body1">Όνομα: {drugData.drname}</Typography>
      <Typography variant="body1">Μορφή: {drugData.formcode || 'Μη διαθέσιμο'}</Typography>
      <Typography variant="body1">Ισχύς: {drugData.strength || 'Μη διαθέσιμο'}</Typography>
      <Typography variant="body1">Κατάσταση: {drugData.drstatus || 'Μη διαθέσιμο'}</Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h5" gutterBottom>Menu</Typography>
      {/* Submenu για DrDP */}
      <ListItem onClick={handleDrDPToggle}>
        <ListItemText primary="Συσκευασίες (DrDP)" />
        {openDrDP ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openDrDP} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to={`/drdp/insert?drugid=${drugid}`} sx={{ pl: 4 }}>
            <ListItemIcon><Add /></ListItemIcon>
            <ListItemText primary="Εισαγωγή DrDP" />
          </ListItem>
          <ListItem button component={Link} to={`/drdp/update/${drugid}`} sx={{ pl: 4 }}>
            <ListItemIcon><Edit /></ListItemIcon>
            <ListItemText primary="Ενημέρωση DrDP" />
          </ListItem>
        </List>
      </Collapse>
      {/* Submenu για drform */}
      <ListItem onClick={handleDrFormToggle}>
        <ListItemText primary="Μορφές Φαρμάκου (drform)" />
        {openDrForm ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={openDrForm} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem button component={Link} to={`/drform/insert?drugid=${drugid}`} sx={{ pl: 4 }}>
            <ListItemIcon><Add /></ListItemIcon>
            <ListItemText primary="Εισαγωγή drform" />
          </ListItem>
          <ListItem button component={Link} to={`/drform/update/${drugid}`} sx={{ pl: 4 }}>
            <ListItemIcon><Edit /></ListItemIcon>
            <ListItemText primary="Ενημέρωση drform" />
          </ListItem>
        </List>
      </Collapse>
      <Button variant="outlined" sx={{ mt: 2 }} onClick={handleBackToSearch}>
        Επιστροφή στην Αναζήτηση
      </Button>
    </Box>
  );
}

export default DrugDetails;