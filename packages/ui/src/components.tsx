import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'discord' | 'danger';

export function Button({ variant = 'default', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`ot-btn ${variant === 'default' ? '' : variant} ${className}`} {...rest} />;
}

export function Panel({ title, children, actions }: { title?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="ot-panel">
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {title && <h2 style={{ fontSize: 18, flex: 1 }}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <div className="ot-note">{children}</div>;
}
