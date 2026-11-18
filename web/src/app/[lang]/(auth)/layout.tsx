/** Account screens (sign in, create account, reset): no site nav or footer, as on canvas 05-19 and 09-33. */
export default function AuthLayout({ children }: LayoutProps<'/[lang]'>) {
  return <main id="app" className="auth-page" tabIndex={-1}>{children}</main>;
}
