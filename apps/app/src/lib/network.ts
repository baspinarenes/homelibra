import { type NetworkState, useNetworkState } from 'expo-network';

/** No connection, or one that does not reach the internet. Not yet known counts as online. */
export const isOffline = (state: NetworkState) => state.isConnected === false || state.isInternetReachable === false;

/** Whether the device is offline now; on the web, as the browser reports it. */
export function useOffline() {
  return isOffline(useNetworkState());
}
