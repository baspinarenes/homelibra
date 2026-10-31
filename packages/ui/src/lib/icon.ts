import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';

/** A lucide icon, imported one by one (`lucide-react-native/icons/<name>`) to keep the bundle small. */
export type IconComponent = ComponentType<{ color?: ColorValue; size?: number; strokeWidth?: number }>;
