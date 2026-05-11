function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function ensureSheetHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Waktu", "Nama", "Ormawa", "URL Foto", "Koordinat", "Alamat", "Link Maps"]);
  }
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function addOrmawaIfNew(ss, ormawaName) {
  const sheetOrmawa = ss.getSheetByName("ORMAWA");
  if (!sheetOrmawa) return;

  const normalizedName = normalizeText(ormawaName);
  if (!normalizedName) return;

  const lastRow = sheetOrmawa.getLastRow();
  const existing = lastRow > 0
    ? sheetOrmawa.getRange(1, 1, lastRow, 1).getValues().flat().map(normalizeKey)
    : [];

  if (!existing.includes(normalizeKey(normalizedName))) {
    sheetOrmawa.appendRow([normalizedName]);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e && e.parameter && e.parameter.action ? e.parameter.action : "";

  if (action === "getLogs") {
    return getPresenceLogs(ss);
  }
  
  return getOrmawaList(ss);
}

function getOrmawaList(ss) {
  const sheetOrmawa = ss.getSheetByName("ORMAWA");
  const sheetPresensi = ss.getSheetByName("Presensi");

  if (!sheetOrmawa) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastOrmawaRow = sheetOrmawa.getLastRow();
  const dataOrmawa = lastOrmawaRow > 0
    ? sheetOrmawa.getRange(1, 1, lastOrmawaRow, 1).getValues().flat()
      .map(normalizeText)
      .filter(Boolean)
    : [];

  let ormawaSudahHadir = [];
  if (sheetPresensi && sheetPresensi.getLastRow() > 1) {
    ormawaSudahHadir = sheetPresensi
      .getRange(2, 3, sheetPresensi.getLastRow() - 1, 1)
      .getValues()
      .flat()
      .map(normalizeKey)
      .filter(Boolean);
  }

  const daftarTersedia = dataOrmawa.filter(function(item) {
    const itemKey = normalizeKey(item);
    if (itemKey === "lainnya") return true;
    return !ormawaSudahHadir.includes(itemKey);
  });

  if (!daftarTersedia.some(function(item) { return normalizeKey(item) === "lainnya"; })) {
    daftarTersedia.push("Lainnya");
  }

  return ContentService.createTextOutput(JSON.stringify(daftarTersedia))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPresenceLogs(ss) {
  const sheet = ss.getSheetByName("Presensi");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  
  const result = data.map(row => {
    return {
      waktu: row[0] instanceof Date ? Utilities.formatDate(row[0], "GMT+7", "HH:mm") : "??:??",
      nama: row[1],
      ormawa: row[2],
      foto: row[3]
    };
  }).reverse();

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(body);

    const nama = normalizeText(data.nama);
    const ormawa = normalizeText(data.ormawa);
    const image = data.image || "";
    const lat = data.lat;
    const lng = data.long;
    const address = normalizeText(data.address);

    if (!nama || !ormawa || !image) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 400,
        error: "Nama, Ormawa, dan Foto wajib diisi"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetPresensi = ss.getSheetByName("Presensi");

    if (!sheetPresensi) {
      sheetPresensi = ss.insertSheet("Presensi");
    }
    ensureSheetHeaders(sheetPresensi);

    const folder = getOrCreateFolder("Foto Presensi Apps");

    const parts = String(image).split(",");
    if (parts.length < 2) {
      throw new Error("Format image tidak valid");
    }

    const contentType = parts[0].split(":")[1].split(";")[0];
    const bytes = Utilities.base64Decode(parts[1]);
    const safeOrmawa = ormawa.replace(/[\\/:*?"<>|]/g, "-");
    const fileName = "Presensi_" + safeOrmawa + "_" + new Date().getTime() + ".jpg";

    const blob = Utilities.newBlob(bytes, contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const mapsLink = "https://www.google.com/maps?q=" + lat + "," + lng;
    const koordinat = lat + ", " + lng;

    sheetPresensi.appendRow([
      new Date(),
      nama,
      ormawa,
      file.getUrl(),
      koordinat,
      address,
      mapsLink
    ]);

    // Save new ORMAWA values from custom input so they become future dropdown options.
    addOrmawaIfNew(ss, ormawa);

    return ContentService.createTextOutput(JSON.stringify({ status: 200, message: "Berhasil" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 500, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
