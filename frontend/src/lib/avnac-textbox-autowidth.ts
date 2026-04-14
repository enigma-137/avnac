import type { Textbox } from 'fabric'

const autoWidthTextboxes = new WeakMap<Textbox, true>()

export function enableTextboxAutoWidth(tb: Textbox) {
  autoWidthTextboxes.set(tb, true)
}

export function disableTextboxAutoWidth(tb: Textbox) {
  autoWidthTextboxes.delete(tb)
}

export function textboxUsesAutoWidth(tb: Textbox) {
  return autoWidthTextboxes.has(tb)
}

const LAYOUT_WIDTH = 1e6

export function fitTextboxWidthToContent(tb: Textbox) {
  tb.set('width', LAYOUT_WIDTH)
  tb.initDimensions()
  const measured = Math.ceil(tb.calcTextWidth())
  const next = Math.max(tb.getMinWidth(), measured, tb.minWidth)
  tb.set('width', next)
  tb.initDimensions()
  tb.setCoords()
}
