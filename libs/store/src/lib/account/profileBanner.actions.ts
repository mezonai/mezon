import { createAction } from '@reduxjs/toolkit';

// An empty banner in UserProfileUpdatedEvent means unchanged, not removal.
export const profileBannerUpdated = createAction<{ userId: string; banner?: string }>('account/profileBannerUpdated');
