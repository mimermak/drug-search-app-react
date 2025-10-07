import { useState, useEffect, useContext, useRef, memo } from 'react';
import { TextField, Button, Box, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Typography, Alert, TableSortLabel, Menu, Autocomplete, Select, Pagination, IconButton, Tooltip } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import translations from '../context/translations';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Description from '@mui/icons-material/Description';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Search = memo(({ token }) => {
  const { language } = useContext(LanguageContext);
  const effectiveLanguage = language || 'EL';
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('searchState');
    return saved ? JSON.parse(saved).formData : {
      drname: '',
      drstatus: '',
      FORM: '',
      drtype: '',
      applicproc: '',
      atccode: '',
      substancs: '',
      company: '',
      cotype: 'AG'
    };
  });
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('searchState');
    return saved ? JSON.parse(saved).results : [];
  });
  const [total, setTotal] = useState(() => {
    const saved = localStorage.getItem('searchState');
    return saved ? JSON.parse(saved).total : 0;
  });
  const [statusOptions, setStatusOptions] = useState([]);
  const [formOptions, setFormOptions] = useState([]);
  const [drtypeOptions, setDrtypeOptions] = useState([]);
  const [applicprocOptions, setApplicprocOptions] = useState([]);
  const [cotypeOptions, setCotypeOptions] = useState([]);
  const [atcOptions, setAtcOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [drugOptions, setDrugOptions] = useState([]);
  const [substancsOptions, setSubstancsOptions] = useState([]);
  const [atcInput, setAtcInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [drugInput, setDrugInput] = useState(formData.drname);
  const [substancsInput, setSubstancsInput] = useState(formData.substancs);
  const [companyValue, setCompanyValue] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = localStorage.getItem('searchState');
    return saved ? JSON.parse(saved).sortConfig : { key: 'drname', direction: 'asc' };
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [rowAnchorEl, setRowAnchorEl] = useState(null);
  const [selectedDrugId, setSelectedDrugId] = useState(null);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('searchState');
    return saved ? JSON.parse(saved).page : 1;
  });
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem('searchState');
    return saved ? JSON.parse(saved).rowsPerPage : 10;
  });
  const formRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isSearchDisabled = !formData.drname && !formData.drstatus && !formData.FORM && !formData.drtype && !formData.applicproc && !formData.atccode && !formData.substancs && !formData.company;

  console.log('Search component rendered at:', new Date().toISOString());
  console.log('Token passed to Search:', token ? 'Token present' : 'No token');
  console.log('Current language:', effectiveLanguage);
  console.log('Translations for noPriceListFound:', translations[effectiveLanguage]?.noPriceListFound);

  useEffect(() => {
    console.log('Setting sidebar visibility to false');
    setSidebarVisible(false);
    if (location.state?.fromDashboard || location.state?.fromLogin) {
      console.log('Clearing search state due to navigation from dashboard or login');
      localStorage.removeItem('searchState');
      setFormData({
        drname: '',
        drstatus: '',
        FORM: '',
        drtype: '',
        applicproc: '',
        atccode: '',
        substancs: '',
        company: '',
        cotype: 'AG'
      });
      setResults([]);
      setTotal(0);
      setPage(1);
      setError('');
      setDrugInput('');
      setSubstancsInput('');
    }
    const fetchOptions = async () => {
      try {
        setLoading(true);
        console.log('Fetching options for dropdowns');

        const statusResponse = await api.get('/pltab', {
          params: { lang: effectiveLanguage, column: 'DRSTATUS' },
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatusOptions(statusResponse.data.map(item => ({
          value: item.plcode,
          label: item.pltext || item.plcode
        })));
        const formResponse = await api.get('/pltab', {
          params: { lang: effectiveLanguage, column: 'FORM' },
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormOptions(formResponse.data.map(item => ({
          value: item.plcode,
          label: item.plstext || item.plcode
        })).sort((a, b) => a.label.localeCompare(b.label)));
        const drtypeResponse = await api.get('/pltab', {
          params: { lang: effectiveLanguage, column: 'DRTYPE' },
          headers: { Authorization: `Bearer ${token}` }
        });
        setDrtypeOptions(drtypeResponse.data.map(item => ({
          value: item.plcode,
          label: item.pltext || item.plcode
        })));
        const applicprocResponse = await api.get('/pltab', {
          params: { lang: effectiveLanguage, column: 'APPLICPROC' },
          headers: { Authorization: `Bearer ${token}` }
        });
        setApplicprocOptions(applicprocResponse.data.map(item => ({
          value: item.plcode,
          label: item.pltext || item.plcode
        })));
        const cotypeResponse = await api.get('/pltab', {
          params: { lang: effectiveLanguage, column: 'COTYPE' },
          headers: { Authorization: `Bearer ${token}` }
        });
        setCotypeOptions(cotypeResponse.data.map(item => ({
          value: item.plcode,
          label: item.pltext || item.plcode
        })));
      } catch (err) {
        console.log('PLTAB fetch error:', err.message, {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        if (err.response?.status === 404) {
          setError('Endpoint /api/pltab not found. Check server.js for correct pltabRouter mounting or verify the endpoint path in pltab.js.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Authentication failed for /api/pltab. Please log in again or check your token.');
        } else if (err.response?.status === 500) {
          setError('Database error for /api/pltab. Please check the server logs for table or schema issues (e.g., ensure table pltab exists).');
        } else {
          setError(err.response?.data?.error || translations[effectiveLanguage]?.pltabFetchError || translations.EN.pltabFetchError);
        }
        setCotypeOptions([
          { value: 'AG', label: translations[effectiveLanguage]?.cotypeOptions?.AG || 'Agent' },
          { value: 'MANF', label: translations[effectiveLanguage]?.cotypeOptions?.MANF || 'Manufacturer' }
        ]);
        setDrtypeOptions([]);
        setApplicprocOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
    return () => {
      console.log('Setting sidebar visibility to true on unmount');
      setSidebarVisible(true);
    };
  }, [setSidebarVisible, token, effectiveLanguage, location.state]);

  useEffect(() => {
    const fetchDrugsForAutocomplete = async () => {
      if (drugInput.length < 3) {
        console.log('Drug input too short (< 3 characters), clearing drug options');
        setDrugOptions([]);
        return;
      }
      try {
        console.log('Fetching drugs for autocomplete with input:', drugInput);
        console.log('Token used:', token ? 'Token present' : 'No token');
        const response = await api.get('/drugs/dr/autocomplete', {
          params: { q: drugInput.toUpperCase() },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Raw drugs response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });
        const drugs = Array.isArray(response.data.results) ? response.data.results : response.data;
        const options = drugs.map(drug => ({
          id: drug.drname,
          label: drug.drname || ''
        }));
        setDrugOptions(options);
        console.log('Drugs loaded for autocomplete:', options.length, 'options:', options);
      } catch (err) {
        console.error('Error fetching drugs for autocomplete:', err.message, {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        if (err.response?.status === 404) {
          console.error('Drugs autocomplete endpoint not found:', err.message);
          setError('Endpoint /api/drugs/dr/autocomplete not found. Please ensure drugsRouter is mounted correctly in server.js (e.g., app.use(\'/api/drugs\', drugsRouter)) and verify that the endpoint /dr/autocomplete is defined in drugs.js. Check for correct file import, server restart, and no conflicting routes.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('Authentication error for /api/drugs/dr/autocomplete:', err.message);
          setError('Authentication failed for /api/drugs/dr/autocomplete. Please log in again or check your token.');
        } else if (err.response?.status === 500) {
          console.error('Database error for /api/drugs/dr/autocomplete:', err.message);
          setError('Database error for /api/drugs/dr/autocomplete. Please check the server logs for table or schema issues (e.g., ensure table DR exists).');
        } else {
          setError(err.response?.data?.error || translations[effectiveLanguage]?.drugsFetchError || translations.EN.drugsFetchError);
        }
        setDrugOptions([]);
      }
    };
    fetchDrugsForAutocomplete();
  }, [drugInput, token, effectiveLanguage]);

  useEffect(() => {
    const fetchSubstancsOptions = async () => {
      if (substancsInput.length < 3) {
        console.log('Substancs input too short (< 3 characters), clearing substancs options');
        setSubstancsOptions([]);
        return;
      }
      try {
        console.log('Fetching substances for autocomplete with input:', substancsInput);
        console.log('Token used:', token ? 'Token present' : 'No token');
        const response = await api.get('/drugs/drsub', {
          params: { q: substancsInput.toUpperCase() },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Raw substances response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });
        const substances = Array.isArray(response.data.results) ? response.data.results : response.data;
        const options = substances.map(substance => ({
          value: substance.substancs,
          label: substance.substancs || ''
        }));
        setSubstancsOptions(options);
        console.log('Substances loaded for autocomplete:', options.length, 'options:', options);
        if (options.length === 0) {
          console.log('No substances found for input:', substancsInput);
          setError(translations[effectiveLanguage]?.noSubstancsFound || translations.EN.noSubstancsFound);
        }
      } catch (err) {
        console.error('Error fetching substances for autocomplete:', err.message, {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        if (err.response?.status === 404) {
          console.error('Substances endpoint not found:', err.message);
          setError('Endpoint /api/drugs/drsub not found. Please ensure drugsRouter is mounted correctly in server.js (e.g., app.use(\'/api/drugs\', drugsRouter)) and verify that the endpoint /drsub is defined in drugs.js. Check for correct file import, server restart, and no conflicting routes.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('Authentication error for /api/drugs/drsub:', err.message);
          setError('Authentication failed for /api/drugs/drsub. Please log in again or check your token.');
        } else if (err.response?.status === 500) {
          console.error('Database error for /api/drugs/drsub:', err.message);
          setError('Database error for /api/drugs/drsub. Please check the server logs for table or schema issues (e.g., ensure table drsub exists).');
        } else {
          setError(err.response?.data?.error || translations[effectiveLanguage]?.substancsFetchError || translations.EN.substancsFetchError);
        }
        setSubstancsOptions([]);
      }
    };
    fetchSubstancsOptions();
  }, [substancsInput, token, effectiveLanguage]);

  useEffect(() => {
    const fetchAtcOptions = async () => {
      if (atcInput.length < 3) {
        console.log('ATC input too short (< 3 characters), clearing ATC options');
        setAtcOptions([]);
        return;
      }
      try {
        console.log('Fetching ATC options with input:', atcInput);
        console.log('Token used:', token ? 'Token present' : 'No token');
        const response = await api.get('/atc', {
          params: { q: atcInput.toUpperCase() },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Raw ATC response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });
        const options = response.data.map(item => ({
          value: item.atccode,
          label: `${item.atccode} - ${item.atcdescr || item.atccode}`
        }));
        setAtcOptions(options);
        console.log('ATC options loaded:', options.length, 'options:', options);
        if (options.length === 0) {
          setError(translations[effectiveLanguage]?.noAtcResults + atcInput || translations.EN.noAtcResults + atcInput);
        }
      } catch (err) {
        console.error('ATC fetch error:', err.message, {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        if (err.response?.status === 404) {
          console.error('ATC endpoint not found:', err.message);
          setError('Endpoint /api/atc not found. Please ensure atcRouter is mounted correctly in server.js and verify that the endpoint path exists in atc.js. Check for correct file import, server restart, and no conflicting routes.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('Authentication error for /api/atc:', err.message);
          setError('Authentication failed for /api/atc. Please log in again or check your token.');
        } else if (err.response?.status === 500) {
          console.error('Database error for /api/atc:', err.message);
          setError('Database error for /api/atc. Please check the server logs for table or schema issues (e.g., ensure table atc exists).');
        } else {
          setError(err.response?.data?.error || translations[effectiveLanguage]?.atcFetchError + atcInput || translations.EN.atcFetchError + atcInput);
        }
        setAtcOptions([]);
      }
    };
    fetchAtcOptions();
  }, [atcInput, token, effectiveLanguage]);

  useEffect(() => {
    const fetchCompanyOptions = async () => {
      if (companyInput.length < 3) {
        console.log('Company input too short (< 3 characters), clearing company options');
        setCompanyOptions([]);
        return;
      }
      try {
        console.log('Fetching companies with input:', companyInput);
        console.log('Token used:', token ? 'Token present' : 'No token');
        const response = await api.get('/drugs/company', {
          params: { q: companyInput.toUpperCase(), lang: effectiveLanguage },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Raw company response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response data for /api/drugs/company:', response.data);
          setError(translations[effectiveLanguage]?.companyFetchError || translations.EN.companyFetchError);
          setCompanyOptions([]);
          return;
        }
        const options = response.data.map(item => ({
          value: item.compid,
          label: `${item.coname} (${item.compid})`
        }));
        setCompanyOptions(options);
        console.log('Companies loaded for autocomplete:', options.length, 'options:', options);
        console.log('Current formData.company:', formData.company);
        console.log('Current companyValue:', companyValue);
        const selectedOption = options.find(option => option.value === formData.company);
        if (selectedOption && !companyValue) {
          console.log('Syncing companyValue with formData.company:', selectedOption);
          setCompanyValue(selectedOption);
        }
        if (options.length === 0) {
          console.log('No companies found for input:', companyInput);
          setError(translations[effectiveLanguage]?.noCompaniesFound || translations.EN.noCompaniesFound);
        }
      } catch (err) {
        console.error('Company fetch error:', err.message, {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        if (err.response?.status === 404) {
          console.error('Companies endpoint not found:', err.message);
          setError('Endpoint /api/drugs/company not found. Please ensure drugsRouter is mounted correctly in server.js (e.g., app.use(\'/api/drugs\', drugsRouter)) and verify that the endpoint /company is defined in drugs.js. Check for correct file import, server restart, and no conflicting routes.');
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('Authentication error for /api/drugs/company:', err.message);
          setError('Authentication failed for /api/drugs/company. Please log in again or check your token.');
        } else if (err.response?.status === 500) {
          console.error('Database error for /api/drugs/company:', err.message);
          setError('Database error for /api/drugs/company. Please check the server logs for table or schema issues (e.g., ensure table company exists).');
        } else {
          setError(err.response?.data?.error || translations[effectiveLanguage]?.companyFetchError || translations.EN.companyFetchError);
        }
        setCompanyOptions([]);
      }
    };
    fetchCompanyOptions();
  }, [companyInput, token, effectiveLanguage, formData.company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'drname' || name === 'substancs' ? value.toUpperCase() : value,
      cotype: name === 'company' && !value ? 'AG' : prev.cotype
    }));
  };

  const handleAutocompleteChange = (name) => (event, newValue) => {
    console.log(`Selected ${name}:`, newValue);
    setFormData(prev => ({
      ...prev,
      [name]: newValue ? newValue.value : '',
      cotype: name === 'company' && !newValue ? 'AG' : prev.cotype
    }));
    if (name === 'company') {
      console.log('Setting companyValue to:', newValue);
      setCompanyValue(newValue);
      setCompanyInput('');
      setError('');
    }
    if (name === 'atccode') {
      setAtcInput(newValue ? newValue.value : '');
    }
    if (name === 'substancs') {
      setSubstancsInput(newValue ? newValue.value : '');
    }
  };

  const handleDrugAutocompleteChange = (event, newValue) => {
    console.log('Selected drug from autocomplete:', newValue);
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        drname: newValue.label
      }));
      setDrugInput(newValue.label);
    } else {
      setFormData(prev => ({
        ...prev,
        drname: ''
      }));
      setDrugInput('');
    }
  };

  const handleAtcInputChange = (event, newInputValue) => {
    setAtcInput(newInputValue.toUpperCase());
  };

  const handleSubstancsInputChange = (event, newInputValue) => {
    console.log('Substancs input changed to:', newInputValue);
    setSubstancsInput(newInputValue.toUpperCase());
    setFormData(prev => ({
      ...prev,
      substancs: newInputValue.toUpperCase()
    }));
  };

  const handleDrugInputChange = (event, newInputValue) => {
    console.log('Drug input changed to:', newInputValue);
    setDrugInput(newInputValue.toUpperCase());
    setFormData(prev => ({
      ...prev,
      drname: newInputValue.toUpperCase()
    }));
  };

  const handleClear = () => {
    console.log('Clearing search form');
    setFormData({
      drname: '',
      drstatus: '',
      FORM: '',
      drtype: '',
      applicproc: '',
      atccode: '',
      substancs: '',
      company: '',
      cotype: 'AG'
    });
    setAtcInput('');
    setSubstancsInput('');
    setCompanyInput('');
    setDrugInput('');
    setCompanyValue(null);
    setResults([]);
    setTotal(0);
    setPage(1);
    setError('');
    localStorage.removeItem('searchState');
    handleMenuClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSearchDisabled) {
      console.log('Search disabled: no criteria provided');
      setError(translations[effectiveLanguage]?.searchCriteriaError || translations.EN.searchCriteriaError);
      return;
    }
    try {
      setLoading(true);
      setError('');
      console.log('Submitting search with params:', formData);
      const params = {
        drname: formData.drname || undefined,
        drnameMatch: formData.drname && formData.drname.includes('%') ? 'startsWith' : undefined,
        drstatus: formData.drstatus || undefined,
        FORM: formData.FORM || undefined,
        drtype: formData.drtype || undefined,
        applicproc: formData.applicproc || undefined,
        atc: formData.atccode || undefined,
        substancs: formData.substancs || undefined,
        company: formData.company || undefined,
        cotype: formData.cotype || 'AG',
        lang: effectiveLanguage,
        limit: rowsPerPage,
        offset: (page - 1) * rowsPerPage
      };
      const response = await api.get('/drugs/drugs', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Drugs search response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      setResults(response.data.results);
      setTotal(response.data.total);
      console.log('First drug record:', response.data.results[0] || 'No records');
      localStorage.setItem('searchState', JSON.stringify({
        formData,
        results: response.data.results,
        total: response.data.total,
        page,
        rowsPerPage,
        sortConfig
      }));
      if (response.data.results.length === 0) {
        setError(translations[effectiveLanguage]?.noDrugsFound || translations.EN.noDrugsFound);
      }
    } catch (err) {
      console.error('Search error:', err.message, {
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers
      });
      if (err.response?.status === 404) {
        console.error('Drugs endpoint not found:', err.message);
        setError('Endpoint /api/drugs/drugs not found. Please ensure drugsRouter is mounted correctly in server.js (e.g., app.use(\'/api/drugs\', drugsRouter)) and verify that the endpoint /drugs is defined in drugs.js. Check for correct file import, server restart, and no conflicting routes.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('Authentication error for /api/drugs/drugs:', err.message);
        setError('Authentication failed for /api/drugs/drugs. Please log in again or check your token.');
      } else if (err.response?.status === 500) {
        console.error('Database error for /api/drugs/drugs:', err.message);
        setError('Database error for /api/drugs/drugs. Please check the server logs for table or schema issues (e.g., ensure tables DR, drform, and drcompany are correctly referenced with column formcode).');
      } else {
        setError(err.response?.data?.error === 'No drugs found'
          ? translations[effectiveLanguage]?.noDrugsFound || translations.EN.noDrugsFound
          : err.response?.data?.error || translations[effectiveLanguage]?.searchError || translations.EN.searchError);
      }
      setResults([]);
      setTotal(0);
      localStorage.removeItem('searchState');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (results.length === 0) {
      console.log('No results to export');
      setError(translations[effectiveLanguage]?.noResults || translations.EN.noResults);
      return;
    }
    console.log('Exporting results to Excel');
    const worksheetData = results.map(row => ({
      [translations[effectiveLanguage]?.drugIdColumn || translations.EN.drugIdColumn]: row.drugid || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.drugNameColumn || translations.EN.drugNameColumn]: row.drname || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.statusColumn || translations.EN.statusColumn]: row.drstatus || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.formColumn || translations.EN.formColumn]: row.form || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.drtypeColumn || translations.EN.drugIdColumn]: row.drtype || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.atcColumn || translations.EN.atcColumn]: row.atccode ? `${row.atccode} - ${row.atcdescr || row.atccode}` : translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.activeSubstancesLabel || translations.EN.activeSubstancesLabel]: row.substancs || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable,
      [translations[effectiveLanguage]?.companyColumn || translations.EN.companyColumn]: row.company || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Search Results');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'search_results.xlsx');
  };

  const handleSort = (key) => {
    console.log('Sorting by:', key);
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    localStorage.setItem('searchState', JSON.stringify({
      formData,
      results,
      total,
      page,
      rowsPerPage,
      sortConfig: { key, direction }
    }));
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
    console.log('Menu clicked');
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    console.log('Menu closed');
    setAnchorEl(null);
  };

  const handleRowMenuClick = (event, drugid) => {
    console.log('Row menu clicked for drugid:', drugid);
    setRowAnchorEl(event.currentTarget);
    setSelectedDrugId(drugid);
  };

  const handleRowMenuClose = () => {
    console.log('Row menu closed');
    setRowAnchorEl(null);
    setSelectedDrugId(null);
  };

  const handlePackages = () => {
    if (selectedDrugId) {
      console.log('Navigating to packages for drugid:', selectedDrugId);
      const selectedRow = results.find(r => r.drugid === selectedDrugId);
      navigate(`/drug/packages/${selectedDrugId}`, { state: { drname: selectedRow?.drname || '' } });
    }
    handleRowMenuClose();
  };

  const handleDocumentation = () => {
    console.log('Φαρμακευτικά - Τεκμηρίωση for drugid:', selectedDrugId);
    handleRowMenuClose();
  };

  const handleSearch = () => {
    if (isSearchDisabled) {
      console.log('Search disabled: no criteria provided');
      setError(translations[effectiveLanguage]?.searchCriteriaError || translations.EN.searchCriteriaError);
      return;
    }
    if (formRef.current) {
      console.log('Submitting form via search button');
      formRef.current.requestSubmit();
    }
    handleMenuClose();
  };

  const handleBack = () => {
    console.log('Navigating back to /dashboard');
    setSidebarVisible(true);
    navigate('/dashboard', { replace: true });
    handleMenuClose();
  };

  

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('Changing rows per page to:', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(1);
    localStorage.setItem('searchState', JSON.stringify({
      formData,
      results,
      total,
      page: 1,
      rowsPerPage: newRowsPerPage,
      sortConfig
    }));
    handleSearch();
  };

  const handlePageChange = (event, newPage) => {
    console.log('Changing page to:', newPage);
    setPage(newPage);
    localStorage.setItem('searchState', JSON.stringify({
      formData,
      results,
      total,
      page: newPage,
      rowsPerPage,
      sortConfig
    }));
    handleSearch();
  };

  return (
    <>
      {loading ? (
        <Typography>{translations[effectiveLanguage]?.loading || translations.EN.loading}</Typography>
      ) : (
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
            <MenuItem onClick={handleSearch} disabled={isSearchDisabled}>
              {translations[effectiveLanguage]?.searchButton || translations.EN.searchButton}
            </MenuItem>
            <MenuItem onClick={handleClear}>
              {translations[effectiveLanguage]?.clearButton || translations.EN.clearButton}
            </MenuItem>
            <MenuItem onClick={handleBack}>
              {translations[effectiveLanguage]?.backButton || translations.EN.backButton}
            </MenuItem>
          </Menu>
          <Menu
            anchorEl={rowAnchorEl}
            open={Boolean(rowAnchorEl) && selectedDrugId !== null}
            onClose={handleRowMenuClose}
          >
            <MenuItem onClick={handlePackages}>
              {translations[effectiveLanguage]?.packagesPricesLabel || 'Συσκευασίες-τιμές'}
            </MenuItem>
            <MenuItem onClick={handleDocumentation}>
              {translations[effectiveLanguage]?.documentationLabel || 'Φαρμακευτικά - Τεκμηρίωση'}
            </MenuItem>
          </Menu>
          <Typography variant="h4" gutterBottom>
            {translations[effectiveLanguage]?.searchTitle || translations.EN.searchTitle}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <form ref={formRef} onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Tooltip title={translations[effectiveLanguage]?.drugNameTooltip || translations.EN.drugNameTooltip}>
                <Autocomplete
                  options={drugOptions}
                  getOptionLabel={(option) => option.label || ''}
                  value={drugOptions.find(option => option.label === formData.drname) || null}
                  onChange={handleDrugAutocompleteChange}
                  onInputChange={handleDrugInputChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={translations[effectiveLanguage]?.drugNameLabel || translations.EN.drugNameLabel}
                      sx={{ m: 1, minWidth: '300px' }}
                      inputProps={{ ...params.inputProps, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                  sx={{ m: 1, minWidth: '300px' }}
                  noOptionsText={translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}
                />
              </Tooltip>
              <Tooltip title={translations[effectiveLanguage]?.statusTooltip || translations.EN.statusTooltip}>
                <TextField
                  label={translations[effectiveLanguage]?.statusLabel || translations.EN.statusLabel}
                  name="drstatus"
                  select
                  value={formData.drstatus}
                  onChange={handleChange}
                  sx={{ m: 1, minWidth: '200px' }}
                >
                  <MenuItem value="">
                    <em>{translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}</em>
                  </MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Tooltip>
              <Tooltip title={translations[effectiveLanguage]?.formTooltip || translations.EN.formTooltip}>
                <TextField
                  label={translations[effectiveLanguage]?.formLabel || translations.EN.formLabel}
                  name="FORM"
                  select
                  value={formData.FORM}
                  onChange={handleChange}
                  sx={{ m: 1, minWidth: '200px' }}
                >
                  <MenuItem value="">
                    <em>{translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}</em>
                  </MenuItem>
                  {formOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Tooltip>
              <Tooltip title={translations[effectiveLanguage]?.drtypeTooltip || translations.EN.drtypeTooltip}>
                <TextField
                  label={translations[effectiveLanguage]?.drtypeLabel || translations.EN.drtypeLabel}
                  name="drtype"
                  select
                  value={formData.drtype}
                  onChange={handleChange}
                  sx={{ m: 1, minWidth: '200px' }}
                >
                  <MenuItem value="">
                    <em>{translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}</em>
                  </MenuItem>
                  {drtypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Tooltip>
              <Tooltip title={translations[effectiveLanguage]?.applicprocTooltip || translations.EN.applicprocTooltip || 'Application Procedure'}>
                <TextField
                  label={translations[effectiveLanguage]?.applicprocLabel || translations.EN.applicprocLabel || 'Application Procedure'}
                  name="applicproc"
                  select
                  value={formData.applicproc}
                  onChange={handleChange}
                  sx={{ m: 1, minWidth: '200px' }}
                >
                  <MenuItem value="">
                    <em>{translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}</em>
                  </MenuItem>
                  {applicprocOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Tooltip>
              <Tooltip title={translations[effectiveLanguage]?.atcTooltip || translations.EN.atcTooltip}>
                <Autocomplete
                  options={atcOptions}
                  getOptionLabel={(option) => option.label || ''}
                  onChange={handleAutocompleteChange('atccode')}
                  onInputChange={handleAtcInputChange}
                  freeSolo={false}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={translations[effectiveLanguage]?.atcLabel || translations.EN.atcLabel}
                      sx={{ m: 1, minWidth: '300px' }}
                      inputProps={{ ...params.inputProps, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                  sx={{ m: 1, minWidth: '300px' }}
                  value={atcOptions.find(option => option.value === formData.atccode) || null}
                  noOptionsText={translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}
                />
              </Tooltip>
              <Tooltip title={translations[effectiveLanguage]?.substancsTooltip || translations.EN.substancsTooltip}>
                <Autocomplete
                  options={substancsOptions}
                  getOptionLabel={(option) => option.label || ''}
                  onChange={handleAutocompleteChange('substancs')}
                  onInputChange={handleSubstancsInputChange}
                  freeSolo={true}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={translations[effectiveLanguage]?.substancsLabel || translations.EN.substancsLabel}
                      sx={{ m: 1, minWidth: '300px' }}
                      inputProps={{ ...params.inputProps, style: { textTransform: 'uppercase' } }}
                    />
                  )}
                  sx={{ m: 1, minWidth: '300px' }}
                  value={substancsOptions.find(option => option.value === formData.substancs) || null}
                  noOptionsText={translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}
                />
              </Tooltip>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title={translations[effectiveLanguage]?.companyTooltip || translations.EN.companyTooltip}>
                  <Autocomplete
                    options={companyOptions}
                    getOptionLabel={(option) => option.label || ''}
                    value={companyValue}
                    onChange={handleAutocompleteChange('company')}
                    onInputChange={(event, newInputValue) => setCompanyInput(newInputValue)}
                    freeSolo={true}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={translations[effectiveLanguage]?.companyLabel || translations.EN.companyLabel}
                        sx={{ m: 1, minWidth: '400px' }}
                      />
                    )}
                    sx={{ m: 1, minWidth: '400px' }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.value}>{option.label}</li>
                    )}
                    noOptionsText={translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}
                  />
                </Tooltip>
                <Tooltip title={translations[effectiveLanguage]?.cotypeTooltip || translations.EN.cotypeTooltip}>
                  <TextField
                    label={translations[effectiveLanguage]?.cotypeLabel || translations.EN.cotypeLabel}
                    name="cotype"
                    select
                    value={formData.cotype}
                    onChange={handleChange}
                    disabled={!formData.company}
                    sx={{ m: 1, minWidth: '200px' }}
                  >
                    <MenuItem value="">
                      <em>{translations[effectiveLanguage]?.noneSelected || translations.EN.noneSelected}</em>
                    </MenuItem>
                    {cotypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Tooltip>
              </Box>
            </Box>
          </form>
          {results.length > 0 ? (
            <Box sx={{ mt: 4, overflowX: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {translations[effectiveLanguage]?.resultsFound.replace('{total}', total) || translations.EN.resultsFound.replace('{total}', total)}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="body2" component="span">
                    {translations[effectiveLanguage]?.rowsPerPage || translations.EN.rowsPerPage}
                  </Typography>
                  <Select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    sx={{ ml: 1, minWidth: '80px' }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </Select>
                </Box>
                <Box>
                  {results.length > 0 && (
                    <Tooltip title={translations[effectiveLanguage]?.exportToExcelTooltip || translations.EN.exportToExcelTooltip}>
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
                    <TableCell sx={{ maxWidth: '70px', minWidth: '70px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'drugid'}
                        direction={sortConfig.key === 'drugid' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('drugid')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.drugIdColumn || translations.EN.drugIdColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '120px', minWidth: '120px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'drname'}
                        direction={sortConfig.key === 'drname' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('drname')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.drugNameColumn || translations.EN.drugNameColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '80px', minWidth: '80px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'drstatus'}
                        direction={sortConfig.key === 'drstatus' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('drstatus')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.statusColumn || translations.EN.statusColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '60px', minWidth: '60px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'form'}
                        direction={sortConfig.key === 'form' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('form')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.formColumn || translations.EN.formColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'drtype'}
                        direction={sortConfig.key === 'drtype' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('drtype')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.drtypeColumn || translations.EN.drugIdColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'atccode'}
                        direction={sortConfig.key === 'atccode' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('atccode')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.atcColumn || translations.EN.atcColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'substancs'}
                        direction={sortConfig.key === 'substancs' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('substancs')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.activeSubstancesLabel || translations.EN.activeSubstancesLabel}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'company'}
                        direction={sortConfig.key === 'company' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('company')}
                        sx={{ color: 'common.white', '&:hover': { color: 'common.white' } }}
                      >
                        {translations[effectiveLanguage]?.companyColumn || translations.EN.companyColumn}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: '60px !important', minWidth: '60px', color: 'common.white', padding: 0, boxSizing: 'border-box' }}>
                      {translations[effectiveLanguage]?.actionsLabel || translations.EN.actionsLabel}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedResults.map((row, index) => (
                    <TableRow
                      key={`${row.drugid}-${index}`}
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' },
                        '&:nth-of-type(odd)': { backgroundColor: 'action.disabledBackground' },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleRowClick(row.drugid, row.drname)}
                    >
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '70px', minWidth: '60px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.drugid || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '120px', minWidth: '120px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.drname || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '80px', minWidth: '80px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.drstatus || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '60px', minWidth: '60px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.form || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.drtype || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.atccode ? `${row.atccode} - ${row.atcdescr || row.atccode}` : translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.substancs || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider', maxWidth: '100px', minWidth: '100px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'visible' }}>
                        {row.company || translations[effectiveLanguage]?.notAvailable || translations.EN.notAvailable}
                      </TableCell>
                      <TableCell sx={{ width: '60px !important', minWidth: '60px', padding: 0, boxSizing: 'border-box' }}>
                        <Tooltip title={translations[effectiveLanguage]?.actionsTooltip || translations.EN.actionsTooltip || 'More Actions'}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowMenuClick(e, row.drugid);
                            }}
                            aria-label="more actions"
                            color="primary"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
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
      )}
    </>
  );
});

export default Search;
