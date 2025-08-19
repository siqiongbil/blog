import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'

export default defineComponent({
  name: 'LanguageSwitcher',
  setup() {
    const { locale } = useI18n()

    const toggleLanguage = () => {
      const newLocale = locale.value === 'zh' ? 'en' : 'zh'
      locale.value = newLocale
      localStorage.setItem('language', newLocale)
    }

    return () => (
      <NButton text size="small" onClick={toggleLanguage} style="font-size: 14px; color: #666">
        {locale.value.toUpperCase()}
      </NButton>
    )
  },
})
