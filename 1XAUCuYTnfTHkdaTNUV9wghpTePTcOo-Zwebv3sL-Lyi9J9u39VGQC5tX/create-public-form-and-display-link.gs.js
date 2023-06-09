/**
 * Google Script URL: https://script.google.com/u/4/home/projects/1XAUCuYTnfTHkdaTNUV9wghpTePTcOo-Zwebv3sL-Lyi9J9u39VGQC5tX
 *
 * Please do not edit this file directly in the scripts.google.com editor.
 * Instead, edit it via the checked in clasp file found here:
 *
 * https://github.com/drewdrewthis/positive-blockchain-app-scripts/blob/main/1XAUCuYTnfTHkdaTNUV9wghpTePTcOo-Zwebv3sL-Lyi9J9u39VGQC5tX/create-public-form-and-display-link.gs.js
 */

const SPREADSHEET_ID = "1-Imie1YgTv4cRGmDTSQWoFgDxiUqmgFfnDLEfFcbCGg";
const SHEET_NAME = "CSV Template v2";
const DESTINATION_SPREADSHEET_FOLDER_ID = "1ZLZJzQvI1dgeWvGHIcjIFv57uwPOut7Y";

/**
 * Copies the submitted form data to a new sheet with public columns, makes the new sheet public, and sets a confirmation message for the form.
 *
 * @param {Object} e - The event object representing the form submission.
 */
function onSubmit(e) {
  const form = FormApp.getActiveForm();
  const newSheet = copySheetWithPublicColumns();
  const spreadsheet = newSheet.getParent();
  makeSpreadsheetPublic(spreadsheet);
  // Delete the first 5 rows, as they are for internal use only and not meant for the public
  spreadsheet.deleteRows(1, 5);
  const sheetUrl = spreadsheet.getUrl();
  SpreadsheetApp.flush();
  console.log(sheetUrl);
  const message =
    "Thank you for your submission! The following link will open up a GoogleSheet with a readonly version of the data snapshot. From this sheet you can download the data in any way you need (CSV, XLSX, etc). " +
    sheetUrl;
  form.setConfirmationMessage(message);
}

/**
 * Copies the specified sheet with public columns to a new sheet.
 *
 * @returns {Sheet} The newly created sheet with public columns.
 */
function copySheetWithPublicColumns() {
  const sheetToCopy =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

  if (!sheetToCopy) {
    throw new Error(
      "Failed to get sheet to copy. Please check that constants are still valid."
    );
  }

  const publicColumnsIndexes = getPublicColumns(sheetToCopy);
  const newSheet = createNewSheet();
  copyDataToNewSheet(sheetToCopy, newSheet, publicColumnsIndexes);
  deleteColumnsExcept(newSheet, publicColumnsIndexes);
  return newSheet;
}

/**
 * Retrieves the column indices of public columns in the specified sheet.
 *
 * @param {Sheet} sheet - The sheet to retrieve public column indices from.
 * @returns {number[]} An array of column indices representing public columns.
 */
function getPublicColumns(sheet) {
  if (sheet === null) throw new Error("sheet is null");

  const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  const publicColumns = [];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].startsWith("PUBLIC_")) {
      publicColumns.push(i + 1); // add 1 to account for 0-based indexing
    }
  }
  return publicColumns;
}

/**
 * Creates a new sheet in the destination spreadsheet folder.
 *
 * @returns {Sheet} The newly created sheet.
 */
function createNewSheet() {
  const folder = DriveApp.getFolderById(DESTINATION_SPREADSHEET_FOLDER_ID);
  const newSheetName = createNewSheetName();
  const newSheetFile = SpreadsheetApp.create(newSheetName);
  folder.addFile(DriveApp.getFileById(newSheetFile.getId()));
  const newSheet = newSheetFile.getActiveSheet();
  return newSheet;
}

/**
 * Copies data from the original sheet to the new sheet, considering only the public columns.
 *
 * @param {Sheet} originalSheet - The original sheet to copy data from.
 * @param {Sheet} newSheet - The new sheet to copy data to.
 * @param {number[]} publicColumnsIndexes - An array of column indices representing public columns.
 */
function copyDataToNewSheet(originalSheet, newSheet, publicColumnsIndexes) {
  const numRows = originalSheet.getLastRow();

  const lastPublicColumnIdx =
    publicColumnsIndexes[publicColumnsIndexes.length - 1];

  const rangeToCopy = originalSheet.getRange(
    1,
    1,
    numRows,
    lastPublicColumnIdx
  );

  const dataToCopy = rangeToCopy.getValues();
  const rangeToPaste = newSheet.getRange(1, 1, numRows, lastPublicColumnIdx);
  rangeToPaste.setValues(dataToCopy);
}

/**
 * Deletes columns in the specified sheet except for the specified column indices.
 *
 * @param {Sheet} sheet - The sheet to delete columns from.
 * @param {number[]} columnIndices - An array of column indices to preserve.
 */
function deleteColumnsExcept(sheet, columnIndices) {
  const numColumns = sheet.getLastColumn();
  for (let i = numColumns; i > 0; i--) {
    if (columnIndices.indexOf(i) === -1) {
      sheet.deleteColumn(i);
    }
  }
  SpreadsheetApp.flush();
}

/**
 * Makes the specified spreadsheet publicly accessible.
 *
 * @param {Spreadsheet} spreadsheet - The spreadsheet to make public.
 */
function makeSpreadsheetPublic(spreadsheet) {
  const id = spreadsheet.getId();
  DriveApp.getFileById(id).setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW
  );
}

/**
 * Creates a new sheet name with the current timestamp.
 *
 * @returns {string} The new sheet name.
 */
function createNewSheetName() {
  const now = new Date();
  const formattedDate = Utilities.formatDate(
    now,
    "GMT",
    "yyyy-MM-dd'T'HH:mm:ss'Z'"
  );
  const newSheetName = "PositiveBlockchain Data Snapshot - " + formattedDate;
  return newSheetName;
}
