import { DATA_FEDERATION_NAMESPACE } from '../constants/common';
import { BUCKET_CLAIM_NAME } from '../constants/tests';
import { projectNameSpace } from '../views/common';
import {
  createObjectBucketClaim,
  deleteObjectClaimResources,
} from '../views/object-bucket-claims';

describe('Object Bucket Claims page', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.clickNavLink(['Storage', 'Object Bucket Claims']);
  });

  after(() => {
    cy.logout();
  });
  it('creates an Object Bucket Claim outside of redhat-data-federation namespace', () => {
    createObjectBucketClaim(BUCKET_CLAIM_NAME);
  });

  it('deletes an Object Bucket Claim', () => {
    deleteObjectClaimResources(BUCKET_CLAIM_NAME);
  });

  it('creates an Object Bucket Claim inside of redhat-data-federation namespace', () => {
    projectNameSpace.selectOrCreateProject(DATA_FEDERATION_NAMESPACE);
    createObjectBucketClaim(BUCKET_CLAIM_NAME);
    deleteObjectClaimResources(BUCKET_CLAIM_NAME);
  });
});
