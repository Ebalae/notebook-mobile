import Svg, { Path } from 'react-native-svg';

export function FolderIcon({ color }) {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path d="M3.5 8.5c0-1.1.9-2 2-2h6l2 2h9c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-17c-1.1 0-2-.9-2-2v-11Z" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <Path d="M3.8 11h20.4" fill="none" stroke={color} strokeLinecap="round" strokeWidth="1.8" />
    </Svg>
  );
}

function Icon({ color, size = 24, path }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Svg>
  );
}

export function TrashIcon({ color, size = 30 }) {
  return <Icon color={color} size={size} path="M7 8h10M9.5 8V6h5v2M8.5 10v9h7v-9" />;
}

export function HighlightIcon({ color, size = 23 }) {
  return <Icon color={color} size={size} path="m5 16 9.6-9.6a2 2 0 0 1 2.8 2.8L7.8 18.8 5 19l.2-3ZM13 8l3 3M4 21h8" />;
}

export function MoveIcon({ color, size = 23 }) {
  return <Icon color={color} size={size} path="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3" />;
}

export function ShareIcon({ color, size = 27 }) {
  return <Icon color={color} size={size} path="M12 15V4m0 0L8 8m4-4 4 4M5 13v6h14v-6" />;
}

export function BellIcon({ color, size = 28 }) {
  return <Icon color={color} size={size} path="M6 16h12l-1.2-1.8V10a4.8 4.8 0 0 0-9.6 0v4.2L6 16Zm4.2 3h3.6" />;
}

export function PencilIcon({ color, size = 28 }) {
  return <Icon color={color} size={size} path="m5 19 1.2-4.4L15.8 5a2 2 0 0 1 2.8 2.8l-9.6 9.6L5 19Zm7.8-12.8 2.8 2.8M6.2 14.6l3.2 3.2" />;
}

export function PaperclipIcon({ color, size = 28 }) {
  return <Icon color={color} size={size} path="m8.5 12.5 6.3-6.3a3.5 3.5 0 0 1 5 5l-7.4 7.4a5 5 0 0 1-7.1-7L12 5" />;
}

export function PinIcon({ color, size = 15 }) {
  return <Icon color={color} size={size} path="M8 3h8l-1 5 3 3v2h-5v7l-1 1-1-1v-7H6v-2l3-3-1-5Z" />;
}
