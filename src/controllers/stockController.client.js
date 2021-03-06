var socket,
    keys = [],
    data = [],
    selected = [false, false, false, false, true];

$(document).ready(function () {
  socket = io('/stocks-ns');

  generateChartData();
  connectAddStock();
  connectRemoveStock();
  connectInvalidSymbol();
});

function connectAddStock() {
  socket.on('add stock', function(d){
    var description;

    if (d.dataset_code && d.data && d.name) {
      description = d.name.split(" (")[0];
      $('#t-c').append(`
        <div class="col-6 col-sm-6 col-md-4 my-1 stock-info" id="${d.dataset_code}">
          <button class="btn" type="button" onclick={handleRemove("${d.dataset_code}")}>X</button>
          ${d.dataset_code} - ${description}
        </div>`)

      d.data.forEach(function (item) {
        data.forEach(function (v) {
          if (v.date === item[0]) v[`${d.dataset_code}`]=item[4]
        })
      })
      keys.push(d.dataset_code);
    }

    makeChart();
  });
}

function generateChartData() {
  var firstDate = new Date();
  firstDate.setDate(firstDate.getDate() - (365 * 5));
  firstDate.setHours(0, 0, 0, 0);

  for (var i = 0; i < (365 * 5); i++) {
    var d = new Date(firstDate);

    d.setDate(d.getDate() + i);

    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    var nd = [year, month, day].join('-');

    data.push({ date: nd });
  }
}

function connectRemoveStock() {
  socket.on('remove stock', function(d){
    for (var i = 0; i < data.length; i++) {
      if(keys[i] === d) {
        keys.splice(i, 1);
        break;
      }
    }

    if (keys.length === 0) data = [];
    else {
      data.forEach(function(v) {
        delete v[`${d}`];
      });
    }

    $(`#${d}`).remove();

    makeChart();
  });
}

function connectInvalidSymbol() {
  socket.on('invalid symbol', function(d){
    console.log(`d is an invalid symbol`);
  })
}

function handleAdd() {
  var s = $("#s-i").val();
  if (s.length > 0 && s.length < 6) {
    socket.emit('add stock', s.toUpperCase());
    $("#s-i").val("");
  }
}

function handleRemove(symbol) {
  socket.emit('remove stock', symbol.toUpperCase());
}

function makeChart() {
  var fieldMappings = [],
      stockGraphs = [];

  for (var i = 0; i < keys.length; i++) {
    var fM = {
      "fromField": keys[i],
      "toField": keys[i]
    };
    var sG = {
        "id": `g-${keys[i]}`,
        "title": keys[i],
        "lineThickness": 2,
        "valueField": keys[i],
        "useDataSetColors": false
    };

    fieldMappings.push(fM);
    stockGraphs.push(sG);
  }

  var chart = AmCharts.makeChart("g-c", {
    type: "stock",
    "theme": "light",
    "dataSets": [{
      "fieldMappings": fieldMappings,
      "dataProvider": data,
      "categoryField": "date"
    }],

    "panels": [{
      "title": "Price (USD)",
      "stockLegend": {
        "periodValueTextComparing": "[[value.close]]",
        "periodValueTextRegular": "[[value.close]]"
      },
      "stockGraphs": stockGraphs
    }],

    "chartScrollbarSettings": {
      "graph": "g1"
    },

    "chartCursorSettings": {
      "valueBalloonsEnabled": true,
      "fullWidth": true,
      "cursorAlpha": 0.1,
      "valueLineBalloonEnabled": true,
      "valueLineEnabled": true,
      "valueLineAlpha": 0.5
    },

    "periodSelector": {
      "position": "top",
      "periodsText": "Timeframe: ",
      "inputFieldsEnabled": false,
      "periods": [
        {
          "period": "DD",
          "selected": false,
          "count": 7,
          "label": "Day"
        }, {
          "period": "MM",
          "selected": false,
          "count": 1,
          "label": "Month"
        }, {
          "period": "YYYY",
          "selected": false,
          "count": 1,
          "label": "Year"
        }, {
          "period": "YTD",
          "selected": false,
          "label": "YTD"
        }, {
          "period": "MAX",
          "selected": true,
          "label": "MAX"
        }
      ]
    }
  });

}
