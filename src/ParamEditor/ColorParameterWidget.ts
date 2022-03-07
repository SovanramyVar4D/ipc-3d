import { Color, Parameter, ColorParameter } from '@zeainc/zea-engine'
import { ParameterValueChange, UndoRedoManager } from '@zeainc/zea-ux'
import { ParameterWidget } from './ParameterWidget'

class ColorParameterWidget extends ParameterWidget {
  parameter: ColorParameter | null = null
  $input: HTMLInputElement

  constructor() {
    super()

    this.$input = document.createElement('input')
    this.$input.setAttribute('type', 'color')
    this.$input.setAttribute('id', 'value')
    this.$input.setAttribute('name', 'value')

    this.shadowRoot?.appendChild(this.$input)

    let change: ParameterValueChange | null = null
    this.$input.addEventListener('input', () => {
      const value = new Color(this.$input.value)
      if (!change) {
        change = new ParameterValueChange(this.parameter!, value)
        UndoRedoManager.getInstance().addChange(change)
      } else {
        change.update({
          value
        })
      }
    })
    this.$input.addEventListener('change', () => {
      if (change) {
        change = null
      }
    })
  }

  updateValue(): void {
    this.$input.value = `${this.parameter?.value.toHex()}`
  }

  static checkParam(param: Parameter<any>) {
    return param instanceof ColorParameter
  }
}

import { ParamEditor } from './ParamEditor'
ParamEditor.registerWidget('zea-color-param', ColorParameterWidget)

customElements.define('zea-color-param', ColorParameterWidget)
