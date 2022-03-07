import { ParameterOwner, Parameter } from '@zeainc/zea-engine'
import { ParameterWidget } from './ParameterWidget'

class ParamEditor extends HTMLElement {
  $params: HTMLDivElement
  parameterOwner: ParameterOwner | null = null

  static registrations: Record<string, typeof ParameterWidget> = {}
  skipList: string[] = []

  static registerWidget(
    tagName: string,
    classDef: typeof ParameterWidget
  ): void {
    this.registrations[tagName] = classDef
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    this.$params = document.createElement('div')
    this.$params.classList.add('ParameterOwnerWidget')
    this.shadowRoot?.appendChild(this.$params)

    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
      .ParameterOwnerWidget {
        display: grid;
        grid-template-columns: 1fr 150px;
      }`)
    )
    this.shadowRoot?.appendChild(styleTag)

    this.skipList.push('BoundingBox')
    this.skipList.push('LocalXfo')
    this.skipList.push('GlobalXfo')
    this.skipList.push('Normal') // Material normal param.
  }

  setParameterOwner(parameterOwner: ParameterOwner) {
    this.$params.textContent = ''
    this.parameterOwner = parameterOwner
    if (!this.parameterOwner) return
    this.parameterOwner.getParameters().forEach(parameter => {
      console.log(parameter.getName())
      if (this.skipList.includes(parameter.getName())) return

      let found = false
      let tagName = ''
      for (tagName in ParamEditor.registrations) {
        const widgetClass = ParamEditor.registrations[tagName]
        if (widgetClass.checkParam(parameter)) {
          found = true
          break
        }
      }
      if (!found) return

      const $paramNameDiv = document.createElement('div')
      $paramNameDiv.textContent = parameter.getName()
      this.$params.appendChild($paramNameDiv)

      const $paramDiv = document.createElement('div')
      $paramDiv.classList.add('pointer-events-auto')
      // @ts-ignore
      const $paramElem = <ParameterWidget>document.createElement(tagName)
      $paramDiv.appendChild($paramElem)
      $paramElem.setParameter(parameter)
      this.$params.appendChild($paramDiv)
    })
  }
}

customElements.define('zea-param-editor', ParamEditor)
export { ParamEditor }
