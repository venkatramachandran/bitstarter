#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var urllib = require('url');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://vast-anchorage-9853.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertValidUrl = function(url) {
  var urlobj = urllib.parse(url.toString());
  if(urlobj == null)
	{
	  console.log("%s is an invalid URL",url);
	  process.exit(1);
	}
  };

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkUrl = function(url,checksfile) {
  var urlstring = url.toString();
  restler.get(urlstring).on('complete', function(result)
                      {
                        if (result instanceof Error)
                        {
							console.log("%s is not a valid url.", urlstring);
                        }
						else
						{
							var checks = loadChecks(checksfile).sort();
							var h = cheerio.load(result.toString());
							var out = {};
							for(var ii in checks) {
								var present = h(checks[ii]).length > 0;
								out[checks[ii]] = present;
							}
							var outJson = JSON.stringify(out, null,4);
							console.log(outJson);
						}
                      }
                     )
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

if(require.main == module) {
    program
        .option('-c, --checks ', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file ', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
        .option('-u, --url ', 'URL to index.html', assertValidUrl, URL_DEFAULT)
        .parse(process.argv);
	if (program.file != null)
	{
		var checkJson =  checkHtmlFile(program.file, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
	}
	else
	{
		var checkJson = checkUrl(program.url, program.checks);
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
	exports.checkUrl = checkUrl;
}
