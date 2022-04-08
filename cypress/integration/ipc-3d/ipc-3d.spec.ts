/// <reference types="cypress" />

// ipc-3d.spec.ts created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

describe('IPC-3D app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8000/test-e2e/')
  })

  it('has an empty asset indicator label by default', () => {
    cy.get('#assetIndicator').should('be.empty')
  })

  it('updates the indicator label after an asset is loaded', () => {
    cy.get('#loadGearbox').click()

    cy.get('#assetIndicator').should('have.text', 'GEAR_BOX_FINAL_ASM')
  })
})
