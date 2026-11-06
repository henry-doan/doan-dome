import { SLIDE_SIZES } from './layouts.js'
import { SLIDE_THEMES } from './slideThemes.js'

/**
 * Doan Dome files (.dome) are JSON: the presentation with its images
 * inside. They're for backups and for moving a presentation between
 * browsers. PowerPoint and PDF come in a later version.
 */

export const DECK_FILE_ACCEPT = '.dome,application/json'
const FORMAT = 'doan-dome'

const isElement = (element) =>
  element && typeof element === 'object' && ['text', 'shape', 'image'].includes(element.type) && ['x', 'y', 'w', 'h'].every((key) => Number.isFinite(element[key]))

export const readDeckFile = async (file) => {
  let data
  try {
    data = JSON.parse(await file.text())
  } catch (error) {
    throw new Error('This file isn’t a Doan Dome presentation.', { cause: error })
  }
  const deck = data?.format === FORMAT ? data.deck : null
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    throw new Error('This file isn’t a Doan Dome presentation.')
  }
  return {
    title: String(deck.title || file.name.replace(/\.[^.]+$/, '') || 'Imported presentation').slice(0, 200),
    theme: SLIDE_THEMES.some((theme) => theme.id === deck.theme) ? deck.theme : 'midnight',
    aspect: SLIDE_SIZES[deck.aspect] ? deck.aspect : '16:9',
    slides: deck.slides.map((slide) => ({
      id: String(slide.id ?? ''),
      notes: typeof slide.notes === 'string' ? slide.notes : '',
      background: typeof slide.background === 'string' ? slide.background : null,
      transition: typeof slide.transition === 'string' ? slide.transition : 'fade',
      // Images must be embedded; links to other sites are dropped.
      elements: (slide.elements ?? []).filter(isElement).filter((element) => element.type !== 'image' || /^data:image\//.test(element.src)),
    })),
  }
}

export const downloadDeckFile = (deck) => {
  const { title, theme, aspect, slides } = deck
  const blob = new Blob([JSON.stringify({ format: FORMAT, version: 1, deck: { title, theme, aspect, slides } })], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `${title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Presentation'}.dome`,
  })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
