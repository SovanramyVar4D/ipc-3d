import { ParameterOwner, Parameter, BaseItem } from '@zeainc/zea-engine'
import { ParameterWidget } from './ParameterWidget'

class ParamEditor extends HTMLElement {
  parameterOwner: ParameterOwner | null = null

  static registrations: Record<string, typeof ParameterWidget> = {}
  skipList: string[] = []
  editableNames = false

  static registerWidget(
    tagName: string,
    classDef: typeof ParameterWidget
  ): void {
    this.registrations[tagName] = classDef
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
      .Name {
        font-weight: bolder;
      }
      
      .ParameterOwnerWidget {
        gap: 3px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1px solid black;
        margin-bottom: 10px;
        padding: 10px;
      }
    `)
    )
    this.shadowRoot?.appendChild(styleTag)

    this.skipList.push('BoundingBox')
    this.skipList.push('LocalXfo')
    this.skipList.push('GlobalXfo')
    this.skipList.push('Normal') // Material normal param.
  }

  clear() {
    while (this.shadowRoot!.childNodes.length > 1) {
      this.shadowRoot!.removeChild(this.shadowRoot!.lastChild!)
    }
  }

  addParameterOwner(parameterOwner: ParameterOwner) {
    // this.parameterOwner = parameterOwner
    // if (!this.parameterOwner) return

    if (parameterOwner instanceof BaseItem) {
      if (!this.editableNames) {
        const $name = document.createElement('div')
        $name.textContent = parameterOwner.getName()
        $name.classList.add('Name')
        this.shadowRoot?.appendChild($name)
      } else {
        const $inputName = <HTMLInputElement>document.createElement('input')
        $inputName.setAttribute('type', 'string')
        $inputName.value = parameterOwner.getName()
        $inputName.style.width = '100%'

        $inputName.addEventListener('change', () => {
          parameterOwner.setName($inputName.value)
        })
        this.shadowRoot?.appendChild($inputName)
      }
    }

    const $params = document.createElement('div')
    $params.classList.add('ParameterOwnerWidget')
    this.shadowRoot?.appendChild($params)

    parameterOwner.getParameters().forEach(parameter => {
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
      $params.appendChild($paramNameDiv)

      const $paramDiv = document.createElement('div')
      $paramDiv.classList.add('pointer-events-auto')
      // @ts-ignore
      const $paramElem = <ParameterWidget>document.createElement(tagName)
      $paramDiv.appendChild($paramElem)
      $paramElem.setParameter(parameter)
      $params.appendChild($paramDiv)
    })
  }
}

customElements.define('zea-param-editor', ParamEditor)

export { ParamEditor }
