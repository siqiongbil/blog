import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeEditor from '../code-editor'
import './style.css'

export default defineComponent({
  name: 'CodeRunner',
  setup() {
    const { t } = useI18n()
    const code = ref('console.log("Hello, World!")')
    const output = ref('')
    const error = ref('')
    const isRunning = ref(false)

    const runCode = async () => {
      isRunning.value = true
      error.value = ''
      output.value = ''

      try {
        // 创建一个安全的执行环境
        const safeEval = new Function(
          'console',
          `
          let output = '';
          const safeConsole = {
            log: (...args) => output += args.join(' ') + '\\n',
            error: (...args) => output += 'Error: ' + args.join(' ') + '\\n',
            warn: (...args) => output += 'Warning: ' + args.join(' ') + '\\n',
            info: (...args) => output += 'Info: ' + args.join(' ') + '\\n'
          };
          try {
            ${code.value}
          } catch (e) {
            output += 'Error: ' + e.message;
          }
          return output;
        `,
        )

        const result = safeEval(console)
        output.value = result
      } catch (e) {
        error.value = e instanceof Error ? e.message : t('codeRunner.error')
      } finally {
        isRunning.value = false
      }
    }

    return () => (
      <div class="code-runner">
        <div class="editor-container">
          <CodeEditor v-model={code.value} />
        </div>
        <div class="result-container">
          <div class="result-header">
            <h3>{t('codeRunner.runResult')}</h3>
            <button onClick={runCode} disabled={isRunning.value}>
              {t('codeRunner.runCode')}
            </button>
          </div>
          <div class="result-content">
            {isRunning.value ? (
              <div class="loading">{t('codeRunner.running')}</div>
            ) : error.value ? (
              <div class="error">{error.value}</div>
            ) : (
              <div class="output">{output.value}</div>
            )}
          </div>
        </div>
      </div>
    )
  },
})
