import { Color, ColorParameter } from '@zeainc/zea-engine'
import { ParameterValueChange, UndoRedoManager } from '@zeainc/zea-ux'
import { ParameterWidget } from './ParameterWidget'

class ColorParameterWidget extends ParameterWidget {
  parameter: ColorParameter | null = null
  $input: HTMLInputElement

  constructor() {
    super()

    const $label = document.createElement('label')
    $label.setAttribute('for', 'value')
    $label.textContent = 'Value:'
    $label.textContent = 'Value:'

    this.$input = document.createElement('input')
    this.$input.setAttribute('type', 'color')
    this.$input.setAttribute('id', 'value')
    this.$input.setAttribute('name', 'value')

    this.shadowRoot?.appendChild($label)
    this.shadowRoot?.appendChild(this.$input)

    this.$input.addEventListener('change', () => {})
  }

  setValue(): void {
    if (this.parameter) {
      const value = new Color(this.$input.value)
      const change = new ParameterValueChange(this.parameter, value)
      UndoRedoManager.getInstance().addChange(change)
    }
  }

  updateValue(): void {
    this.$input.value = `${this.parameter?.value.toHex()}`
  }
}

import { ParamEditor } from './ParamEditor'
ParamEditor.registerWidget('ColorParameter', 'zea-color-param')

customElements.define('zea-color-param', ColorParameterWidget)
