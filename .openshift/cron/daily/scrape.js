// load dependencies
var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs');

var curDate = new Date(),
    curUnix = curDate.getTime();



var shows = [];
function Show(artist, date, venue, tickets, image, url) {
  this.artist = artist;
  this.date = date;
  this.venue = venue;
  this.tickets = tickets;
  this.image = image;
  this.url = url;
}

function ShowsData(timestamp, shows) {
  this.timestamp = timestamp;
  this.shows = shows;
}
var showsData = {};
showsData.timestamp = curUnix;
showsData.shows = [];

// function Venue(name, address, url) {
//   this.name = name;
//   this.address = address;
//   this.url = url;
// }

var initScrape = function(url, oncomplete) {
  request( url, function( err, resp, body ) {
    if ( err ) {
      throw err;
    }
    // console.log(url);
    var html = cheerio.load(body);
    oncomplete(html);
  } );
}
var scrapeCount = 0;

var scrape = {
  write: function() {
    var prettyShows = JSON.stringify(showsData, null, 4),
        fileName = 'shows.json';
    fs.writeFile( fileName, prettyShows, function(err) {
      if (err) {
        return console.log(err);
      }
      console.log("BASSBOT COMPLETE");
      // fs.rename('shows.json', './public/shows.json', function(err) {
      //   if (err) {
      //     return console.log(err);
      //   }
      //   console.log("BASSBOT COMPLETE");
      // });
    });
  },
  done: function() {
    scrapeCount++;
    if ( scrapeCount == 2 ) {
      scrape.write();
    }
  },
  init: function() {
    scrape.source.abstractearth();
    scrape.source.redcube();
  },
  source: {
    abstractearth: function() {
      initScrape( 'http://www.abstractearthproject.com', function($) {
        var $shows = $('.hentry'),
            showsLength = $shows.length;

        for ( var ii = 0; ii < showsLength; ii++ ) {
          var $curShow = $($shows[ii]),
              showData = new Show();

          showData.artist = $curShow
            .find('.artist-info p')
            .map(function(i, el) {
              return $(this).text().replace(/\s+/g,' ').trim();
            }).get().join(', ');

          showData.date = $curShow
            .find('.show-date')
            .map(function(i, el) {
              return $(this).text();
            }).get().join(' ');

          showData.image = $curShow
            .find('.wp-post-image')
            .attr('src');

          showData.venue = $curShow
            .find( $('.venue-name a') )
            .text();

          showData.tickets = $curShow
            .find( $('.buy-tickets .buy-tickets') )
            .attr('href');

          showData.url = $curShow
            .find('.more-info')
            .attr('href');

          showsData.shows.push(showData);
        }
        scrape.done();
      } );
    },
    redcubeSubRequest: function(showData) {
      initScrape( showData.url, function($) {

        showData.date = $('.pix-post-options time')
          .map(function(i, el) {
            return $(this).text().replace(/\s+/g,' ').trim();
          }).get().join(', ');

        showData.venue = $($('.pix-post-options li')[1])
          .text()
          .replace( '@', '' );

        var rawImgSrc = $('figure img')
              .attr('src'),
              qIndex = rawImgSrc.indexOf('?');
        showData.image = rawImgSrc
          .substring(0, qIndex != -1 ? qIndex : rawImgSrc.length);

        // if the venue name is in the excludedVenues array
        // do not add the event to the list
        var excludedVenues = [
          'Cuthbert Amphitheater'
        ];
        if ( excludedVenues.indexOf(showData.venue) == -1 ) {
          showsData.shows.push(showData);
        }
      } );
    },
    redcube: function() {
      initScrape( 'http://www.redcubepdx.net/upcoming-events', function($) {
        var $shows = $('.hentry'),
            showsLength = $shows.length;

        for ( var ii = 0; ii < showsLength; ii++ ) {
          var $curShow = $($shows[ii]),
              showData = new Show();


          showData.artist = $curShow
            .find('.pix-post-title a')
            .text();

          showData.url = $curShow
            .find('.pix-post-title a')
            .attr('href');

          showData.tickets = $curShow
            .find('.ext-link')
            .attr('href');

          scrape.source.redcubeSubRequest(showData);

        }
        scrape.done();
      } );
    }
  }
}

scrape.init();


// var testDate = 'Sat May 23',
//     unixDate = Date.parse(testDate),
//     date = new Date(unixDate*1000);

// console.log( 'date: ' + date.getDate() );
// console.log( 'year: ' + date.getYear() );
// console.log( 'month: ' + months[date.getMonth()] );