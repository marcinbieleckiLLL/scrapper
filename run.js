const puppeteer = require('puppeteer');
const searchQuery = 'foodglobal';
const resultHref = 'foodglobal.net';
const maxResult = 100;
const resultsOnOnePage = 10;

(async () => {
    const browser = await puppeteer.launch();
    const browserPage = await browser.newPage();

    await search(browserPage);

    for (let pageNumber = 2; pageNumber < (maxResult / resultsOnOnePage); pageNumber++) {
        await waitForLoad(browserPage);
        await goToNextPage(browserPage, pageNumber);

        let searchResults = await getPageResults(browserPage);
        if (searchResults.find(result => result.url.contains(resultHref))) {
            console.log("FOUNDED ON PAGE " + pageNumber);
            console.log(searchResults);
            await browserPage.screenshot({path: 'screen.png'});
            break;
        }
    }

    await browser.close();
})();

async function search(browserPage) {
    await browserPage.goto('https://google.pl');
    await browserPage.type('input[name="q"]', searchQuery);
    await browserPage.$eval('input[name=btnK]', button => button.click());
}

async function waitForLoad(browserPage) {
    await browserPage.waitForSelector('div[id=search]');
    await browserPage.waitForSelector('div[id=foot]');
}

async function goToNextPage(browserPage, pageNumber) {
    await browserPage.$eval('a[aria-label="Page ' + pageNumber + '"]', button => button.click());
}

async function getPageResults(browserPage) {
    return await browserPage.$$eval('div[id=rso]', results => {
        //Array to hold all our results
        let data = [];
        //console.log(results);
        //Iterate over all the results
        results.forEach(parent => {

            //Check if parent has h2 with text 'Web Results'
            const ele = parent.querySelector('h2');

            //If element with 'Web Results' Title is not found  then continue to next element
            if (ele === null) {
                return;
            }

            //Check if parent contains 1 div with class 'g' or contains many but nested in div with class 'srg'
            let gCount = parent.querySelectorAll('div[class=g]');

            //If there is no div with class 'g' that means there must be a group of 'g's in class 'srg'
            if (gCount.length === 0) {
                //Targets all the divs with class 'g' stored in div with class 'srg'
                gCount = parent.querySelectorAll('div[class=srg] > div[class=g]');
            }

            //Iterate over all the divs with class 'g'
            gCount.forEach(result => {
                console.log(result);
                //Target the title
                const title = result.querySelector('div[class=rc] > div[class=r] > a >  h3').innerText;

                //Target the url
                const url = result.querySelector('div[class=rc] > div[class=r] > a').href;

                //Target the description
                const desciption = result.querySelector('div[class=rc] > div[class=s] > div > span[class=st]').innerText;

                //Add to the return Array
                data.push({title, desciption, url});
            });
        });

        //Return the search results
        return data;
    });
}
