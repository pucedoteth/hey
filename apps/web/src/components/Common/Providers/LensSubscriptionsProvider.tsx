import { API_URL } from '@hey/data/constants';
import {
  AuthorizationRecordRevokedDocument,
  NewNotificationDocument,
  type Notification,
  type UserSigNonces,
  UserSigNoncesDocument
} from '@hey/lens';
import resetAuthData from '@hey/lib/resetAuthData';
import { BrowserPush } from '@lib/browserPush';
import getCurrentSessionId from '@lib/getCurrentSessionId';
import getPushNotificationData from '@lib/getPushNotificationData';
import type { FC } from 'react';
import useWebSocket from 'react-use-websocket';
import { isSupported, share } from 'shared-zustand';
import { useAppPersistStore } from 'src/store/useAppPersistStore';
import { useNonceStore } from 'src/store/useNonceStore';
import { useNotificationPersistStore } from 'src/store/useNotificationPersistStore';
import { useEffectOnce, useUpdateEffect } from 'usehooks-ts';
import { useAccount } from 'wagmi';

const LensSubscriptionsProvider: FC = () => {
  const profileId = useAppPersistStore((state) => state.profileId);
  const setLatestNotificationId = useNotificationPersistStore(
    (state) => state.setLatestNotificationId
  );
  const {
    setLensHubOnchainSigNonce,
    setLensTokenHandleRegistryOnchainSigNonce,
    setLensPublicActProxyOnchainSigNonce
  } = useNonceStore();
  const { address } = useAccount();

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    API_URL.replace('http', 'ws'),
    { protocols: ['graphql-ws'] }
  );

  useEffectOnce(() => {
    sendJsonMessage({ type: 'connection_init' });
  });

  useUpdateEffect(() => {
    if (readyState === 1 && profileId && address) {
      sendJsonMessage({
        id: '1',
        type: 'start',
        payload: {
          variables: { for: profileId },
          query: NewNotificationDocument
        }
      });
      sendJsonMessage({
        id: '2',
        type: 'start',
        payload: { variables: { address }, query: UserSigNoncesDocument }
      });
      sendJsonMessage({
        id: '3',
        type: 'start',
        payload: {
          variables: { authorizationId: getCurrentSessionId() },
          query: AuthorizationRecordRevokedDocument
        }
      });
    }
  }, [readyState, profileId]);

  useUpdateEffect(() => {
    const jsonData = JSON.parse(lastMessage?.data || '{}');
    const wsData = jsonData?.payload?.data;

    if (profileId && address && wsData) {
      if (jsonData.id === '1') {
        const notification = wsData.newNotification as Notification;
        if (getPushNotificationData(notification)) {
          const notify = getPushNotificationData(notification);
          BrowserPush.notify({
            title: notify?.title || ''
          });
        }
        setLatestNotificationId(notification.id);
      }
      if (jsonData.id === '2') {
        const userSigNonces = wsData.userSigNonces as UserSigNonces;
        setLensHubOnchainSigNonce(userSigNonces.lensHubOnchainSigNonce);
        setLensTokenHandleRegistryOnchainSigNonce(
          userSigNonces.lensTokenHandleRegistryOnchainSigNonce
        );
        setLensPublicActProxyOnchainSigNonce(
          userSigNonces.lensPublicActProxyOnchainSigNonce
        );
      }
      if (jsonData.id === '3') {
        resetAuthData();
        location.reload();
      }
    }
  }, [lastMessage]);

  // Sync zustand stores between tabs
  if (isSupported()) {
    share('lensHubOnchainSigNonce', useNonceStore);
    share('lensTokenHandleRegistryOnchainSigNonce', useNonceStore);
    share('lensPublicActProxyOnchainSigNonce', useNonceStore);
  }

  return null;
};

export default LensSubscriptionsProvider;
