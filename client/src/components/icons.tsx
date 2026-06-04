import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, className, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 4.5h5v5H4zM15 4.5h5v5h-5zM4 14.5h5v5H4zM15 14.5h5v5h-5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M16.5 20v-1.3c0-1.8-1.6-3.2-3.6-3.2H7.1c-2 0-3.6 1.4-3.6 3.2V20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.8 11.5c1.7 0 3 1.2 3 2.7V17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="17.2" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 7.5h3l1.8-2.5h5.4l1.8 2.5h3a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19.5 19H4.5A1.5 1.5 0 0 1 3 17.5V9a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M10.2 4.5h3.6l.5 2.1 1.7 1 2.1-.6 1.8 3.1-1.6 1.4v2l1.6 1.4-1.8 3.1-2.1-.6-1.7 1-.5 2.1h-3.6l-.5-2.1-1.7-1-2.1.6-1.8-3.1 1.6-1.4v-2L3.8 10l1.8-3.1 2.1.6 1.7-1 .5-2.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </BaseIcon>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 16.2v.2" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path
        d="M9.8 9.8a2.3 2.3 0 1 1 3.5 1.96c-.9.53-1.3 1.12-1.3 2.04"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </BaseIcon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 8l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M17 12H9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 3.5 19 6v5.4c0 4.2-2.7 7.7-7 9.1-4.3-1.4-7-4.9-7-9.1V6l7-2.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M12 8.1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function UserPlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.5 12.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M17.5 9.5v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path
        d="M12 14a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 6v-.8C4 16.3 7.3 14.5 12 14.5s8 1.8 8 4.7v.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </BaseIcon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 6.5h15v11h-15z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m6.5 14 3-3 3 3 2-2 3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
    </BaseIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v5l3.2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 16.5 4 20l3.5-.5L18.8 8.2a1.6 1.6 0 0 0 0-2.2l-1-1a1.6 1.6 0 0 0-2.2 0L4.5 16.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M13.5 6.5 16.5 9.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5.5 7.5h13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M9 4.5h6M8.5 7.5l.8 11h5.4l.8-11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.8 12s3.6-5.8 9.2-5.8 9.2 5.8 9.2 5.8-3.6 5.8-9.2 5.8S2.8 12 2.8 12Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}

export function CameraButtonIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 7.5h3l1.8-2.5h5.4l1.8 2.5h3a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19.5 19H4.5A1.5 1.5 0 0 1 3 17.5V9a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </BaseIcon>
  );
}
