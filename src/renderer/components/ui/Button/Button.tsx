import React from 'react';
import './Button.css';

interface BaseButtonProps {
  variant?: 'primary' | 'danger' | 'secondary' | 'icon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  active?: boolean;
  fullWidth?: boolean;
}

type IconOnlyButtonProps = BaseButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
    iconOnly: true;
    'aria-label': string;
    children?: never;
  };

type StandardButtonProps = BaseButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
    iconOnly?: false;
    'aria-label'?: string;
  };

export type ButtonProps = IconOnlyButtonProps | StandardButtonProps;

function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconOnly = false,
  loading = false,
  active = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    iconOnly && 'btn-icon-only',
    loading && 'btn-loading',
    active && 'btn-active',
    fullWidth && 'btn-full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="btn-icon-wrapper">{icon}</span>
      )}
      {!iconOnly && children && <span className="btn-text">{children}</span>}
    </button>
  );
}

export { Button };
