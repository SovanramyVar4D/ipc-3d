import { StringParameter, Parameter } from '@zeainc/zea-engine'
import { ParameterValueChange, UndoRedoManager } from '@zeainc/zea-ux'
import { ParameterWidget } from './ParameterWidget'

class StringParameterWidget extends ParameterWidget {
  parameter: StringParameter | null = null
  // $label: HTMLLabelElement
  $input: HTMLInputElement

  constructor() {
    super()

    this.$input = document.createElement('input')
    this.$input.setAttribute('type', 'string')
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

    this.$input.addEventListener('change', () => {
      this.setValue()
    })
  }

  setValue(): void {
    if (this.parameter) {
      const value = this.$input.value
      const change = new ParameterValueChange(this.parameter, value)
      UndoRedoManager.getInstance().addChange(change)
    }
  }

  updateValue(): void {
    console.log('updateValue:', this.parameter?.value)
    this.$input.value = `${this.parameter?.value}`
  }

  static checkParam(param: Parameter<any>) {
    return param instanceof StringParameter
  }
}

import { ParamEditor } from './ParamEditor'
ParamEditor.registerWidget('zea-string-param', StringParameterWidget)

customElements.define('zea-string-param', StringParameterWidget)
