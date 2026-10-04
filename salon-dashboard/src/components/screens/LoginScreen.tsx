import { FormEvent, useState } from 'react';
import { useI18n } from '../../i18n';

type LoginScreenProps = {
  error?: string;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginScreen({ error, onLogin }: LoginScreenProps) {
  const { language, toggleLanguage, t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="hero-shade" />
        <div className="login-brand">
          <div className="brand-mark large">SL</div>
          <span>{t('loginBrand')}</span>
        </div>
        <div className="login-hero-copy">
          <p>{t('loginHeroEyebrow')}</p>
          <h1>{t('loginHeroTitle')}</h1>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <button type="button" className="language-toggle login-language" onClick={toggleLanguage}>
            {language === 'vi' ? 'EN' : 'VI'}
          </button>
          <div>
            <span className="eyebrow">{t('ownerPortal')}</span>
            <h2>{t('ownerLoginTitle')}</h2>
            <p>{t('ownerLoginDesc')}</p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <label>
            {t('email')}
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label>
            {t('password')}
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>

          <button className="submit-button" disabled={submitting}>
            {submitting ? t('connecting') : t('loginDashboard')}
          </button>
        </form>
      </section>
    </div>
  );
}
