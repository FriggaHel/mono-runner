context('Actions', () => {
  beforeEach(() => {
    cy.visit('https://www.saucedemo.com')
  })

  it('Login #1', () => {
    cy.get('[data-test="username"]').type('standard_user').should('have.value', 'standard_user')
    cy.get('[data-test="password"]').type('secret_sauce')
    cy.get('[data-test="login-button"]').click()

    cy.get('[data-test="product_sort_container"]').should('be.visible');
  })

  it('Login #2', () => {
    cy.get('[data-test="username"]').type('standard_user').should('have.value', 'standard_user')
    cy.get('[data-test="password"]').type('secret_sauce')
    cy.get('[data-test="login-button"]').click()

    cy.get('[data-test="product_sort_container"]').should('be.visible');
  })
})
