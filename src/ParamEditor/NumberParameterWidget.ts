import { NumberParameter } from '@zeainc/zea-engine'
import { ParameterValueChange, UndoRedoManager } from '@zeainc/zea-ux'
import { ParameterWidget } from './ParameterWidget'

class NumberParameterWidget extends ParameterWidget {
  parameter: NumberParameter | null = null
  $label: HTMLLabelElement
  $input: HTMLInputElement

  constructor() {
    super()

    this.$label = document.createElement('label')
    this.$label.setAttribute('for', 'value')
    this.$label.textContent = 'Value:'
    this.$label.textContent = 'Value:'

    this.$input = document.createElement('input')
    this.$input.setAttribute('type', 'number')
    this.$input.setAttribute('id', 'value')
    this.$input.setAttribute('name', 'value')

    this.shadowRoot?.appendChild(this.$label)
    this.shadowRoot?.appendChild(this.$input)

    this.$input.addEventListener('change', () => {})
  }

  setValue(): void {
    if (this.parameter) {
      const value = this.$input.valueAsNumber
      const change = new ParameterValueChange(this.parameter, value)
      UndoRedoManager.getInstance().addChange(change)
    }
  }

  updateValue(): void {
    this.$input.value = `${this.parameter?.value}`
  }

  setParameter(parameter: NumberParameter) {
    super.setParameter(parameter)
    this.$label.textContent = parameter.getName() + ':'
    const range = parameter.getRange()
    if (range) {
      this.$input.min = `${range[0]}`
      this.$input.max = `${range[1]}`
    }
    const step = parameter.getStep()
    if (range) {
      this.$input.step = `${step}`
    }
  }
}

import { ParamEditor } from './ParamEditor'
ParamEditor.registerWidget('NumberParameter', 'zea-number-param')

customElements.define('zea-number-param', NumberParameterWidget)
