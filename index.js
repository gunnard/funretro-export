const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

var params = require('./data.json');
var [url, file, fileType] = process.argv.slice(2);
var fileTypes = ['txt', 'csv'];
let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();
console.clear();
console.log(`
___________                          
\\_   _____/_ __  ____                
 |    __)|  |  \\/    \\               
 |     \\ |  |  /   |  \\              
 \\___  / |____/|___|  /              
     \\/             \\/               
__________        __                 
\\______   \\ _____/  |________  ____  
 |       _// __ \\   __\\_  __ \\/  _ \\ 
 |    |   \\  ___/|  |  |  | \\(  <_> )
 |____|_  /\\___  >__|  |__|   \\____/ 
        \\/     \\/                    `);

console.log('Usage: npm start -- "url" "filename" "filetype"');
console.log('leave option "" for default if needed');
console.log('FileTypes: 1) txt (default)');
console.log('           2) csv');
console.log('Default values are found in -> data.json <-');
console.log('--=======================================--');

if (!url) {
	url = params.url;
	console.log('No URL specified, using: ' + url);
}

if (!fileType) {
	fileType = params.fileType;
	fileType = fileType.toLowerCase();
	if (fileTypes.indexOf(fileType) == -1) {
		console.log('Invalid File Type ' + fileType + '. Please use "txt" or "csv"');
	}
}

if (!file) {
	file = params.file + "-" + year + "-" + month + "-" + date + "-" + hours + minutes + seconds;
	console.log('No file name specified, using: '+ file);
}

console.log('--=======================================--');
console.log('using ' + file + "." + fileType + " as output file");

//process.exit();
async function makeTxt(columns,parsedText) {
  for (let i = 0; i < columns.length; i++) {
    const columnTitle = await columns[i].$eval('.column-header', (node) => node.innerText.trim());

    const messages = await columns[i].$$('.message-main');
    if (messages.length) {
      parsedText += columnTitle + '\n';
    }
    for (let i = 0; i < messages.length; i++) {
      const votes = await messages[i].$eval('.votes .vote-area span.show-vote-count', (node) => node.innerText.trim());
	  if (votes > 0) {
      const messageText = await messages[i].$eval('.message-body .text', (node) => node.innerText.trim());
      parsedText += `- ${messageText} (${votes})` + '\n';
	  }
    }

    if (messages.length) {
      parsedText += '\n';
    }
  }
  console.log("------------------------------");
  console.log(parsedText);
  console.log("------------------------------");
  return parsedText;
}

function makeCsv() {
	console.log('CSV FILE');
}
async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitForSelector('.message-list');

  const boardTitle = await page.$eval('#board-name', (node) => node.innerText.trim());

  if (!boardTitle) {
    throw 'Board title does not exist. Please check if provided URL is correct.'
  }

  let parsedText = boardTitle + '\n\n';

  const columns = await page.$$('.message-list');

  switch(fileType) {
	case 'txt':
	  parsedText = makeTxt(columns,parsedText);
	  console.log(parsedText);
    break;

	case 'csv':
	  parsedText += makeCsv();
    break;
  }
  file = file + "." + fileType;
  return parsedText;
}

function writeToFile(filePath, data) {
  const resolvedPath = path.resolve(filePath || `../${data.split('\n')[0].replace('/', '')}`);
  fs.writeFile(resolvedPath, data, (error) => {
    if (error) {
      throw error;
    } else {
      console.log(`Successfully written to file at: ${resolvedPath}`);
    }
    process.exit();
  });
}

function handleError(error) {
  console.error(error);
}

run().then((data) => writeToFile(file, data)).catch(handleError);
