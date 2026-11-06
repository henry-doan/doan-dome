import { changeAspect, createSlide } from '../lib/layouts.js'
import { makeId } from '../lib/random.js'

/**
 * Pure helpers that return a changed copy of the working presentation
 * ({ title, theme, aspect, slides }). The editor keeps every version for undo.
 */

export const updateSlide = (doc, index, update) => ({
  ...doc,
  slides: doc.slides.map((slide, position) => (position === index ? update(slide) : slide)),
})

export const updateElements = (doc, index, ids, update) =>
  updateSlide(doc, index, (slide) => ({
    ...slide,
    elements: slide.elements.map((element) => (ids.includes(element.id) ? { ...element, ...update(element) } : element)),
  }))

export const addElement = (doc, index, element) =>
  updateSlide(doc, index, (slide) => ({ ...slide, elements: [...slide.elements, element] }))

export const removeElements = (doc, index, ids) =>
  updateSlide(doc, index, (slide) => ({ ...slide, elements: slide.elements.filter((element) => !ids.includes(element.id)) }))

/** Copies of elements with new ids, offset so they don't sit exactly on the originals. */
export const copiesOf = (elements, offset = 30) =>
  elements.map((element) => ({ ...element, id: makeId(), x: element.x + offset, y: element.y + offset }))

export const addElements = (doc, index, elements) =>
  updateSlide(doc, index, (slide) => ({ ...slide, elements: [...slide.elements, ...elements] }))

/** Moves elements in the stacking order: 'front', 'forward', 'backward' or 'back'. */
export const arrange = (doc, index, ids, where) =>
  updateSlide(doc, index, (slide) => {
    const chosen = slide.elements.filter((element) => ids.includes(element.id))
    const others = slide.elements.filter((element) => !ids.includes(element.id))
    if (where === 'front') return { ...slide, elements: [...others, ...chosen] }
    if (where === 'back') return { ...slide, elements: [...chosen, ...others] }
    const elements = [...slide.elements]
    const order = where === 'forward' ? [...elements.keys()].reverse() : [...elements.keys()]
    for (const position of order) {
      const target = where === 'forward' ? position + 1 : position - 1
      if (!ids.includes(elements[position].id) || target < 0 || target >= elements.length || ids.includes(elements[target].id)) continue
      ;[elements[position], elements[target]] = [elements[target], elements[position]]
    }
    return { ...slide, elements }
  })

export const insertSlide = (doc, afterIndex, layoutId) => {
  const slide = createSlide(layoutId, doc.aspect)
  const slides = [...doc.slides]
  slides.splice(afterIndex + 1, 0, slide)
  return { ...doc, slides }
}

export const duplicateSlide = (doc, index) => {
  const original = doc.slides[index]
  const copy = { ...original, id: makeId(), elements: original.elements.map((element) => ({ ...element, id: makeId() })) }
  const slides = [...doc.slides]
  slides.splice(index + 1, 0, copy)
  return { ...doc, slides }
}

export const deleteSlide = (doc, index) =>
  doc.slides.length <= 1 ? doc : { ...doc, slides: doc.slides.filter((_, position) => position !== index) }

export const moveSlide = (doc, from, to) => {
  if (to < 0 || to >= doc.slides.length || from === to) return doc
  const slides = [...doc.slides]
  const [slide] = slides.splice(from, 1)
  slides.splice(to, 0, slide)
  return { ...doc, slides }
}

export const setAspect = (doc, aspect) =>
  doc.aspect === aspect ? doc : { ...doc, aspect, slides: changeAspect(doc.slides, doc.aspect, aspect) }
