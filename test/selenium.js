const webdriver = require( 'selenium-webdriver' );
const path = require( 'path' );
const chai = require( 'chai' );
const expect = chai.expect;

const getTestPath = fileName => {
	if ( process.env.SAUCE_USERNAME != undefined ) {
		return `http://localhost:8000/test/${ fileName }`;
	} else {
		return `file://${ path.resolve( __dirname, fileName ) }`;
	}
};
const SauceLabs = require( 'saucelabs' );

describe( `Test Diaspora in the browser (${ process.env.BROWSER_NAME || 'chrome' })`, function() {
	this.timeout( 20000 );
	let browser;
	let passed;
	let saucelabs = new SauceLabs({
		username: process.env.SAUCE_USERNAME,
		password: process.env.SAUCE_ACCESS_KEY,
	});

	beforeEach(() => {
		let ret;
		passed = false;
		if ( process.env.SAUCE_USERNAME != undefined ) {
			browser = new webdriver.Builder()
				.usingServer( `http://${  process.env.SAUCE_USERNAME  }:${  process.env.SAUCE_ACCESS_KEY  }@ondemand.saucelabs.com:80/wd/hub` )
				.withCapabilities({
					'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
					build:               `SequentialEvent n°${ process.env.TRAVIS_BUILD_NUMBER }`,
					username:            process.env.SAUCE_USERNAME,
					accessKey:           process.env.SAUCE_ACCESS_KEY,
					browserName:         process.env.BROWSER_NAME,
				}).build();
		} else {
			browser = new webdriver.Builder()
				.withCapabilities({
					browserName: 'chrome',
				}).build();
		}
	});

	afterEach(() => {
		if ( process.env.SAUCE_USERNAME != undefined ) {
			return browser.getSession().then( session => {
				return saucelabs.updateJob( session.getId(), {
					passed,
					name: `SequentialEvent Browser build on ${ process.env.BROWSER_NAME }`,
				});
			}).catch( e => {
				console.error( e );
				return Promise.reject( e );
			}).finally(() => {
				return browser.quit();
			});
		} else {
			return browser.quit();
		}
	});

	it( 'Browser testrunner should be OK', () => {
		return browser.get( getTestPath( 'browser/testrunner.html' )).then(() => {
			return browser.findElements(webdriver.By.xpath('//*[@id="mocha-report"]/*'));
		}).then(reportChildren => {
			expect(reportChildren).to.have.lengthOf.above(0);
			return browser.findElements( webdriver.By.className( 'fail' ));
		}).then( failed => {
			expect( failed ).to.have.lengthOf( 0 );
			passed = true;
		});
	});
});
