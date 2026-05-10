import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../App';

export default function AuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refetch } = useAuthContext();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=auth_failed');
      return;
    }

    localStorage.setItem('djdou_token', token);
    refetch().then(() => navigate('/dashboard'));
  }, [params, navigate, refetch]);

  return null;
}
