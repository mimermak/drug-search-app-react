import { useState, useEffect, useContext, useRef } from 'react';
import { TextField, Button, Box, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Typography, Alert, TableSortLabel, Menu } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function PltabSearch({ token }) {
  const { language } = useContext(LanguageContext);
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const [formData, setFormData] = useState({
    plcolumn: '',
    pllang: ''
  });
  const [results, setResults] = useState([]);
  const [columnOptions, setColumnOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'plcode', direction: 'asc' });
  const [anchorEl, setAnchorEl] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Απόκρυψη του sidebar όταν φορτώνεται η σελίδα
    setSidebarVisible(false);

    const fetchOptions = async () => {
      try {
        setLoading(true);
        console.log('Fetching pltab columns and languages'); // Debugging log
        const columnsResponse = await api.get('/pltab/columns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Columns response:', columnsResponse.data); // Debugging log
        setColumnOptions(columnsResponse.data);

        const languagesResponse = await api.get('/pltab/languages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Languages response:', languagesResponse.data); // Debugging log
        setLanguageOptions(languagesResponse.data);
      } catch (err) {
        console.error('Error fetching pltab options:', err, 'Response:', err.response?.data); // Debugging log
        setError(err.response?.data?.error || 'Αποτυχία φόρτωσης επιλογών');
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();

    // Επαναφορά του sidebar όταν η σελίδα αλλάζει
    return () => setSidebarVisible(true);
  }, [setSidebarVisible, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      plcolumn: '',
      pllang: ''
    });
    setResults([]);
    setError('');
    handleMenuClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plcolumn || !formData.pllang) {
      setError('Παρακαλώ επιλέξτε και Στήλη και Γλώσσα');
      return;
    }
    try {
      setLoading(true);
      const params = { lang: formData.pllang, column: formData.plcolumn };
      console.log('Submitting pltab search with params:', params); // Debugging log
      console.log('Token used for request:', token); // Debugging log
      const response = await api.get('/pltab', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Search response:', response.data);
      setResults(response.data);
      setError('');
    } catch (err) {
      console.error('Error in pltab search:', err, 'Response:', err.response?.data);
      setError(err.response?.data?.error || 'Η αναζήτηση απέτυχε: Εσωτερικό σφάλμα διακομιστή');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortConfig.key] ?? '';
    const bValue = b[sortConfig.key] ?? '';
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
    handleMenuClose();
  };

  const handleInsert = () => {
    console.log('Navigating to /pltab/insert');
    navigate('/pltab/insert');
    handleMenuClose();
  };

  const handleBack = () => {
    console.log('Navigating back to /dashboard');
    setSidebarVisible(true); // Επανεμφάνιση του sidebar
    navigate('/dashboard', { replace: true });
    handleMenuClose();
  };

  const handleRowClick = (plcolumn, plcode, pllang) => {
    if (!plcolumn || !plcode || !pllang) {
      console.error('Invalid parameters for navigation:', { plcolumn, plcode, pllang });
      setError('Μη έγκυρα δεδομένα για πλοήγηση');
      return;
    }
    console.log(`Navigating to update for plcolumn: ${plcolumn}, plcode: ${plcode}, pllang: ${pllang}`);
    navigate(`/pltab/update/${encodeURIComponent(plcolumn)}/${encodeURIComponent(plcode)}/${encodeURIComponent(pllang)}`);
  };

  console.log('Rendering PltabSearch with formData:', formData); // Debugging log

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
        <MenuItem onClick={handleSearch}>Αναζήτηση</MenuItem>
        <MenuItem onClick={handleClear}>Καθαρισμός</MenuItem>
        <MenuItem onClick={handleInsert}>Νέα Εγγραφή</MenuItem>
        <MenuItem onClick={handleBack}>Επιστροφή</MenuItem>
      </Menu>
      <Typography variant="h4" gutterBottom>Αναζήτηση Βοηθητικών Αρχείων</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form ref={formRef} onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Στήλη"
            name="plcolumn"
            select
            value={formData.plcolumn}
            onChange={handleChange}
            sx={{ m: 1, minWidth: 200 }}
          >
            <MenuItem value=""><em>Καμία επιλογή</em></MenuItem>
            {columnOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Γλώσσα"
            name="pllang"
            select
            value={formData.pllang}
            onChange={handleChange}
            sx={{ m: 1, minWidth: 200 }}
          >
            <MenuItem value=""><em>Καμία επιλογή</em></MenuItem>
            {languageOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </form>
      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Βρέθηκαν {results.length} εγγραφές
          </Typography>
          <Table sx={{ mt: 2, border: 1, borderColor: 'divider', boxShadow: 3 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main', color: 'common.white' }}>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'plcode'}
                    direction={sortConfig.key === 'plcode' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('plcode')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    Κωδικός
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'pltext'}
                    direction={sortConfig.key === 'pltext' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('pltext')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    Κείμενο
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'plstext'}
                    direction={sortConfig.key === 'plstext' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('plstext')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    Σύντομο Κείμενο
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'eutct'}
                    direction={sortConfig.key === 'eutct' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('eutct')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    EUTCT
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'selectable'}
                    direction={sortConfig.key === 'selectable' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('selectable')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    Επιλέξιμο
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedResults.map((row, index) => (
                <TableRow
                  key={`${row.plcolumn}-${row.plcode}-${row.pllang}-${index}`}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    '&:nth-of-type(odd)': { backgroundColor: 'action.disabledBackground' }
                  }}
                >
                  <TableCell
                    sx={{ borderRight: 1, borderColor: 'divider', cursor: 'pointer' }}
                    onClick={() => handleRowClick(row.plcolumn, row.plcode, row.pllang)}
                  >
                    {row.plcode}
                  </TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{row.pltext || 'Μη διαθέσιμο'}</TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{row.plstext || 'Μη διαθέσιμο'}</TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{row.eutct || 'Μη διαθέσιμο'}</TableCell>
                  <TableCell>{row.selectable ? 'Ναι' : 'Όχι'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

export default PltabSearch;