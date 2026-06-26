import React from 'react';
import { MezonAdminContext } from '../contexts/AdminContext';
import { MezonContext } from '../contexts/MezonContext';

export const useMezon = () => React.useContext(MezonContext);
export const useAdminMezon = () => React.useContext(MezonAdminContext);
