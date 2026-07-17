import { createSlice } from '@reduxjs/toolkit'

const saved = localStorage.getItem('theme') || 'light'
if (saved === 'dark') document.documentElement.classList.add('dark')

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: saved },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('theme', state.mode)
    }
  }
})

export const { toggleTheme } = themeSlice.actions
export default themeSlice.reducer
