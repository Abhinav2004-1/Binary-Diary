import React, { Suspense, useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import LoadingPage from './Components/UI/LoadingPage/LoadingPage';

interface LPGuardProps {
  auth_status: boolean
}

const AsyncLandingPage = React.lazy(() => import('./Container/LandingPage/landingpage'));
const AsyncMainPage = React.lazy(() => import('./Container/MainPage/mainpage'));

const LandingPageGuard: React.FC<LPGuardProps> = (props) => {
  const { auth_status } = props;
  
  if (auth_status === false) {
    return (
      <React.Fragment>
        <Suspense fallback={<LoadingPage/>}>
          <AsyncLandingPage/>
        </Suspense>
      </React.Fragment>
    )
  }
  return null
};

const MainPageGuard: React.FC<LPGuardProps> = (props) => {
  const { auth_status } = props;
  if (auth_status === true) {
    return (
      <React.Fragment>
        <Suspense fallback={<LoadingPage/>}>
          <AsyncMainPage/>
        </Suspense>
      </React.Fragment>
    );
  }
  return null;
}

function App() {
  const [auth_status, setAuthStatus] = useState<null | boolean>(null);

  useEffect(() => {
      const AuthenticationCheck = async(): Promise<void> => {
        const token = localStorage.getItem('auth-token');
        const username = localStorage.getItem('username');
        if (token && username) {
          const config = { token, username };
          const { data } = await axios.post('/check-auth', config)
          setAuthStatus(data);
        }else {
          setAuthStatus(false);
        }
      };

      AuthenticationCheck();
  }, []);


  if (auth_status !== null) {
    return (
      <React.Fragment>
        <BrowserRouter>
          <LandingPageGuard auth_status={auth_status}/>
          <MainPageGuard auth_status={auth_status}/>
        </BrowserRouter>    
      </React.Fragment>
    )
  }
  return <React.Fragment></React.Fragment>
};

export default App;