const SHEET_NAME = 'PUI Click Logs';
const HEADERS = [
  'Received At',
  'Readable Time',
  'ISO Timestamp',
  'Action',
  'Page URL',
  'Referrer',
  'Viewport',
  'User Agent',
  'Location Source',
  'Geolocation Permission',
  'IP Address',
  'IP Type',
  'IP City',
  'IP Region',
  'IP Region Code',
  'IP Country',
  'IP Country Code',
  'IP Continent',
  'IP Postal',
  'IP Latitude',
  'IP Longitude',
  'IP Timezone',
  'IP Flag',
  'IP Connection Org',
  'IP Connection ISP',
  'IP Lookup Success'
];

function doPost(event) {
  const sheet = getLogSheet_();
  const payload = parsePayload_(event);

  sheet.appendRow([
    new Date(),
    payload.readableTime || '',
    payload.timestamp || '',
    payload.action || '',
    payload.pageUrl || '',
    payload.referrer || '',
    payload.viewport || '',
    payload.userAgent || '',
    payload.locationSource || '',
    payload.geolocationPermission || '',
    payload.ipAddress || '',
    payload.ipType || '',
    payload.ipCity || '',
    payload.ipRegion || '',
    payload.ipRegionCode || '',
    payload.ipCountry || '',
    payload.ipCountryCode || '',
    payload.ipContinent || '',
    payload.ipPostal || '',
    payload.ipLatitude || '',
    payload.ipLongitude || '',
    payload.ipTimezone || '',
    payload.ipFlag || '',
    payload.ipConnectionOrg || '',
    payload.ipConnectionIsp || '',
    payload.ipLookupSuccess || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput('PUI logger is running')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getLogSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);

  return sheet;
}

function ensureHeaders_(sheet) {
  const existingHeaderRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1));
  const existingHeaders = existingHeaderRange.getValues()[0];

  if (existingHeaders.length !== HEADERS.length || HEADERS.some((header, index) => existingHeaders[index] !== header)) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function parsePayload_(event) {
  try {
    return JSON.parse(event.postData.contents || '{}');
  } catch (error) {
    return { action: 'invalid log payload', raw: event.postData && event.postData.contents };
  }
}
