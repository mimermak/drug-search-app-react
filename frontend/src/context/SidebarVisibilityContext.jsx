import { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SidebarVisibilityContext = createContext();

export const SidebarVisibilityProvider = ({ children }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    console.log('SidebarVisibilityContext: pathname=', location.pathname, 'isSidebarVisible=', isSidebarVisible);
    if (location.pathname === '/search') {
      setSidebarVisible(false);
      console.log('Sidebar disabled for /search');
    } else {
      setSidebarVisible(true);
      console.log('Sidebar enabled for', location.pathname);
    }
  }, [location.pathname]);

  return (
    <SidebarVisibilityContext.Provider value={{ isSidebarVisible, setSidebarVisible }}>
      {children}
    </SidebarVisibilityContext.Provider>
  );
};