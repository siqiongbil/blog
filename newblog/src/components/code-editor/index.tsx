import { defineComponent, ref, onMounted, watch } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view'
import type { Extension, EditorStateConfig } from '@codemirror/state'
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldKeymap,
  foldGutter,
} from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import './style.css'

const basicSetup: Extension = [
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap]),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
]

export default defineComponent({
  name: 'CodeEditor',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    theme: {
      type: String,
      default: 'dark',
    },
    language: {
      type: String,
      default: 'javascript',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const editorRef = ref<HTMLDivElement>()
    let editorView: EditorView | null = null

    const initEditor = () => {
      if (!editorRef.value) return

      const extensions = [
        basicSetup,
        javascript(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const content = update.state.doc.toString()
            emit('update:modelValue', content)
          }
        }),
      ]

      if (props.theme === 'dark') {
        extensions.push(oneDark)
      }

      const state = EditorState.create({
        doc: props.modelValue,
        extensions,
      })

      editorView = new EditorView({
        state,
        parent: editorRef.value,
      })
    }

    onMounted(() => {
      initEditor()
    })

    watch(
      () => props.modelValue,
      (newValue) => {
        if (editorView && newValue !== editorView.state.doc.toString()) {
          editorView.dispatch({
            changes: {
              from: 0,
              to: editorView.state.doc.length,
              insert: newValue,
            },
          })
        }
      },
    )

    return () => <div ref={editorRef} class="code-editor"></div>
  },
})
