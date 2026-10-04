import { useI18n } from '../../i18n';
import { NavigationTab } from '../../types/salon';

type PlaceholderViewProps = {
  tab: NavigationTab;
};

export function PlaceholderView({ tab }: PlaceholderViewProps) {
  const { t } = useI18n();

  return (
    <div className="empty-workspace">
      <span className="material-symbols-outlined">construction</span>
      <h2>{tab}</h2>
      <p>{t('placeholderDesc')}</p>
    </div>
  );
}
