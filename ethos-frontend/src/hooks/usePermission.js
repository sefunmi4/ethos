import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Permissions } from '../utils/permissions';

export const usePermission = (action) => {
  const { user } = useContext(AuthContext);
  return user && Permissions[action]?.includes(user.role);
};