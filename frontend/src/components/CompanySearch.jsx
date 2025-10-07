import { useState, useEffect, useContext, useRef } from 'react';
import { TextField, Button, Box, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Typography, Alert, TableSortLabel, Menu, Select, Pagination, IconButton, Tooltip, Autocomplete } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import translations from '../context/translations';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Description from '@mui/icons-material/Description';
import LanguageIcon from '@mui/icons-material/Language';

function CompanySearch({ token }) {
  const { language, setLanguage } = useContext(LanguageContext);
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const [formData, setFormData] = useState({
    compid: '',
    coname: '',
    emeanumber: '',
    country: ''
  });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [countryOptions, setCountryOptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'coname', direction: 'asc' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const isSearchDisabled = !formData.compid && !formData.coname && !formData.emeanumber && !formData.country;

  useEffect(() => {
    setSidebarVisible(false);
    const fetchOptions = async () => {
      try {
        setLoading(true);
        console.log('Fetching pltab data for country dropdown, lang:', language); // Debug log
        const countryResponse = await api.get('/pltab', {
          params: { lang: language, column: 'STCOUNTR' },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Country dropdown response:', countryResponse.data); // Debug log
        const options = countryResponse.data.map(item => ({
          value: item.plcode,
          label: item.pltext || item.plcode
        })).sort((a, b) => a.label.localeCompare(b.label));
        console.log('Country dropdown options set:', options); // Debug log
        setCountryOptions(options);
      } catch (err) {
        console.error('Error fetching country dropdown options:', err.message, 'Response:', err.response?.data); // Debug log
        setError(err.response?.data?.error || translations[language]?.pltabFetchError || translations.EN.pltabFetchError);
        setCountryOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
    return () => setSidebarVisible(true);
  }, [setSidebarVisible, token, language]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Changing form field:', { name, value }); // Debug log
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase()
    }));
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    console.log('Changing language to:', newLanguage); // Debug log
    setLanguage(newLanguage);
  };

  const handleAutocompleteChange = (event, newValue) => {
    console.log('Changing country to:', newValue ? newValue.value : ''); // Debug log
    setFormData(prev => ({
      ...prev,
      country: newValue ? newValue.value : ''
    }));
  };

  const handleClear = () => {
    console.log('Clearing form data'); // Debug log
    setFormData({
      compid: '',
      coname: '',
      emeanumber: '',
      country: ''
    });
    setResults([]);
    setTotal(0);
    setPage(1);
    setError('');
    handleMenuClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearchDisabled) {
      console.log('Search disabled, no valid fields'); // Debug log
      setError('');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const params = {
        compid: formData.compid || undefined,
        coname: formData.coname || undefined,
        emeanumber: formData.emeanumber || undefined,
        country: formData.country || '', // Always send country, even if empty
        lang: language,
        limit: rowsPerPage,
        offset: (page - 1) * rowsPerPage
      };
      console.log('Submitting company search with params:', params); // Debug log
      console.log('Token used for request:', token ? 'Token present' : 'No token'); // Debug log
      const response = await api.get('/company', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Raw company search response:', response.data); // Debug log
      if (response.data && typeof response.data === 'object') {
        let fetchedResults = response.data.results || response.data;
        if (Array.isArray(fetchedResults)) {
          setResults(fetchedResults);
          setTotal(response.data.total !== undefined ? response.data.total : fetchedResults.length);
          console.log('Results set:', fetchedResults); // Debug log
          if (fetchedResults.length === 0) {
            console.log('No results found'); // Debug log
            setError(translations[language]?.noCompaniesFound || translations.EN.noCompaniesFound);
          } else {
            setError(''); // Clear error if results are found
          }
        } else {
          console.error('Unexpected response structure, no valid results array:', response.data); // Debug log
          setResults([]);
          setTotal(0);
          setError(translations[language]?.searchError || translations.EN.searchError);
        }
      } else {
        console.error('Invalid response format:', response.data); // Debug log
        setResults([]);
        setTotal(0);
        setError(translations[language]?.searchError || translations.EN.searchError);
      }
    } catch (err) {
      console.error('Error in company search:', err.message, 'Response:', err.response?.data); // Debug log
      setError(err.response?.data?.error === 'No companies found'
        ? translations[language]?.noCompaniesFound || translations.EN.noCompaniesFound
        : err.response?.data?.error || translations[language]?.searchError || translations.EN.searchError);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (results.length === 0) {
      console.log('No results to export'); // Debug log
      setError(translations[language]?.noResults || translations.EN.noResults);
      return;
    }
    const worksheetData = results.map(row => ({
      [translations[language]?.compidLabel || translations.EN.compidLabel]: row.compid || translations[language]?.notAvailable || translations.EN.notAvailable,
      [translations[language]?.conameLabel || translations.EN.conameLabel]: row.coname || translations[language]?.notAvailable || translations.EN.notAvailable,
      [translations[language]?.addressColumn || translations.EN.addressColumn]: row.address || translations[language]?.notAvailable || translations.EN.notAvailable,
      [translations[language]?.countryColumn || translations.EN.countryColumn]: row.country_text || translations[language]?.notAvailable || translations.EN.notAvailable,
      [translations[language]?.regNumberColumn || translations.EN.regNumberColumn]: row.regnumber || translations[language]?.notAvailable || translations.EN.notAvailable
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Search Results');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'company_search_results.xlsx');
  };

  const handleSort = (key) => {
    console.log('Sorting by:', key); // Debug log
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
    console.log('Menu clicked'); // Debug log
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    console.log('Menu closed'); // Debug log
    setAnchorEl(null);
  };

  const handleSearch = () => {
    if (isSearchDisabled) {
      console.log('Search disabled, no valid fields'); // Debug log
      setError('');
      return;
    }
    if (formRef.current) {
      console.log('Submitting form'); // Debug log
      formRef.current.requestSubmit();
    }
    handleMenuClose();
  };

  const handleBack = () => {
    console.log('Navigating back to /dashboard'); // Debug log
    setSidebarVisible(true);
    navigate('/dashboard', { replace: true });
    handleMenuClose();
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('Changing rows per page to:', newRowsPerPage); // Debug log
    setRowsPerPage(newRowsPerPage);
    setPage(1);
    handleSearch();
  };

  const handlePageChange = (event, newPage) => {
    console.log('Changing page to:', newPage); // Debug log
    setPage(newPage);
    handleSearch();
  };

  if (loading) {
    return <Typography>{translations[language]?.loading || translations.EN.loading}</Typography>;
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto', position: 'relative' }}>
      <Select
        value={language}
        onChange={handleLanguageChange}
        size="small"
        sx={{
          position: 'fixed',
          top: 8,
          right: 8,
          minWidth: 100,
          '& .MuiSelect-icon': { color: 'primary.main' }
        }}
        renderValue={(value) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            {value === 'EL' ? 'Ελληνικά' : 'English'}
          </Box>
        )}
      >
        <MenuItem value="EL">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            Ελληνικά
          </Box>
        </MenuItem>
        <MenuItem value="EN">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            English
          </Box>
        </MenuItem>
      </Select>
      <Tooltip title={translations[language]?.menuTooltip || translations.EN.menuTooltip || 'Επιλογές'}>
        <Button
          variant="outlined"
          color="success"
          size="large"
          onClick={handleMenuClick}
          sx={{
            position: 'absolute',
            top: 64, // Moved down to avoid overlap with language selector
            right: 16,
            fontWeight: 'bold',
            fontSize: '2rem', // Increased size for emphasis
            minWidth: 60, // Increased width
            height: 60, // Increased height
            padding: 4, // Increased padding for better visibility
            color: '#1976d2' // Blue color for the dots
          }}
        >
          ⋮
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleSearch} disabled={isSearchDisabled}>
          {translations[language]?.searchButton || translations.EN.searchButton}
        </MenuItem>
        <MenuItem onClick={handleClear}>
          {translations[language]?.clearButton || translations.EN.clearButton}
        </MenuItem>
        <MenuItem onClick={handleBack}>
          {translations[language]?.backButton || translations.EN.backButton}
        </MenuItem>
      </Menu>
      <Typography variant="h4" gutterBottom>
        {translations[language]?.companySearchTitle || translations.EN.companySearchTitle}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form ref={formRef} onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Tooltip title={translations[language]?.compidTooltip || translations.EN.compidTooltip}>
            <TextField
              label={translations[language]?.compidLabel || translations.EN.compidLabel}
              name="compid"
              value={formData.compid}
              onChange={handleChange}
              sx={{ m: 1, minWidth: 200 }}
            />
          </Tooltip>
          <Tooltip title={translations[language]?.conameTooltip || translations.EN.conameTooltip}>
            <TextField
              label={translations[language]?.conameLabel || translations.EN.conameLabel}
              name="coname"
              value={formData.coname}
              onChange={handleChange}
              sx={{ m: 1, minWidth: 300 }}
            />
          </Tooltip>
          <Tooltip title={translations[language]?.emeanumberTooltip || translations.EN.emeanumberTooltip}>
            <TextField
              label={translations[language]?.emeanumberLabel || translations.EN.emeanumberLabel}
              name="emeanumber"
              value={formData.emeanumber}
              onChange={handleChange}
              sx={{ m: 1, minWidth: 200 }}
            />
          </Tooltip>
          <Tooltip title={translations[language]?.countryTooltip || translations.EN.countryTooltip}>
            <Autocomplete
              options={countryOptions}
              getOptionLabel={(option) => option.label}
              value={countryOptions.find(option => option.value === formData.country) || null}
              onChange={handleAutocompleteChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={translations[language]?.countryLabel || translations.EN.countryLabel}
                  sx={{ m: 1, minWidth: 200 }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.value}>{option.label}</li>
              )}
              sx={{ m: 1, minWidth: 200 }}
            />
          </Tooltip>
        </Box>
      </form>
      {results.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {translations[language]?.resultsFound.replace('{total}', total) || translations.EN.resultsFound.replace('{total}', total)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body2" component="span">
                {translations[language]?.rowsPerPage || translations.EN.rowsPerPage}
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                sx={{ ml: 1, minWidth: 80 }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </Box>
            <Box>
              {results.length > 0 && (
                <Tooltip title={translations[language]?.exportToExcelTooltip || translations.EN.exportToExcelTooltip}>
                  <IconButton
                    color="primary"
                    onClick={handleExportToExcel}
                    sx={{ mr: 2 }}
                  >
                    <Description />
                  </IconButton>
                </Tooltip>
              )}
              <Pagination
                count={Math.ceil(total / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </Box>
          <Table sx={{ mt: 2, border: 1, borderColor: 'divider', boxShadow: 3 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main', color: 'common.white' }}>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'compid'}
                    direction={sortConfig.key === 'compid' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('compid')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    {translations[language]?.compidLabel || translations.EN.compidLabel}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 300 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'coname'}
                    direction={sortConfig.key === 'coname' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('coname')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    {translations[language]?.conameLabel || translations.EN.conameLabel}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ minWidth: 300 }}>
                  <TableSortLabel
                    active={sortConfig.key === 'address'}
                    direction={sortConfig.key === 'address' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('address')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    {translations[language]?.addressColumn || translations.EN.addressColumn}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'country_text'}
                    direction={sortConfig.key === 'country_text' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('country_text')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    {translations[language]?.countryColumn || translations.EN.countryColumn}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'regnumber'}
                    direction={sortConfig.key === 'regnumber' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('regnumber')}
                    sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                  >
                    {translations[language]?.regNumberColumn || translations.EN.regNumberColumn}
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedResults.map((row, index) => (
                <TableRow
                  key={`${row.compid}-${index}`}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    '&:nth-of-type(odd)': { backgroundColor: 'action.disabledBackground' }
                  }}
                >
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                    {row.compid || translations[language]?.notAvailable || translations.EN.notAvailable}
                  </TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider', minWidth: 300 }}>
                    {row.coname || translations[language]?.notAvailable || translations.EN.notAvailable}
                  </TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider', minWidth: 300 }}>
                    {row.address || translations[language]?.notAvailable || translations.EN.notAvailable}
                  </TableCell>
                  <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                    {row.country_text || translations[language]?.notAvailable || translations.EN.notAvailable}
                  </TableCell>
                  <TableCell>
                    {row.regnumber || translations[language]?.notAvailable || translations.EN.notAvailable}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Pagination
              count={Math.ceil(total / rowsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : null}
    </Box>
  );
}

export default CompanySearch;