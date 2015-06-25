////////////////////////////////////////////////////////////////////////////////
// Global Variables

var viz, workbook, activeSheet;
var url = "http://sarnold_train/views/WorldIndicators/GDPperCapitaDashboard";

////////////////////////////////////////////////////////////////////////////////
// 1 - Create a View

// This is jQuery's way of doing something when the page is done loading.
// We're initializing a dialog that will be used later in the tutorial (don't
// worry about this) and then we're doing the magic of creating the viz.
$(function () {
  $("#dialog").dialog({
    autoOpen: false,
    closeOnEscape: true,
    maxHeight: 400
  });

  // Create the viz after the page is done loading
  initializeViz();
});

function initializeViz() {
  var placeholderDiv = $("#tableauViz");
  var options = {
    hideTabs: false,
    hideToolbar: true,
    width: placeholderDiv.parent().innerWidth(),
    height: placeholderDiv.parent().innerHeight(),
    onFirstInteractive: function () {
      workbook = viz.getWorkbook();
      activeSheet = workbook.getActiveSheet();
    }
  };
  viz = new tableau.Viz(placeholderDiv.get(0), url, options);
}

////////////////////////////////////////////////////////////////////////////////
// 2 - Filter

function filterSingleValue() {
  // Filter to "The Americas" in the "Region" field
  activeSheet.applyFilterAsync(
    "Region",
    "The Americas",
    tableau.FilterUpdateType.REPLACE);
}

function addValuesToFilter() {
  // Add "Europe" and "Middle East" to the "Region" filter
  activeSheet.applyFilterAsync(
    "Region",
    ["Europe", "Middle East"],
    tableau.FilterUpdateType.ADD);
}

function removeValuesFromFilter() {
  // Remove "Europe" from the "Region" filter
  activeSheet.applyFilterAsync(
    "Region",
    "Europe",
    tableau.FilterUpdateType.REMOVE);
}

function filterRangeOfValues() {
  // Filter on the "F: GDP per capita (curr $)" field, showing everything
  // between $40,000 and $60,000 (inclusive).
  activeSheet.applyRangeFilterAsync(
    "F: GDP per capita (curr $)",
    {
      min: 40000,
      max: 60000
    },
    tableau.FilterUpdateType.REPLACE);
}

function clearFilters() {
  // Clear the "Region" field's filter and the "F: GDP per capita (curr $)" filter.
  activeSheet.clearFilterAsync("Region");
  activeSheet.clearFilterAsync("F: GDP per capita (curr $)");
}

////////////////////////////////////////////////////////////////////////////////
// 3 - Switch Tabs

function switchToMapTab() {
  // Switch to the "GDP per capita map" worksheet.
  workbook.activateSheetAsync("GDP per capita map");
}

////////////////////////////////////////////////////////////////////////////////
// 4 - Select

function selectSingleValue() {
  // Select all of the marks that are in "Asia" in the "Region" field.
  workbook.getActiveSheet().selectMarksAsync(
    "Region",
    "Asia",
    tableau.SelectionUpdateType.REPLACE);
}

function addValuesToSelection() {
  // Add "Africa" and "Oceania" to the "Region" filter.
  workbook.getActiveSheet().selectMarksAsync(
    "Region",
    ["Africa", "Oceania"],
    tableau.SelectionUpdateType.ADD);
}

function removeFromSelection() {
  // Remove all of the areas where the average GDP is < 5000.
  // The field name is "AVG(F: GDP per capita (curr $))".
  workbook.getActiveSheet().selectMarksAsync(
    "AVG(F: GDP per capita (curr $))",
    {
      max: 5000
    },
    tableau.SelectionUpdateType.REMOVE);
}

function clearSelection() {
  // Clear the selected marks on the active sheet.
  workbook.getActiveSheet().clearSelectedMarksAsync();
}

////////////////////////////////////////////////////////////////////////////////
// 5 - Chain Calls

function triggerError() {
  workbook.activateSheetAsync("GDP per capita by region")
    .then(function (newSheet) {
      // Do something that will cause an error: leave out required parameters.
      return activeSheet.applyFilterAsync("Date (year)");
    })
    .otherwise(function (err) {
      alert("We purposely triggered this error to show how error handling happens with chained calls.\n\n " + err);
    });
}

function switchTabsThenFilterThenSelectMarks() {
  // Bonus: try doing the following things in this order. Remember to use "then"
  // to chain calls together and to "return" from within each "then" function.
  // 1) Activate the "GDP per capita by region" sheet
  // 2) Apply a range filter to "Date (year)" between 1/1/2002 and 12/31/2008.
  //    These should be JavaScript Date values and should be in UTC. Hint: use
  //    new Date(Date.UTC(year, month, day)).
  // 3) Select all of the marks where the "GDP per capita (weighted)" is
  //    greater than $20,000. Hint: Remember that you have to use an aggregated
  //    field, so use "AGG(fieldName)" as the field name.
  workbook.activateSheetAsync("GDP per capita by region")
    .then(function (newSheet) {
      activeSheet = newSheet;

      // It's important to return the promise so the next link in the chain
      // won't be called until the filter completes.
      return activeSheet.applyRangeFilterAsync(
        "Date (year)",
        {
          min: new Date(Date.UTC(2002, 1, 1)),
          max: new Date(Date.UTC(2008, 12, 31))
        },
        tableau.FilterUpdateType.REPLACE);
    })
    .then(function (filterFieldName) {
      return activeSheet.selectMarksAsync(
        "AGG(GDP per capita (weighted))",
        {
          min: 20000
        },
        tableau.SelectionUpdateType.REPLACE);
    });
}

////////////////////////////////////////////////////////////////////////////////
// 6 - Sheets

// This is a utility function to iterate over all of the specified sheets
// and creating a list of sheet information to show in an alert box or to
// log to the console.
function getSheetsAlertText(sheets) {
  var alertText = [];

  for (var i = 0, len = sheets.length; i < len; i++) {
    var sheet = sheets[i];
    alertText.push("  Sheet " + i);
    alertText.push(" (" + sheet.getSheetType() + ")");
    alertText.push(" - " + sheet.getName());
    alertText.push("\n");
  }

  return alertText.join("");
}

function querySheets() {
  var sheets = workbook.getPublishedSheetsInfo();
  var text = getSheetsAlertText(sheets);
  text = "Sheets in the workbook:\n" + text;
  alert(text);
}

function queryDashboard() {
  // Notice that the filter is still applied on the "GDP per capita by region"
  // worksheet in the dashboard, but the marks are not selected.
  workbook.activateSheetAsync("GDP per Capita Dashboard")
    .then(function (dashboard) {
      var worksheets = dashboard.getWorksheets();
      var text = getSheetsAlertText(worksheets);
      text = "Worksheets in the dashboard:\n" + text;
      alert(text);
    });
}

function changeDashboardSize() {
  workbook.activateSheetAsync("GDP per Capita Dashboard")
    .then(function (dashboard) {
      dashboard.changeSizeAsync({
        behavior: tableau.SheetSizeBehavior.AUTOMATIC
      });
    });
}

function changeDashboard() {
  var alertText = [
    "After you click OK, the following things will happen: ",
    "  1) Region will be set to Middle East.",
    "  2) On the map, the year will be set to 2010.",
    "  3) On the bottom worksheet, the filter will be cleared.",
    "  4) On the bottom worksheet, the year 2010 will be selected."
  ];
  alert(alertText.join("\n"));

  var dashboard, mapSheet, graphSheet;
  workbook.activateSheetAsync("GDP per Capita Dashboard")
    .then(function (sheet) {
      dashboard = sheet;
      mapSheet = dashboard.getWorksheets().get("Map of GDP per capita");
      graphSheet = dashboard.getWorksheets().get("GDP per capita by region");
      return mapSheet.applyFilterAsync("Region", "Middle East", tableau.FilterUpdateType.REPLACE);
    })
    .then(function () {
      // Do these two steps in parallel since they work on different sheets.
      mapSheet.applyFilterAsync("YEAR(Date (year))", 2010, tableau.FilterUpdateType.REPLACE);
      return graphSheet.clearFilterAsync("Date (year)");
    })
    .then(function () {
      return graphSheet.selectMarksAsync("YEAR(Date (year))", 2010, tableau.SelectionUpdateType.REPLACE);
    });
}

////////////////////////////////////////////////////////////////////////////////
// 7 - Control the Toolbar

function exportPDF() {
  viz.showExportPDFDialog();
}

function exportImage() {
  viz.showExportImageDialog();
}

function exportCrossTab() {
  viz.showExportCrossTabDialog();
}

function exportData() {
  viz.showExportDataDialog();
}

function revertAll() {
  workbook.revertAllAsync();
}

////////////////////////////////////////////////////////////////////////////////
// 8 - Events

function listenToMarksSelection() {
  // Tell the viz that we want to be notified whenever a mark is selected (or deselected).
  viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, onMarksSelection);
}

function onMarksSelection(marksEvent) {
  return marksEvent.getMarksAsync().then(reportSelectedMarks);
}

// This is a utility function that gathers all of the marks and creates a string
// reporting information on each mark.
function reportSelectedMarks(marks) {
  var html = [];
  for (var markIndex = 0; markIndex < marks.length; markIndex++) {
    var pairs = marks[markIndex].getPairs();
    html.push("<b>Mark " + markIndex + ":</b><ul>");
    for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
      var pair = pairs[pairIndex];
      html.push("<li><b>fieldName:</b> " + pair.fieldName);
      html.push("<br/><b>formattedValue:</b> " + pair.formattedValue + "</li>");
    }
    html.push("</ul>");
  }

  var dialog = $("#dialog");
  dialog.html(html.join(""));
  dialog.dialog("open");
}

function removeMarksSelectionEventListener() {
  // Stop listening to marks selection events.
  viz.removeEventListener(tableau.TableauEventName.MARKS_SELECTION, onMarksSelection);
}
