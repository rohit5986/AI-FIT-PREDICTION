import React, { createContext, useCallback, useMemo, useState } from 'react';

const DEFAULT_PROFILE = {
  measurements: {
    height: '',
    weight: '',
    chest: '',
    waist: ''
  },
  audience: 'all',
  preferredBrands: []
};

export const UserProfileContext = createContext({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  resetProfile: () => {}
});

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const updateProfile = useCallback((nextProfile) => {
    setProfile((prev) => {
      const nextMeasurements = {
        ...prev.measurements,
        ...(nextProfile?.measurements || {})
      };

      const nextAudience = ['all', 'men', 'women'].includes(nextProfile?.audience)
        ? nextProfile.audience
        : prev.audience;

      const nextPreferredBrands = Array.isArray(nextProfile?.preferredBrands)
        ? nextProfile.preferredBrands.filter(Boolean)
        : prev.preferredBrands;

      return {
        measurements: nextMeasurements,
        audience: nextAudience,
        preferredBrands: nextPreferredBrands
      };
    });
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, []);

  const value = useMemo(
    () => ({ profile, updateProfile, resetProfile }),
    [profile, updateProfile, resetProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};
