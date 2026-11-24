/**
 * Soha Outfit — order receiver (Google Apps Script web app)
 *
 * এই কোডে কোনো পাসওয়ার্ড নেই। পাসওয়ার্ড আপনি নিজে Google Sheet-এর
 * "Settings" শিটের B1 ঘরে লিখবেন। শুধু সেই পাসওয়ার্ড দিয়েই অর্ডার লিস্ট
 * দেখা ও স্ট্যাটাস বদলানো যাবে। নতুন অর্ডার যে কেউ পাঠাতে পারবে (কাস্টমার)।
 *
 * Settings শিট:
 *   A1 admin_password   B1 <আপনার পাসওয়ার্ড>
 *   A2 notify_email     B2 <নতুন অর্ডারে ইমেইল পেতে চাইলে ইমেইল ঠিকানা, না চাইলে খালি>
 */

var ORDERS_SHEET = "Orders";
var SETTINGS_SHEET = "Settings";
var HEADERS = ["ID", "Time", "Status", "Name", "Phone", "Address", "Area", "Delivery",
  "Code", "Product", "Size", "Qty", "Price", "Total", "Note", "Page"];
var STATUSES = ["New", "Confirmed", "Delivered", "Cancelled"];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ordersSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(ORDERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(ORDERS_SHEET);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function settingsSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
    sh.getRange("A1:A2").setValues([["admin_password"], ["notify_email"]]);
  }
  return sh;
}

function setting_(row) {
  return String(settingsSheet_().getRange(row, 2).getValue() || "").trim();
}

function checkKey_(key) {
  var pass = setting_(1);
  return pass.length >= 4 && String(key || "") === pass;
}

/** Spreadsheet formula injection থেকে বাঁচাতে */
function clean_(v, max) {
  var s = String(v == null ? "" : v).slice(0, max || 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/** প্রথমবার Run করে অনুমতি (Authorize) দিন — শিটগুলো তৈরি হবে */
function setup() {
  ordersSheet_();
  settingsSheet_();
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "ping") return json_({ ok: true, app: "soha-outfit-orders" });
  if (p.action !== "list") return json_({ ok: true, app: "soha-outfit-orders" });
  if (!checkKey_(p.key)) return json_({ ok: false, error: "wrong_password" });
  var sh = ordersSheet_();
  var values = sh.getDataRange().getDisplayValues();
  var head = values.shift() || HEADERS;
  var out = values.filter(function (r) { return r[0]; }).map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h.toLowerCase()] = r[i]; });
    return o;
  }).reverse();
  return json_({ ok: true, orders: out });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (err) { return json_({ ok: false, error: "bad_json" }); }

  if (body.action === "order") return newOrder_(body.order || {});
  if (body.action === "status") {
    if (!checkKey_(body.key)) return json_({ ok: false, error: "wrong_password" });
    return setStatus_(String(body.id || ""), String(body.status || ""));
  }
  return json_({ ok: false, error: "unknown_action" });
}

function newOrder_(o) {
  if (o.website) return json_({ ok: true, id: "SO-0" }); // spam bot honeypot
  var name = String(o.name || "").trim();
  var phone = String(o.phone || "").replace(/[\s-]/g, "");
  var address = String(o.address || "").trim();
  if (!name || !address || !/^(\+?880|0)1[3-9]\d{8}$/.test(phone)) {
    return json_({ ok: false, error: "invalid" });
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = ordersSheet_();
    var id = "#" + (1000 + sh.getLastRow()); // 1st order = #1001
    var tz = ss_().getSpreadsheetTimeZone() || "Asia/Dhaka";
    var time = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
    sh.appendRow([
      id, time, "New", clean_(name, 100), "'" + phone, clean_(address, 400), clean_(o.area, 40),
      Number(o.delivery) || "", clean_(o.code, 20), clean_(o.product, 200), clean_(o.size, 30),
      Number(o.qty) || 1, Number(o.price) || "", Number(o.total) || "", clean_(o.note, 300), clean_(o.page, 200)
    ]);
  } finally {
    lock.releaseLock();
  }
  var mail = setting_(2);
  if (mail) {
    try {
      MailApp.sendEmail(mail, "নতুন অর্ডার " + id + " — " + (o.code || ""),
        "নাম: " + name + "\nমোবাইল: " + phone + "\nঠিকানা: " + address +
        "\nপণ্য: " + (o.code || "") + " " + (o.product || "") + "\nসাইজ: " + (o.size || "-") +
        "\nপরিমাণ: " + (o.qty || 1) + "\nসর্বমোট: " + (o.total || "-") + " টাকা\nনোট: " + (o.note || "-"));
    } catch (err) { /* ইমেইল না গেলেও অর্ডার সেভ থাকবে */ }
  }
  return json_({ ok: true, id: id });
}

function setStatus_(id, status) {
  if (STATUSES.indexOf(status) === -1) return json_({ ok: false, error: "bad_status" });
  var sh = ordersSheet_();
  var ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues();
  for (var i = 1; i < ids.length; i++) {
    if (ids[i][0] === id) {
      sh.getRange(i + 1, 3).setValue(status);
      return json_({ ok: true, id: id, status: status });
    }
  }
  return json_({ ok: false, error: "not_found" });
}
