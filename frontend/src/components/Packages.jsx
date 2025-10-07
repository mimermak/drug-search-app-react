import { useState, useEffect, useContext, memo } from 'react';
import { TextField, Button, Box, Grid, Typography, Alert, MenuItem, Menu, Select, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, FormControlLabel } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api';
import translations from '../context/translations';

const Packages = memo(({ token }) => {
  const { language } = useContext(LanguageContext);
  const effectiveLanguage = language || 'EL';
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const { drugid } = useParams();
  const location = useLocation();
  const [selectedPackage, setSelectedPackage] = useState('');
  const [packageOptions, setPackageOptions] = useState([]);
  const [packageDetails, setPackageDetails] = useState(null);
  const [priceList, setPriceList] = useState([]);
  const [isMisyfa, setIsMisyfa] = useState('');
  const [isReimbursed, setIsReimbursed] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const drugName = location.state?.drname || '';
  const [showPricelistOnly, setShowPricelistOnly] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        console.log('Fetching packages for drugid:', drugid, 'showPricelistOnly:', showPricelistOnly);
        const endpoint = showPricelistOnly ? '/pcpricelist/priced' : '/pcpricelist/all';
        const response = await api.get(endpoint, {
          params: { drugid, limit: 100, offset: 0 },
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Packages API response:', response.data);

        const options = response.data.results.map(item => ({
          value: item.drdpid,
          label: `${item.packnr || ''} ${item.patext || ''}`.trim() || item.drdpid,
          drdpid: item.drdpid
        })).sort((a, b) => a.label.localeCompare(b.label));

        console.log('Dropdown options:', options);
        setPackageOptions(options);

        if (options.length === 0) {
          setError(translations[effectiveLanguage]?.noPackageDetails || 'No package details found');
        }

        // Clear all state to ensure fresh data
        setSelectedPackage('');
        setPackageDetails(null);
        setPriceList([]);
        setIsMisyfa('');
        setIsReimbursed('');
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError(translations[effectiveLanguage]?.drdpFetchError || 'Error fetching package data');
        setPackageOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();

    return () => {
      console.log('Packages unmounted for drugid:', drugid);
      setSidebarVisible(true);
    };
  }, [setSidebarVisible, token, drugid, effectiveLanguage, showPricelistOnly]);

  useEffect(() => {
    console.log('Price list updated for drugid:', drugid, 'with', priceList.length, 'rows');
    if (priceList.length > 0) {
      const firstRow = priceList[0];
      console.log('Using FIRST row for MISYFA/Negative:', firstRow);

      const misyfa = firstRow.MISYFA ?? firstRow.misyfa ?? null;
      const negative = firstRow.Negative ?? firstRow.negative ?? null;

      console.log('Raw MISYFA/Negative:', { misyfa, negative });

      let misyfaDisplay = '';
      let reimbursedDisplay = '';

      if (misyfa === true || misyfa === 'true' || misyfa === 1) {
        misyfaDisplay = translations[effectiveLanguage]?.yes || 'ΝΑΙ';
        reimbursedDisplay = translations[effectiveLanguage]?.no || 'ΟΧΙ';
      } else if (negative === true || negative === 'true' || negative === 1) {
        misyfaDisplay = '';
        reimbursedDisplay = translations[effectiveLanguage]?.no || 'ΟΧΙ';
      } else {
        misyfaDisplay = '';
        reimbursedDisplay = translations[effectiveLanguage]?.yes || 'ΝΑΙ';
      }

      console.log('Final MISYFA/Reimbursed:', { misyfaDisplay, reimbursedDisplay });
      setIsMisyfa(misyfaDisplay);
      setIsReimbursed(reimbursedDisplay);
    } else {
      console.log('No price list data, setting empty values');
      setIsMisyfa('');
      setIsReimbursed('');
    }
  }, [priceList, drugid, effectiveLanguage]);

  const fetchPriceList = async (drdpid) => {
    try {
      console.log('Fetching price list for drdpid:', drdpid);
      const response = await api.get(`/pcpricelist/${drdpid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Price list API response:', response.data);

      const mappedPriceList = response.data.map(row => ({
        ...row,
        producerprice: row.producerprice ?? row.xfactory,
        wholesaleprice: row.wholesaleprice ?? row.finalwhprice,
        retailprice: row.retailprice ?? row.finaldtprice,
        hospitalprice: row.hospitalprice ?? row.finalhosprice,
        misyfa: row.MISYFA ?? row.misyfa,
        negative: row.Negative ?? row.negative
      }));

      setPriceList(mappedPriceList);

      if (mappedPriceList.length === 0) {
        setError(translations[effectiveLanguage]?.noPriceListFound || 'No price list found');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error fetching price list:', err);
      setError(translations[effectiveLanguage]?.noPriceListFound || 'Error fetching price list');
      setPriceList([]);
    }
  };

  const handlePackageChange = async (e) => {
    const value = e.target.value;
    console.log('Selected package drdpid:', value, 'for drugid:', drugid);
    setSelectedPackage(value);

    // Clear all previous data to ensure fresh data
    setPackageDetails(null);
    setPriceList([]);
    setIsMisyfa('');
    setIsReimbursed('');
    setError('');

    if (!value) {
      console.log('No package selected - clearing all');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching package details for drdpid:', value);

      const selectedOption = packageOptions.find(opt => opt.value === value);
      if (!selectedOption) {
        throw new Error('Invalid package selection');
      }

      // Fetch package details with new drdpid
      const packageResponse = await api.get(`/drdp/${drugid}`, {
        params: { drdpid: value, lang: effectiveLanguage },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Package details API response for drdpid:', value, 'data:', packageResponse.data);

      if (packageResponse.data && packageResponse.data.length > 0) {
        const newDetails = packageResponse.data.find(item => item.drdpid === value) || packageResponse.data[0];
        console.log('Setting packageDetails:', newDetails);
        setPackageDetails(newDetails);
        await fetchPriceList(value);
      } else {
        console.log('No package details found for drdpid:', value);
        setError(translations[effectiveLanguage]?.noPackageDetails || 'No package details found');
      }
    } catch (err) {
      console.error('Error fetching package details for drdpid:', value, 'error:', err);
      setError(translations[effectiveLanguage]?.drdpFetchError || 'Error fetching package data');
      setPackageDetails(null);
      setPriceList([]);
      setIsMisyfa('');
      setIsReimbursed('');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleBack = () => {
    setSidebarVisible(true);
    navigate('/search', { replace: true });
    handleMenuClose();
  };
  const handlePl = () => {
    navigate(`/drug/pl/${drugid}`, { state: { drname: drugName } });
    handleMenuClose();
  };
  const handleSpc = () => {
    navigate(`/drug/spc/${drugid}`, { state: { drname: drugName } });
    handleMenuClose();
  };

  if (loading) {
    return <Typography>{translations[effectiveLanguage]?.loading || 'Φόρτωση...'}</Typography>;
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto', position: 'relative' }}>
      <Button
        variant="outlined"
        color="success"
        size="large"
        onClick={handleMenuClick}
        sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 'bold', fontSize: '1.5rem', minWidth: '48px', height: '48px', padding: 0 }}
      >
        ⋮
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handlePl}>{translations[effectiveLanguage]?.plTitle || 'PL'}</MenuItem>
        <MenuItem onClick={handleSpc}>{translations[effectiveLanguage]?.spcTitle || 'SPC'}</MenuItem>
        <MenuItem onClick={handleBack}>{translations[effectiveLanguage]?.backButton || 'Επιστροφή'}</MenuItem>
      </Menu>
      <Typography variant="h5" gutterBottom>
        {drugName ? `${drugid} ${drugName}` : drugid}
      </Typography>
      <Typography variant="h4" gutterBottom>
        {translations[effectiveLanguage]?.packagesTitle || 'Συσκευασίες'}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label={translations[effectiveLanguage]?.selectPackageLabel || 'Επιλογή Συσκευασίας'}
            select
            value={selectedPackage}
            onChange={handlePackageChange}
            sx={{ minWidth: 300 }}
          >
            <MenuItem value=""><em>{translations[effectiveLanguage]?.noneSelected || 'Κανένα'}</em></MenuItem>
            {packageOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Checkbox checked={showPricelistOnly} onChange={(e) => setShowPricelistOnly(e.target.checked)} color="primary" />}
            label={translations[effectiveLanguage]?.pricelistOnlyLabel || 'Εμφάνιση μόνο τιμοκαταλόγου'}
            sx={{ m: 0 }}
          />
        </Box>
      </Box>
      {packageDetails && (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageCodeLabel || 'Κωδικός Συσκευασίας'}: {packageDetails.packnr || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageDescriptionLabel || 'Περιγραφή'}: {packageDetails.patext || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageSizeLabel || 'Μέγεθος'}: {packageDetails.size || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageStatusLabel || 'Κατάσταση'}: {packageDetails.status_text || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageTypeLabel || 'Τύπος'}: {packageDetails.type_text || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageDispenseModeLabel || 'Τρόπος Διάθεσης'}: {packageDetails.lestatus_text || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageNarcoticCategoryLabel || 'Κατηγορία Ναρκωτικών'}: {packageDetails.narcateg || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageBarcodeLabel || 'Barcode'}: {packageDetails.barcode || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.packageEunumberLabel || 'Αριθμός EU'}: {packageDetails.eunumber || 'N/A'}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.reimbursedLabel || 'Αποζημιούμενο'}: {isReimbursed || ''}</Typography>
              <Typography variant="subtitle1">{translations[effectiveLanguage]?.misyfaLabel || 'ΜΗ.ΣΥ.ΦΑ.'}: {isMisyfa || ''}</Typography>
            </Grid>
          </Grid>
          {priceList.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>{translations[effectiveLanguage]?.priceListTitle || 'Τιμοκατάλογος'}</Typography>
              <Table sx={{ mt: 2, border: 1, borderColor: 'divider', boxShadow: 3 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main', color: 'common.white' }}>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.dateFromLabel || 'Από Ημερομηνία'}</TableCell>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.dateUntilLabel || 'Έως Ημερομηνία'}</TableCell>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.producerPriceLabel || 'Τιμή Παραγωγού'}</TableCell>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.wholesalePriceLabel || 'Τιμή Χονδρικής'}</TableCell>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.retailPriceLabel || 'Τιμή Λιανικής'}</TableCell>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.hospitalPriceLabel || 'Τιμή Νοσοκομείου'}</TableCell>
                    <TableCell sx={{ color: 'common.white' }}>{translations[effectiveLanguage]?.vatLabel || 'ΦΠΑ'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceList.map((row, index) => (
                    <TableRow key={`${row.drdpid}-${index}`}>
                      <TableCell>{row.datefrom || 'N/A'}</TableCell>
                      <TableCell>{row.dateuntil || 'N/A'}</TableCell>
                      <TableCell>{row.producerprice ? `€${Number(row.producerprice).toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{row.wholesaleprice ? `€${Number(row.wholesaleprice).toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{row.retailprice ? `€${Number(row.retailprice).toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{row.hospitalprice ? `€${Number(row.hospitalprice).toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{row.vat ? `${Number(row.vat).toFixed(0)}%` : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            error && <Alert severity="error">{error}</Alert>
          )}
        </>
      )}
    </Box>
  );
});

export default Packages;