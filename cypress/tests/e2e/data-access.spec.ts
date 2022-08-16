import { DATA_FEDERATION_NAMESPACE, MINUTE, SECOND } from "../../constants/common";
import { AWS_CREDS_EXIST, DATA_SOURCE_INPUTS, Providers, SINGLE_BUCKET_POLICY_WITH_CACHE, TEST_DATA_SOURCE } from "../../constants/tests";
import { BPCommon } from "../../views/bucket-policy";
import { app } from "../../views/common";
import { checkDataSourceCreation, createDataSource, deleteDataSourceResources, deleteUsingDetailsPageKebabMenu, navigateToCreatePage } from "../../views/data-resource";
import { MCGMSCommon } from "../../views/mcg-ms-common";

describe('data source creation test', () => {
    before(() => {
        cy.login();
    });

    beforeEach(() => {
        MCGMSCommon.visitDataSourceListPage();
        navigateToCreatePage();
        app.waitForLoad();
    });

    it('creates a data source having AWS as the provider', () => {
        cy.onlyOn(AWS_CREDS_EXIST);
        createDataSource(
            Providers.AWS,
            TEST_DATA_SOURCE,
            DATA_SOURCE_INPUTS.targetBucket
        );
        checkDataSourceCreation(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
        cy.byTestID(`status-text`).should('contain', 'Ready');
    });
});

describe('Bucket policy creation test', () => {
    before(() => {
        cy.login();
    });

    beforeEach(() => {
        MCGMSCommon.visitBucketPolicyList();
    });

    it('creates Bucket policy with single data source and enabled cache', () => {
        BPCommon.createUsingSingleDSAndNewDataSource(
            SINGLE_BUCKET_POLICY_WITH_CACHE,
            TEST_DATA_SOURCE
        );
        cy.log('Enable Cache');
        cy.byTestID('enable-cache-checkbox').should('be.visible').check();
        BPCommon.confirmCreateBucket();
        BPCommon.checkBucketCreation(SINGLE_BUCKET_POLICY_WITH_CACHE, TEST_DATA_SOURCE);
    });
});

describe('Data access tests', () => {
    before(() => {
        cy.login();
    });

    beforeEach(() => {
        MCGMSCommon.visitBucketPolicyList();
    });

    it('check whether data is accessible from created bucket', () => {
        BPCommon.checkBucketCreation(SINGLE_BUCKET_POLICY_WITH_CACHE, TEST_DATA_SOURCE);
        let endpoint = {}
        let nooba_access_key = {}
        let nooba_secret_key = {}
        cy.byTestID('copy-to-clipboard-button').first().click().then(() => {
            cy.window().then((win) => {
                win.navigator.clipboard.readText().then((text) => {
                    endpoint = text
                });
            });
            cy.exec(`echo ${JSON.stringify(`kubectl get secret ${TEST_DATA_SOURCE}-secret -n ${DATA_FEDERATION_NAMESPACE}`)} | .data.AWS_ACCESS_KEY_ID|@base64d`,
                { failOnNonZeroExit: false }).then((result) => {
                    nooba_access_key = result
                });
            cy.exec(`echo ${JSON.stringify(`kubectl get secret ${TEST_DATA_SOURCE}-secret -n ${DATA_FEDERATION_NAMESPACE}`)} | .data.AWS_SECRET_ACCESS_KEY|@base64d`,
                { failOnNonZeroExit: false }).then((result) => {
                    nooba_secret_key = result
                });
            cy.exec(`alias s3=AWS_ACCESS_KEY_ID=${nooba_access_key} AWS_SECRET_ACCESS_KEY=${nooba_secret_key} aws--endpoint ${endpoint} --no-verify-ssl s3`)
            cy.exec(`s3 cp ${'/home/hchebrol/code/forked-mcg-ms-console/mcg-ms-console/README.md'} s3://{{${SINGLE_BUCKET_POLICY_WITH_CACHE}}}`)
            cy.exec(`s3 ls s3://{{${SINGLE_BUCKET_POLICY_WITH_CACHE}}}`).its('stdout')
                .should('contain', 'Data Federation Console')
        });
    });
});

describe('deletes Bucket policy', () => {
    before(() => {
        cy.login();
    });

    beforeEach(() => {
        MCGMSCommon.visitBucketPolicyList();
    });

    after(() => {
        /**
         * Need some time for BucketClass to get cleaned-up properly before deleting NamespaceStore,
         * else we get an error from server: admission webhook "admissionwebhook.noobaa.io" denied the request:
         * cannot complete because nsr "-data-source" in "IN_USE" state.
         * Even though BucketClass is actually deleted, there is some deplay for it to get reflected for NamespaceStore.
         */
        cy.wait(30 * SECOND);
        deleteDataSourceResources(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
        cy.logout();
    });
    it('deletes created Bucket policy', () => {
        BPCommon.deleteFromDetailsPage(SINGLE_BUCKET_POLICY_WITH_CACHE);
    });
});
