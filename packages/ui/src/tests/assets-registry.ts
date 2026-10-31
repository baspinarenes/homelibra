// react-native-svg's web build asks Metro's asset registry for bundled images.
// The package draws none, and the registry is not installed outside Metro.
export const getAssetByID = () => undefined;
