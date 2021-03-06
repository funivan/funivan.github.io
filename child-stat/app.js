$(document).ready(function () {


  var timeDiff = function (timeStart, timeEnd) {
    var hourDiff = timeEnd - timeStart; //in ms

    var minDiff = hourDiff / 60 / 1000; //in minutes
    var hDiff = hourDiff / 3600 / 1000; //in hours

    var hours = Math.floor(hDiff);
    var minutes =  Math.floor(minDiff - 60 * hours);


    if (hours == 0) {
      return minutes + 'm';
    }

    return hours + ':' + minutes;
  }

  if (window.location.href.indexOf('http://') === 0 && window.location.host.indexOf('127.0.0.1') !== 0) {
    window.location = window.location.href.replace('http://', 'https://');
  }

  // Be sure to use your own app key so you can set up your own redirect URI.
  var APP_KEY = 'q0pa3lmetgckf2i';

  var client = new Dropbox.Client({key: APP_KEY});

  // Use a pop-up for auth.
  client.authDriver(new Dropbox.AuthDriver.Popup({receiverUrl: window.location.href + 'oauth_receiver.html'}));


  // First check if we're already authenticated.
  client.authenticate({interactive: false});

  if (client.isAuthenticated()) {
    // If we're authenticated, update the UI to reflect the logged in status.
    loggedIn();
  } else {
    // Otherwise show the login button.
    $('#login').show();
  }

  function showLoader() {
    $('.data-rows').html('<div class="progress"><div class="indeterminate"></div></div>');
  }

  $('#login-link').click(function () {
    client.authenticate(function (err) {
      if (err) {
        alert('Error: ' + err);
        return;
      }
      loggedIn();
    });
  });

  function loggedIn() {
    $('#login').hide();
    showLoader();
    $('.buttons').show();
    $('.js-date-results').show();

    var dataStoreManager = client.getDatastoreManager();

    dataStoreManager.openDefaultDatastore(function (err, datastore) {
        if (err) {
          alert('Error: ' + err);
          return;
        }

        var add = function (type) {
          table.insert({
            type: type,
            time: (new Date()).toString(),
          });
        }


        // Make sure we use the "max" resolution rule to resolve conflicts about which level we're on.
        var table = datastore.getTable('child-stat-test');
        // table.setResolutionRule('level', 'max');

        $('body').on('click', '.js-delete-row', function (e) {

          e.preventDefault();
          var $el = $(this);
          var id = $el.data('id')
          console.log(id);
          var record = table.get(id)

          record.deleteRecord();

          $el.parent().parent().remove();

          return false;
        })

        $('.button').click(function () {
          var type = $(this).data('type')
          add(type);
          return false;
        })


        var updateResultTable = function () {
          var showDates = {
            water: 0,
            eat: 0,
            beep: 0
          }

          $('.data-rows').html('')

          var records = table.query();
          var limit = 20;
          var max = records.length - 1;

          var rows = '';
          for (var i = max; i >= 0; i--) {

            if (limit == 0) {
              break;
            }

            limit--;

            var record = records[i];
            var fields = record.getFields();

            var date = new Date(fields.time);

            var type = fields.type;


            var dateInfo = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();

            if (showDates.hasOwnProperty(type) && showDates[type] == 0) {
              dateInfo = dateInfo + ' ('+timeDiff(date,  new Date())+')';
              showDates[type] = 1;
            }

            rows = rows
              + '<tr>'
              + '<td>'
              + type
              + '</td>'
              + '<td>'
              + dateInfo
              + '</td>'

              + '<td>'
              + '<a class="js-delete-row" href="#" data-id="' + record.getId() + '" >del</a>'
              + '</td>'


              + '</tr>';

          }
          $('.data-rows').append('<table class="striped" >' +
            '<thead>' +
            '<tr>' +
            '<th data-field="id">Name</th>' +
            '<th data-field="date">Date</th>' +
            '<th data-field="actions">Action</th>' +
            '</tr>'
            + '</thead>'
            + '<tbody>'


            + rows
            + '</tbody>'
            + '</table>');
        }

        datastore.recordsChanged.addListener(updateResultTable);

        updateResultTable();


        $('#logout').show().click(function (e) {
          client.signOut();

          $('#login').show();
          $('.js-date-results').hide();
          $('#logout').hide();
          showLoader();

          e.preventDefault();
        });
      }
    )
    ;
  }
})