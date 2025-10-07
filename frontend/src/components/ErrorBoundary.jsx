import { Component } from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import translations from '../context/translations';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    const { language, navigate } = this.props;
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h4" color="error" gutterBottom>
            {translations[language]?.genericError || translations.EN.genericError}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {translations[language]?.errorMessage || translations.EN.errorMessage}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {translations[language]?.errorDetails || translations.EN.errorDetails}: {this.state.error?.message || 'Unknown error'}
          </Typography>
          {this.state.errorInfo && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {translations[language]?.errorStack || translations.EN.errorStack}: {this.state.errorInfo.componentStack}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              console.log('Back button clicked, navigating to /dashboard');
              navigate('/dashboard');
            }}
            sx={{ mt: 2 }}
          >
            {translations[language]?.backButton || translations.EN.backButton}
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function ErrorBoundaryWrapper(props) {
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  return <ErrorBoundary {...props} navigate={navigate} language={language} />;
}

export default ErrorBoundaryWrapper;