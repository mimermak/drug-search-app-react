import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Component για εισαγωγή νέου record στον πίνακα COMPANY
function CompanyInsert({ token }) {
  const [formData, setFormData] = useState({
    compid: '',
    coname: '',
    cosname: '',
    street_number: '',
    town: '',
    zip: '',
    cobox: '',
    country: '',
    area: '',
    phone: '',
    cofax: '',
    coemail: '',
    belongs: '',
    regnumber: '',
    emeanumber: '',
    ecc: '',
    orgtype: '',
    sector: '',
    SOURCE: '',
    selectable: '1',
    eudragmp: '',
    duns: '',
    latitude: '',
    longitude: '',
    nca: '',
    doy: '',
    coname_en: '',
    org_id: '',
    loc_id: '',
    status: 'CURRENT'
  });

  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Εισαγωγή δεδομένων σε /company με δεδομένα:', formData);
      await api.post('/company', formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Σφάλμα κατά την εισαγωγή δεδομένων COMPANY:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || 'Η εισαγωγή απέτυχε');
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Εισαγωγή COMPANY</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
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
          label="Όνομα Εταιρείας"
          name="coname"
          value={formData.coname}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Σύντομο Όνομα"
          name="cosname"
          value={formData.cosname}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Διεύθυνση (Οδός - Αριθμός)"
          name="street_number"
          value={formData.street_number}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Πόλη"
          name="town"
          value={formData.town}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Τ.Κ."
          name="zip"
          value={formData.zip}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Τ.Θ."
          name="cobox"
          value={formData.cobox}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Χώρα"
          name="country"
          value={formData.country}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Περιοχή"
          name="area"
          value={formData.area}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Τηλέφωνο"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Fax"
          name="cofax"
          value={formData.cofax}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          name="coemail"
          value={formData.coemail}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Belongs"
          name="belongs"
          value={formData.belongs}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Αριθμός Μητρώου"
          name="regnumber"
          value={formData.regnumber}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="EMEANumber"
          name="emeanumber"
          value={formData.emeanumber}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="ECC"
          name="ecc"
          value={formData.ecc}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <TextField
          label="Org Type"
          name="orgtype"
          value={formData.orgtype}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Sector"
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Source"
          name="SOURCE"
          value={formData.SOURCE}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Selectable"
          name="selectable"
          value={formData.selectable}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <TextField
          label="EudraGMP"
          name="eudragmp"
          value={formData.eudragmp}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="DUNS"
          name="duns"
          value={formData.duns}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Latitude"
          name="latitude"
          value={formData.latitude}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <TextField
          label="Longitude"
          name="longitude"
          value={formData.longitude}
          onChange={handleChange}
          fullWidth
          margin="normal"
          type="number"
        />
        <TextField
          label="NCA"
          name="nca"
          value={formData.nca}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="DOY"
          name="doy"
          value={formData.doy}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Όνομα Εταιρείας (Αγγλικά)"
          name="coname_en"
          value={formData.coname_en}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Org ID"
          name="org_id"
          value={formData.org_id}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Loc ID"
          name="loc_id"
          value={formData.loc_id}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Εισαγωγή
        </Button>
      </form>
    </Box>
  );
}

export default CompanyInsert;