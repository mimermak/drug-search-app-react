import { useContext, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { LanguageContext } from '../context/LanguageContext';
import { SidebarVisibilityContext } from '../context/SidebarVisibilityContext';
import translations from '../context/translations';
import { jwtDecode } from 'jwt-decode';

function Dashboard({ token, handleLogout }) {
  const { language } = useContext(LanguageContext);
  const { setSidebarVisible } = useContext(SidebarVisibilityContext);
  const username = token ? jwtDecode(token).username : '';

  useEffect(() => {
    localStorage.clear(); // Clear all localStorage on dashboard load
    setSidebarVisible(true);
  }, [setSidebarVisible]);

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {translations[language]?.dashboardTitle || translations.EN.dashboardTitle}
      </Typography>
      <Typography variant="h6" gutterBottom>
        {translations[language]?.welcomeMessage.replace('{username}', username) || translations.EN.welcomeMessage.replace('{username}', username)}
      </Typography>
    </Box>
  );
}

export default Dashboard;