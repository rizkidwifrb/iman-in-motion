import { useEffect, useState } from 'react';
import { getStoredUser } from '../utils/accountStorage';

export default function useAuthUser() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const refresh = () => setUser(getStoredUser());
    window.addEventListener('storage', refresh);
    window.addEventListener('iman-auth-change', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('iman-auth-change', refresh);
    };
  }, []);

  return user;
}
