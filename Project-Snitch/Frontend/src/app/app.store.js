import {configureStore} from '@reduxjs/toolkit';
import authSlice from '../features/auth/state/auth.slice.js';

export const store = configureStore({
  reducer: {
    auth: authSlice, 
  },
});