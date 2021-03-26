'use strict'

const chalk = require('chalk');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const {
  getReport,
  getDate,
  getAllSG,
  scraperCanRun
} = require('./utils/utils.js')
const {
  createSiteGenerators,
  updateScraper
} = require('./utils/query.js')

let report = {}
let errors = []
let newSG = 0

const scrape = async (allSG, scraper) => {
  const url = "https://jamstack.org/generators/"
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto(url)
  } catch (e) {
    console.log(`${chalk.red("Error")}: (${url})`);
    errors.push({
      context: "Page navigation",
      url: url,
      date: await getDate()
    })
    return
  }

  const expression = "//div[@class='generator-card flex flex-col h-full']"
  const elements = await page.$x(expression);
  await page.waitForXPath(expression, { timeout: 3000 })

  const promise = new Promise((resolve, reject) => {
    elements.forEach(async (element) => {
      let card = await page.evaluate(el => el.innerHTML, element);
      let $ = cheerio.load(card)
      const name = $('.text-xl').text().trim() || null;
			// Skip this iteration if the sg is already in db
      if (allSG.includes(name))
        return;
      const stars = $('span:contains("stars")').parent().text().replace("stars", "").trim() || null;
      const forks = $('span:contains("forks")').parent().text().replace("forks", "").trim() || null;
      const issues = $('span:contains("issues")').parent().text().replace("issues", "").trim() || null;
      const description = $('.text-sm.mb-4').text().trim() || null;
      const language = $('dt:contains("Language:")').next().text().trim() || null;
      const template = $('dt:contains("Templates:")').next().text().trim() || null;
      const license = $('dt:contains("License:")').next().text().trim() || null;
      const deployLink = $('a:contains("Deploy")').attr('href') || null;

      await createSiteGenerators(
        name,
        stars,
        forks,
        issues,
        description,
        language,
        template,
        license,
        deployLink,
        scraper
      )
      newSG += 1;
    });
  });

  promise.then(async () => {
    await page.close()
    await browser.close();
  });
}

const main = async () => {
  // Fetch the correct scraper thanks to the slug
  const slug = "jamstack-org"
  const scraper = await strapi.query('scraper').findOne({
    slug: slug
  });

  // If the scraper doesn't exists, is disabled or doesn't have a frequency then we do nothing
  if (scraper == null || !scraper.enabled || !scraper.frequency){
    console.log(`${chalk.red("Exit")}: (Your scraper may does not exist, is not activated or does not have a frequency field filled in)`);
    return
  }

  const canRun = await scraperCanRun(scraper);
  if (canRun && scraper.enabled){
    const allSG = await getAllSG(scraper)
    await scrape(allSG, scraper)
    report = await getReport(newSG);
    await updateScraper(scraper, report, errors)
  }
}

exports.main = main;
