export const createObjectBucketClaim = (bucketClaimName: string) => {
  cy.log(`creating object bucket claim`);
  cy.intercept('/api/kubernetes/apis/storage.k8s.io/v1/storageclasses*').as(
    'listStorageClasses'
  );
  cy.byTestID('item-create').click();
  cy.wait('@listStorageClasses');
  cy.log(`entering data source name as ${bucketClaimName}`);
  cy.byTestID('obc-name').type(bucketClaimName);
  cy.byTestID('sc-dropdown-toggle').click();
  cy.byTestID('sc-dropdown').find('li').first().click();
  cy.byTestID('obc-create').click();
  cy.byTestSelector('details-item-value__Name').should(
    'contain',
    bucketClaimName
  );
  cy.byTestID('status-text').should('contain', 'Bound');
};

export const deleteObjectClaimResources = (bucketClaimName: string) => {
  cy.byLegacyTestID(bucketClaimName).first().click();
  cy.byTestID('details-actions').find('button').click();
  cy.byTestID('details-actions').find('li').last().click();
  cy.byTestID('delete-action').click();
  cy.byLegacyTestID(bucketClaimName).should('not.exist');
};
