import { ParameterOwner } from '@zeainc/zea-engine'

class ParamEditor extends HTMLElement {
  $params: HTMLDivElement
  parameterOwner: ParameterOwner | null = null

  static tagNames: Record<string, string> = {}
  skipList: string[] = []

  static registerWidget(className: string, tagName: string): void {
    this.tagNames[className] = tagName
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' })

    this.$params = document.createElement('div')
    this.$params.classList.add('ParameterOwnerWidget')
    this.$params.classList.add('grid')
    this.$params.classList.add('w-120')
    this.$params.classList.add('space-y-2')
    this.$params.classList.add('space-y-2')
    this.shadowRoot?.appendChild(this.$params)

    const styleTag = document.createElement('style')
    styleTag.appendChild(
      document.createTextNode(`
      .ParameterOwnerWidget {
        grid-template-columns: 1fr 150px;
      }`)
    )
    this.shadowRoot?.appendChild(styleTag)

    this.skipList.push('BoundingBox')
    this.skipList.push('LocalXfo')
    this.skipList.push('GlobalXfo')
  }

  setParameterOwner(parameterOwner: ParameterOwner) {
    this.parameterOwner = parameterOwner
    this.parameterOwner.getParameters().forEach(parameter => {
      console.log(parameter.getName())
      if (this.skipList.includes(parameter.getName())) return

      const tagName = ParamEditor.tagNames[parameter.getClassName()]
      if (!tagName) return

      // const $paramNameDiv = document.createElement('div')
      // $paramNameDiv.classList.add('flex')
      // $paramNameDiv.classList.add('items-center')
      // $paramNameDiv.classList.add('justify-end')
      // $paramNameDiv.classList.add('mr-2')
      // $paramNameDiv.classList.add('text-black')
      // $paramNameDiv.textContent = parameter.getName()
      // this.$params.appendChild($paramNameDiv)

      const $paramDiv = document.createElement('div')
      $paramDiv.classList.add('pointer-events-auto')
      const $paramElem = document.createElement(tagName)
      $paramDiv.appendChild($paramElem)
      this.$params.appendChild($paramDiv)
    })
  }
}

/*
<div class="absolute top-36 right-0 p-2 overflow-hidden pointer-events-none ParameterOwnerWidget grid w-120 space-y-2 ">
  {#each items as item (item.index)}
    <div class="flex items-center justify-end mr-2 text-black">
      {item.parameter.getName()}
    </div>
    <div class="pointer-events-auto">
      <svelte:component this={item.component} parameter={item.parameter} />
    </div>
  {/each}
</div>
*/

customElements.define('zea-param-editor', ParamEditor)
export { ParamEditor }
