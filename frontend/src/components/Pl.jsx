import { useState, useEffect, useContext, memo } from 'react';
import { Button, Box, Typography, Alert, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Menu, MenuItem } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api';
import translations from '../context/translations';
import GetAppIcon from '@mui/icons-material/GetApp';

const Pl = memo(({ token }) => {
  const { language } = useContext(LanguageContext);
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const { drugid } = useParams();
  const location = useLocation();
  const [plData, setPlData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const drugName = location.state?.drname || '';

  useEffect(() => {
    setSidebarVisible(false);
    const fetchPlData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pl/${drugid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPlData(response.data);
        if (response.data.length === 0) {
          setError(translations[language]?.noPlDataFound || translations.EN.noPlDataFound);
        }
      } catch (err) {
        setError(err.response?.data?.error || translations[language]?.plFetchError || translations.EN.plFetchError);
        setPlData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlData();
    return () => setSidebarVisible(true);
  }, [setSidebarVisible, token, drugid, language]);

  const handleDownloadDoc = (doc, doctype, version) => {
    try {
      if (!doc || doc === '') {
        setError(translations[language]?.noDocAvailable || translations.EN.noDocAvailable);
        return;
      }
      const byteCharacters = atob(doc);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const mimeType = doctype.toLowerCase() === 'pdf' ? 'application/pdf' : `application/${doctype.toLowerCase()}`;
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pl_document_${version}.${doctype.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(translations[language]?.downloadDocError || translations.EN.downloadDocError);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBack = () => {
    setSidebarVisible(true);
    navigate(`/drug/packages/${drugid}`, { state: { drname: drugName } });
    handleMenuClose();
  };

  if (loading) {
    return <Typography>{translations[language]?.loading || translations.EN.loading}</Typography>;
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
        <MenuItem onClick={handleBack}>
          {translations[language]?.backButton || translations.EN.backButton}
        </MenuItem>
      </Menu>
      <Typography variant="h5" gutterBottom>
        {drugName ? `${drugid} ${drugName}` : drugid}
      </Typography>
      <Typography variant="h4" gutterBottom>
        {translations[language]?.plTitle || translations.EN.plTitle}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {plData.length > 0 ? (
        <Table sx={{ mt: 2, border: 1, borderColor: 'divider', boxShadow: 3 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main', color: 'common.white' }}>
              <TableCell sx={{ color: 'common.white' }}>
                {translations[language]?.versionLabel || translations.EN.versionLabel}
              </TableCell>
              <TableCell sx={{ color: 'common.white' }}>
                {translations[language]?.plDateLabel || translations.EN.plDateLabel}
              </TableCell>
              <TableCell sx={{ color: 'common.white' }}>
                {translations[language]?.docTypeLabel || translations.EN.docTypeLabel}
              </TableCell>
              <TableCell sx={{ color: 'common.white' }}>
                {translations[language]?.usernameLabel || translations.EN.usernameLabel}
              </TableCell>
              <TableCell sx={{ color: 'common.white' }}>
                {translations[language]?.downloadDocLabel || translations.EN.downloadDocLabel}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plData.map((row, index) => (
              <TableRow
                key={`${row.version}-${index}`}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:nth-of-type(odd)': { backgroundColor: 'action.disabledBackground' }
                }}
              >
                <TableCell>{row.version || translations[language]?.notAvailable || translations.EN.notAvailable}</TableCell>
                <TableCell>{row.pldate || translations[language]?.notAvailable || translations.EN.notAvailable}</TableCell>
                <TableCell>{row.doctype || translations[language]?.notAvailable || translations.EN.notAvailable}</TableCell>
                <TableCell>{row.username || translations[language]?.notAvailable || translations.EN.notAvailable}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDownloadDoc(row.doc, row.doctype, row.version)}
                    disabled={!row.doc || row.doc === ''}
                  >
                    <GetAppIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        !error && <Typography>{translations[language]?.noPlDataFound || translations.EN.noPlDataFound}</Typography>
      )}
    </Box>
  );
});

export default Pl;


