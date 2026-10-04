import React from 'react';
import {
  Alert as RNAlert,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  Platform
} from 'react-native';
import { getCurrentLanguage, useLanguage } from './LanguageContext';
import { translateText } from './translations';

function translateNode(node: React.ReactNode, language: ReturnType<typeof getCurrentLanguage>): React.ReactNode {
  if (typeof node === 'string') {
    return translateText(language, node);
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={index}>{translateNode(child, language)}</React.Fragment>
    ));
  }

  return node;
}

export const LocalizedText = ({ children, ...props }: TextProps) => {
  const { language } = useLanguage();
  return <RNText {...props}>{translateNode(children, language)}</RNText>;
};

export const LocalizedTextInput = ({ placeholder, ...props }: TextInputProps) => {
  const { language } = useLanguage();
  const localizedPlaceholder =
    typeof placeholder === 'string' ? translateText(language, placeholder) : placeholder;

  return <RNTextInput {...props} placeholder={localizedPlaceholder} />;
};

export const LocalizedAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: Parameters<typeof RNAlert.alert>[2],
    options?: Parameters<typeof RNAlert.alert>[3]
  ) {
    const language = getCurrentLanguage();
    const localizedButtons = buttons?.map((button) => ({
      ...button,
      text: typeof button.text === 'string' ? translateText(language, button.text) : button.text
    }));

    if (Platform.OS === 'web') {
      const translatedTitle = translateText(language, title);
      const translatedMsg = typeof message === 'string' ? translateText(language, message) : message || '';
      const fullText = translatedTitle ? `${translatedTitle}${translatedMsg ? '\n\n' + translatedMsg : ''}` : translatedMsg;
      if (localizedButtons && localizedButtons.length > 0) {
        if (localizedButtons.length === 1) {
          window.alert(fullText);
          localizedButtons[0].onPress?.();
        } else {
          const confirmed = window.confirm(fullText);
          if (confirmed) {
            const defaultBtn = localizedButtons.find((b) => b.style !== 'cancel') || localizedButtons[0];
            defaultBtn.onPress?.();
          } else {
            const cancelBtn = localizedButtons.find((b) => b.style === 'cancel');
            cancelBtn?.onPress?.();
          }
        }
        return;
      }
      window.alert(fullText);
      return;
    }

    RNAlert.alert(
      translateText(language, title),
      typeof message === 'string' ? translateText(language, message) : message,
      localizedButtons,
      options
    );
  }
};
