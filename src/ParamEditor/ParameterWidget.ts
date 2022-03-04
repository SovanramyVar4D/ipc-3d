import { Parameter } from '@zeainc/zea-engine'

abstract class ParameterWidget extends HTMLElement {
  parameter: Parameter<any> | null = null

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  abstract setValue(): void
  abstract updateValue(): void

  setParameter(parameter: Parameter<any>) {
    this.parameter = parameter
    this.parameter.on('valueChanged', () => this.updateValue())

    this.updateValue()
  }
}

export { ParameterWidget }
