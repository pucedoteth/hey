import { PREFERENCES_WORKER_URL } from '@hey/data/constants';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { FC } from 'react';
import { useAppPersistStore } from 'src/store/useAppPersistStore';
import { useAppStore } from 'src/store/useAppStore';
import { usePreferencesStore } from 'src/store/usePreferencesStore';

const PreferencesProvider: FC = () => {
  const profileId = useAppPersistStore((state) => state.profileId);
  const setVerifiedMembers = useAppStore((state) => state.setVerifiedMembers);
  const {
    setIsStaff,
    setIsGardener,
    setIsLensMember,
    setStaffMode,
    setGardenerMode,
    setIsPride,
    setHighSignalNotificationFilter,
    setLoadingPreferences
  } = usePreferencesStore();

  const fetchPreferences = async () => {
    try {
      if (Boolean(profileId)) {
        const response = await axios.get(
          `${PREFERENCES_WORKER_URL}/get/${profileId}`
        );
        const { data } = response;

        setIsStaff(data.result?.is_staff || false);
        setIsGardener(data.result?.is_gardener || false);
        setIsLensMember(data.result?.is_lens_member || false);
        setStaffMode(data.result?.staff_mode || false);
        setGardenerMode(data.result?.gardener_mode || false);
        setIsPride(data.result?.is_pride || false);
        setHighSignalNotificationFilter(
          data.result?.high_signal_notification_filter || false
        );
      }
    } catch {
    } finally {
      setLoadingPreferences(false);
    }
  };

  useQuery({
    queryKey: ['fetchPreferences', profileId || ''],
    queryFn: fetchPreferences
  });

  const fetchVerifiedMembers = async () => {
    try {
      const response = await axios.get(`${PREFERENCES_WORKER_URL}/verified`);
      const { data } = response;
      setVerifiedMembers(data.result || []);
    } catch {}
  };

  useQuery({
    queryKey: ['fetchVerifiedMembers'],
    queryFn: fetchVerifiedMembers
  });

  return null;
};

export default PreferencesProvider;
