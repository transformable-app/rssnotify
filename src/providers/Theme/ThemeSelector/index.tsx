'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Monitor, Moon, Sun } from 'lucide-react'
import React, { useState } from 'react'

import type { Theme } from '../types'

import { useTheme } from '..'
import { themeLocalStorageKey } from './types'

const themeOptions = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState('')

  const onThemeChange = (themeToSet: string) => {
    if (themeToSet === 'system') {
      setTheme(null)
      setValue('system')
    } else if (themeToSet === 'light' || themeToSet === 'dark') {
      setTheme(themeToSet as Theme)
      setValue(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    setValue(preference ?? 'system')
  }, [])

  const currentTheme = themeOptions.find((option) => option.value === value) || themeOptions[0]
  const CurrentIcon = currentTheme.icon

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger
        aria-label="Select a theme"
        title="Color mode"
        className="w-auto min-w-fit bg-transparent gap-2 pl-0 md:pl-3 border-none h-auto py-1 text-foreground"
      >
        <CurrentIcon className="h-4 w-4 text-foreground" />
      </SelectTrigger>
      <SelectContent>
        {themeOptions.map((option) => {
          const Icon = option.icon
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
