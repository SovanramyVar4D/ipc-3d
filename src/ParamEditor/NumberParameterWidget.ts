import { NumberParameter, Parameter } from '@zeainc/zea-engine'
import { ParameterValueChange, UndoRedoManager } from '@zeainc/zea-ux'
import { ParameterWidget } from './ParameterWidget'

class NumberParameterWidget extends ParameterWidget {
  parameter: NumberParameter | null = null
  $input: HTMLInputElement

  // Note: range inputs are not able to hanle scalar values, and so
  // we multiply the value by 100 when displaying and then divide again
  // when setting to the parameter.
  multiplier = 1

  constructor() {
    super()

    this.$input = document.createElement('input')
    this.$input.setAttribute('type', 'number')
    this.$input.setAttribute('id', 'value')
    this.$input.setAttribute('name', 'value')

    this.shadowRoot?.appendChild(this.$input)

    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
        input {
          width: 100%;
        }
      `)
    )
    this.shadowRoot?.appendChild(styleTag)

    let change: ParameterValueChange | null = null
    this.$input.addEventListener('input', () => {
      if (this.parameter) {
        const value = this.$input.valueAsNumber / this.multiplier
        if (!change) {
          change = new ParameterValueChange(this.parameter, value)
          UndoRedoManager.getInstance().addChange(change)
        } else {
          change.update({
            value
          })
        }
      }
    })
    this.$input.addEventListener('change', () => {
      if (change) {
        change = null
      }
    })
  }

  updateValue(): void {
    this.$input.value = `${this.parameter?.value! * this.multiplier}`
  }

  setParameter(parameter: NumberParameter) {
    const range = parameter.getRange()
    if (range) {
      this.multiplier = 100
      this.$input.type = `range`
      this.$input.min = `${range[0] * this.multiplier}`
      this.$input.max = `${range[1] * this.multiplier}`
    }
    const step = parameter.getStep()
    if (step) {
      this.$input.step = `${step * this.multiplier}`
    }
    super.setParameter(parameter)
  }

  static checkParam(param: Parameter<any>) {
    return param instanceof NumberParameter
  }
}

import { ParamEditor } from './ParamEditor'
ParamEditor.registerWidget('zea-number-param', NumberParameterWidget)

customElements.define('zea-number-param', NumberParameterWidget)
